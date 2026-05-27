const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { syncMockPrices } = require('../src/services/mockData.service');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@demo.com' },
    update: {},
    create: {
      email: 'farmer@demo.com',
      passwordHash,
      name: 'Rajesh Kumar',
      role: 'FARMER',
      phone: '+91 98765 43210',
      state: 'Punjab',
      district: 'Amritsar',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      email: 'buyer@demo.com',
      passwordHash,
      name: 'Priya Sharma',
      role: 'BUYER',
      phone: '+91 98765 43211',
      state: 'Maharashtra',
      district: 'Pune',
    },
  });

  console.log('✅ Demo users created');
  console.log('   farmer@demo.com / password123');
  console.log('   buyer@demo.com / password123');

  // Sync mock price data
  console.log('📊 Generating mock price data (60 days)...');
  const count = await syncMockPrices(prisma);
  console.log(`✅ ${count} price records created`);

  // Create sample trade listings
  await prisma.tradeListing.createMany({
    data: [
      {
        userId: farmer.id,
        type: 'SELL',
        commodity: 'Rice',
        variety: 'Basmati',
        quantity: 50,
        pricePerQt: 2600,
        state: 'Punjab',
        district: 'Amritsar',
        market: 'Amritsar Mandi',
        description: 'Premium quality Basmati rice, freshly harvested. Grade A.',
        status: 'ACTIVE',
      },
      {
        userId: farmer.id,
        type: 'SELL',
        commodity: 'Wheat',
        variety: 'Sharbati',
        quantity: 100,
        pricePerQt: 2200,
        state: 'Punjab',
        district: 'Ludhiana',
        market: 'Ludhiana Mandi',
        description: 'High-quality Sharbati wheat, suitable for atta.',
        status: 'ACTIVE',
      },
      {
        userId: buyer.id,
        type: 'BUY',
        commodity: 'Tomato',
        variety: 'Hybrid',
        quantity: 200,
        pricePerQt: 1500,
        state: 'Maharashtra',
        district: 'Pune',
        description: 'Looking for fresh hybrid tomatoes for wholesale distribution.',
        status: 'ACTIVE',
      },
      {
        userId: buyer.id,
        type: 'BUY',
        commodity: 'Onion',
        variety: 'Red',
        quantity: 500,
        pricePerQt: 1100,
        state: 'Maharashtra',
        district: 'Nashik',
        description: 'Bulk purchase of Nashik red onions for export.',
        status: 'ACTIVE',
      },
    ],
  });
  console.log('✅ Sample trade listings created');

  // Create sample shipment
  const shipment = await prisma.shipment.create({
    data: {
      userId: farmer.id,
      commodity: 'Rice',
      quantity: 50,
      origin: 'Amritsar, Punjab',
      destination: 'Pune, Maharashtra',
      currentStage: 'IN_TRANSIT',
      stageHistory: {
        create: [
          { stage: 'PACKED', note: 'Bags packed and quality checked', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { stage: 'IN_TRANSIT', note: 'Loaded on truck, expected 3 days', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
      },
    },
  });
  console.log('✅ Sample shipment created');

  console.log('\n🎉 Seed complete!');
}

seed()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
