const app = require('./src/app');
const config = require('./src/config');
const { PrismaClient } = require('@prisma/client');
const { syncMockPrices } = require('./src/services/mockData.service');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Sync mock data on startup if needed
    if (config.useMockData) {
      console.log('📊 Syncing mock price data...');
      const count = await syncMockPrices(prisma);
      console.log(`✅ Synced ${count} price records`);
    }

    // Start server
    app.listen(config.port, () => {
      console.log(`\n🌾 AgriTrade AI Server running on http://localhost:${config.port}`);
      console.log(`📋 API Health: http://localhost:${config.port}/api/health`);
      console.log(`🔧 Environment: ${config.nodeEnv}`);
      console.log(`📦 Mock Data: ${config.useMockData ? 'ON' : 'OFF'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
