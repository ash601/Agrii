const config = require('../config');

// Parse DD/MM/YYYY into a JS Date object safely
function parseArrivalDate(dateString) {
  if (!dateString) return new Date();
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
  }
  return new Date(dateString);
}

// Format a JS Date as DD/MM/YYYY for the API filter
function formatDateForApi(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Fetch and sync live market prices from data.gov.in
 * Tries recent dates backwards until it finds available data,
 * then syncs multiple days of the latest records.
 * @param {import('@prisma/client').PrismaClient} prisma 
 * @returns {Promise<Number>} count of records synced
 */
async function syncLivePrices(prisma) {
  if (!config.dataGovApiKey) {
    throw new Error('DATA_GOV_API_KEY is required to sync live prices.');
  }

  const { execSync } = require('child_process');
  let totalSynced = 0;

  // Step 1: Find the latest date that has data using smart probing
  // Probe monthly jumps (max ~24 calls for 2 years), then narrow down day-by-day
  console.log('🔍 Probing for the latest available data on data.gov.in...');
  let latestDateWithData = null;
  const today = new Date();

  /**
   * Helper: check if a given date has data in the API
   */
  function probeDate(date) {
    const dateStr = formatDateForApi(date);
    try {
      const probeUrl = `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${config.dataGovApiKey}&format=json&limit=1&filters%5BArrival_Date%5D=${dateStr}`;
      const curlCmd = `curl -s "${probeUrl}"`;
      const stdout = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 });
      const data = JSON.parse(stdout.toString());
      return (data.total && data.total > 0) ? data.total : 0;
    } catch (err) {
      return 0;
    }
  }

  // Phase 1: Monthly jumps — probe the 15th of each month going back 2 years
  let roughMonth = null;
  for (let monthsBack = 0; monthsBack <= 24; monthsBack++) {
    const probeD = new Date(today.getFullYear(), today.getMonth() - monthsBack, 15);
    if (probeD > today) continue;
    const total = probeDate(probeD);
    if (total > 0) {
      roughMonth = probeD;
      console.log(`📅 Found data in ${formatDateForApi(probeD)} (${total} records) — narrowing...`);
      break;
    }
    // Also try the 1st of each month (in case 15th is a holiday)
    const probeD2 = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
    const total2 = probeDate(probeD2);
    if (total2 > 0) {
      roughMonth = probeD2;
      console.log(`📅 Found data in ${formatDateForApi(probeD2)} (${total2} records) — narrowing...`);
      break;
    }
  }

  if (roughMonth) {
    // Phase 2: From the found month, scan forward day-by-day to find the latest day with data
    // Start from end of that month and go forward into the next month
    const searchStart = new Date(roughMonth);
    searchStart.setMonth(searchStart.getMonth() + 1); // go to next month
    searchStart.setDate(0); // last day of the found month

    // Try up to 45 days forward from the rough date (in case there's newer data in following weeks)
    for (let dayOffset = 45; dayOffset >= -15; dayOffset--) {
      const checkDate = new Date(roughMonth);
      checkDate.setDate(roughMonth.getDate() + dayOffset);
      if (checkDate > today) continue;

      const total = probeDate(checkDate);
      if (total > 0) {
        latestDateWithData = checkDate;
        console.log(`✅ Latest data: ${formatDateForApi(checkDate)} (${total} records)`);
        break;
      }
    }

    // If forward scan didn't improve, use the rough date
    if (!latestDateWithData) latestDateWithData = roughMonth;
  }

  if (!latestDateWithData) {
    throw new Error('Could not find any available data on data.gov.in. The API may be temporarily unavailable.');
  }

  // Step 2: Fetch data for the latest date + a few surrounding days for a richer dataset
  const daysToFetch = 7; // Fetch the latest 7 days that have data
  let daysFound = 0;

  for (let daysBack = 0; daysFound < daysToFetch && daysBack <= 30; daysBack++) {
    const fetchDate = new Date(latestDateWithData);
    fetchDate.setDate(latestDateWithData.getDate() - daysBack);
    const dateStr = formatDateForApi(fetchDate);

    try {
      const count = await fetchAndUpsert(prisma, dateStr, 500);
      if (count > 0) {
        daysFound++;
        totalSynced += count;
        console.log(`📊 ${dateStr}: synced ${count} records`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to fetch for ${dateStr}:`, err.message);
    }
  }

  console.log(`\n🎉 Total synced: ${totalSynced} live records from data.gov.in`);
  return totalSynced;
}

/**
 * Fetch records for a specific date (or no filter) and upsert into the DB
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string|null} dateFilter - DD/MM/YYYY format, or null for no filter
 * @param {number} limit - max records per request
 * @returns {Promise<number>} count of records synced
 */
async function fetchAndUpsert(prisma, dateFilter, limit = 500) {
  const { execSync } = require('child_process');

  let endpoint = `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${config.dataGovApiKey}&format=json&limit=${limit}`;
  if (dateFilter) {
    endpoint += `&filters%5BArrival_Date%5D=${dateFilter}`;
  }

  let allRecords = [];
  let offset = 0;
  const maxPages = 4; // Max 4 pages × 500 = 2000 records per date

  // Paginate through results for this date
  for (let page = 0; page < maxPages; page++) {
    try {
      const pageUrl = `${endpoint}&offset=${offset}`;
      const curlCmd = `curl -s "${pageUrl}"`;
      const stdout = execSync(curlCmd, { maxBuffer: 50 * 1024 * 1024, timeout: 30000 });

      if (!stdout || stdout.toString().trim() === '') break;

      const data = JSON.parse(stdout.toString());
      const records = data.records || [];

      if (records.length === 0) break;

      allRecords = allRecords.concat(records);
      offset += limit;

      // If we got fewer than limit, no more pages
      if (records.length < limit) break;
    } catch (err) {
      console.warn('Pagination error:', err.message);
      break;
    }
  }

  if (allRecords.length === 0) return 0;

  let syncedCount = 0;

  for (const record of allRecords) {
    if (!record.State || !record.Market || !record.Commodity || !record.Arrival_Date) {
      continue;
    }

    const arrivalDate = parseArrivalDate(record.Arrival_Date);
    const variety = record.Variety || 'Other';

    const minPrice = parseFloat(record.Min_Price) || 0;
    const maxPrice = parseFloat(record.Max_Price) || 0;
    const modalPrice = parseFloat(record.Modal_Price) || 0;

    // Skip invalid price rows
    if (modalPrice === 0) continue;

    try {
      await prisma.mandiPrice.upsert({
        where: {
          state_market_commodity_variety_arrivalDate: {
            state: record.State,
            market: record.Market,
            commodity: record.Commodity,
            variety: variety,
            arrivalDate: arrivalDate,
          }
        },
        update: {
          minPrice,
          maxPrice,
          modalPrice,
          grade: record.Grade || null,
        },
        create: {
          state: record.State,
          district: record.District || record.Market,
          market: record.Market,
          commodity: record.Commodity,
          variety: variety,
          grade: record.Grade || null,
          arrivalDate: arrivalDate,
          minPrice,
          maxPrice,
          modalPrice,
        }
      });
      syncedCount++;
    } catch (err) {
      // Silently skip problematic records
    }
  }

  return syncedCount;
}

module.exports = {
  syncLivePrices,
};
