const { PrismaClient } = require('@prisma/client');
const { syncLivePrices } = require('../src/services/mandi.service');

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🧹 Purging old mock MandiPrice records...');
    const deleted = await prisma.mandiPrice.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} historical price records.`);

    // Optional: purge demand forecasts as they rely on price history
    console.log('🧹 Purging old DemandForecast records...');
    await prisma.demandForecast.deleteMany({});
    console.log('✅ DemandForecast records purged.');

    console.log('🚀 Synchronizing live prices from Data.gov.in (AGMARKNET)...');
    console.log('   (This will fetch the latest daily snapshot for all commodities/markets)');
    const count = await syncLivePrices(prisma);
    
    console.log(`\n🎉 Live Data Sync Complete! Successfully inserted ${count} live price records.`);
  } catch (error) {
    console.error('\n❌ Error during live data sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
