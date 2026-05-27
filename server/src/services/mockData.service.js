// Mock data service - generates realistic Indian agricultural market data
// Used when USE_MOCK_DATA=true (no API keys needed)

const COMMODITIES = [
  { name: 'Rice', varieties: ['Basmati', 'Sona Masoori', 'Ponni', 'IR-64'], basePrice: 2400 },
  { name: 'Wheat', varieties: ['Sharbati', 'Lokwan', 'MP Wheat'], basePrice: 2100 },
  { name: 'Tomato', varieties: ['Local', 'Hybrid', 'Desi'], basePrice: 1800 },
  { name: 'Onion', varieties: ['Red', 'White', 'Pink'], basePrice: 1200 },
  { name: 'Potato', varieties: ['Jyoti', 'Kufri', 'Local'], basePrice: 800 },
  { name: 'Soyabean', varieties: ['Yellow', 'Black'], basePrice: 4200 },
  { name: 'Maize', varieties: ['Yellow', 'White', 'Hybrid'], basePrice: 1900 },
  { name: 'Cotton', varieties: ['DCH-32', 'Bunny', 'H-6'], basePrice: 6500 },
  { name: 'Mustard', varieties: ['Yellow', 'Black', 'Rai'], basePrice: 5000 },
  { name: 'Green Chilli', varieties: ['Guntur', 'Byadgi', 'Local'], basePrice: 3000 },
  { name: 'Banana', varieties: ['Robusta', 'Cavendish', 'Poovan'], basePrice: 1500 },
  { name: 'Apple', varieties: ['Royal Delicious', 'Golden', 'Shimla'], basePrice: 8000 },
];

const STATES_MARKETS = {
  'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Haryana': ['Karnal', 'Hisar', 'Rohtak', 'Panipat', 'Ambala'],
  'Uttar Pradesh': ['Lucknow', 'Agra', 'Varanasi', 'Kanpur', 'Allahabad'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara', 'Mehsana'],
  'Karnataka': ['Bangalore', 'Hubli', 'Mysore', 'Belgaum', 'Shimoga'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
  'West Bengal': ['Kolkata', 'Siliguri', 'Durgapur', 'Asansol', 'Bardhaman'],
  'Andhra Pradesh': ['Vijayawada', 'Guntur', 'Kurnool', 'Tirupati', 'Nellore'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
};

const WEATHER_DATA = {
  'Punjab': { temp: 32, humidity: 55, condition: 'Clear' },
  'Haryana': { temp: 34, humidity: 50, condition: 'Hazy' },
  'Uttar Pradesh': { temp: 35, humidity: 60, condition: 'Partly Cloudy' },
  'Madhya Pradesh': { temp: 36, humidity: 45, condition: 'Clear' },
  'Maharashtra': { temp: 33, humidity: 65, condition: 'Partly Cloudy' },
  'Rajasthan': { temp: 38, humidity: 30, condition: 'Clear' },
  'Gujarat': { temp: 35, humidity: 55, condition: 'Clear' },
  'Karnataka': { temp: 28, humidity: 70, condition: 'Cloudy' },
  'Tamil Nadu': { temp: 30, humidity: 75, condition: 'Humid' },
  'West Bengal': { temp: 31, humidity: 80, condition: 'Humid' },
  'Andhra Pradesh': { temp: 34, humidity: 65, condition: 'Partly Cloudy' },
  'Telangana': { temp: 35, humidity: 60, condition: 'Clear' },
};

function randomInRange(base, variance) {
  return Math.round(base + (Math.random() - 0.5) * 2 * variance);
}

function generatePriceRecords(daysBack = 60) {
  const records = [];
  const today = new Date();

  for (let day = daysBack; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(today.getDate() - day);
    date.setHours(0, 0, 0, 0);

    // Skip some days randomly (weekends, holidays)
    if (Math.random() < 0.15) continue;

    COMMODITIES.forEach(commodity => {
      // Each commodity appears in 3-5 random states per day
      const stateEntries = Object.entries(STATES_MARKETS);
      const numStates = 3 + Math.floor(Math.random() * 3);
      const selectedStates = stateEntries
        .sort(() => Math.random() - 0.5)
        .slice(0, numStates);

      selectedStates.forEach(([state, markets]) => {
        // 1-2 markets per state
        const numMarkets = 1 + Math.floor(Math.random() * 2);
        const selectedMarkets = markets
          .sort(() => Math.random() - 0.5)
          .slice(0, numMarkets);

        selectedMarkets.forEach(market => {
          const variety = commodity.varieties[Math.floor(Math.random() * commodity.varieties.length)];
          
          // Add seasonal variation
          const month = date.getMonth() + 1;
          let seasonalFactor = 1;
          if (commodity.name === 'Tomato' && [4, 5, 6].includes(month)) seasonalFactor = 1.4;
          if (commodity.name === 'Onion' && [8, 9, 10].includes(month)) seasonalFactor = 1.3;
          if (commodity.name === 'Rice' && [10, 11].includes(month)) seasonalFactor = 0.85;
          
          // Add daily trend (slight upward bias)
          const trendFactor = 1 + (daysBack - day) * 0.001;
          
          const baseWithSeason = commodity.basePrice * seasonalFactor * trendFactor;
          const variance = baseWithSeason * 0.15;
          
          const modalPrice = randomInRange(baseWithSeason, variance);
          const minPrice = Math.round(modalPrice * (0.85 + Math.random() * 0.05));
          const maxPrice = Math.round(modalPrice * (1.05 + Math.random() * 0.1));

          records.push({
            state,
            district: market,
            market,
            commodity: commodity.name,
            variety,
            grade: ['FAQ', 'Medium', 'Good'][Math.floor(Math.random() * 3)],
            arrivalDate: date,
            minPrice,
            maxPrice,
            modalPrice,
          });
        });
      });
    });
  }

  return records;
}

async function syncMockPrices(prisma) {
  const existingCount = await prisma.mandiPrice.count();
  
  if (existingCount > 100) {
    // Only add today's prices if data already exists
    const records = generatePriceRecords(1);
    let count = 0;
    for (const record of records) {
      try {
        await prisma.mandiPrice.create({ data: record });
        count++;
      } catch (e) {
        // Skip duplicates
      }
    }
    return count;
  }

  // Full initial sync
  const records = generatePriceRecords(60);
  let count = 0;
  
  // Batch insert
  for (const record of records) {
    try {
      await prisma.mandiPrice.create({ data: record });
      count++;
    } catch (e) {
      // Skip duplicates
    }
  }

  return count;
}

function getMockWeather(state, district) {
  const base = WEATHER_DATA[state] || { temp: 30, humidity: 60, condition: 'Clear' };
  return {
    temperature: base.temp + Math.round((Math.random() - 0.5) * 4),
    humidity: base.humidity + Math.round((Math.random() - 0.5) * 10),
    condition: base.condition,
    city: district || Object.keys(STATES_MARKETS[state] || {})[0] || state,
  };
}

function getMockPrices() {
  return generatePriceRecords(1);
}

module.exports = {
  generatePriceRecords,
  syncMockPrices,
  getMockPrices,
  getMockWeather,
  COMMODITIES,
  STATES_MARKETS,
};
