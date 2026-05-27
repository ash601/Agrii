const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { syncLivePrices } = require('../services/mandi.service');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/prices - List prices with filters
router.get('/', async (req, res, next) => {
  try {
    const { commodity, state, market, from, to, page = 1, limit = 20 } = req.query;

    const where = {};
    if (commodity) where.commodity = commodity;
    if (state) where.state = state;
    if (market) where.market = market;
    if (from || to) {
      where.arrivalDate = {};
      if (from) where.arrivalDate.gte = new Date(from);
      if (to) where.arrivalDate.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [prices, total] = await Promise.all([
      prisma.mandiPrice.findMany({
        where,
        orderBy: { arrivalDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.mandiPrice.count({ where }),
    ]);

    res.json({
      prices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/commodities - Get distinct commodities
router.get('/commodities', async (req, res, next) => {
  try {
    const commodities = await prisma.mandiPrice.findMany({
      select: { commodity: true },
      distinct: ['commodity'],
      orderBy: { commodity: 'asc' },
    });
    res.json(commodities.map(c => c.commodity));
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/states - Get distinct states
router.get('/states', async (req, res, next) => {
  try {
    const states = await prisma.mandiPrice.findMany({
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });
    res.json(states.map(s => s.state));
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/markets - Get markets for a state
router.get('/markets', async (req, res, next) => {
  try {
    const { state } = req.query;
    const where = state ? { state } : {};
    const markets = await prisma.mandiPrice.findMany({
      where,
      select: { market: true },
      distinct: ['market'],
      orderBy: { market: 'asc' },
    });
    res.json(markets.map(m => m.market));
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/trends - Get price trend data
router.get('/trends', async (req, res, next) => {
  try {
    const { commodity, state, days = 30 } = req.query;

    if (!commodity) {
      return res.status(400).json({ error: 'Commodity is required.' });
    }

    const where = { commodity };
    if (state) where.state = state;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    where.arrivalDate = { gte: fromDate };

    const prices = await prisma.mandiPrice.findMany({
      where,
      orderBy: { arrivalDate: 'asc' },
      select: {
        arrivalDate: true,
        modalPrice: true,
        minPrice: true,
        maxPrice: true,
        market: true,
        state: true,
      },
    });

    // Aggregate by date
    const trendMap = {};
    prices.forEach(p => {
      const dateKey = p.arrivalDate.toISOString().split('T')[0];
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, prices: [], min: Infinity, max: -Infinity };
      }
      trendMap[dateKey].prices.push(p.modalPrice);
      trendMap[dateKey].min = Math.min(trendMap[dateKey].min, p.minPrice);
      trendMap[dateKey].max = Math.max(trendMap[dateKey].max, p.maxPrice);
    });

    const trend = Object.values(trendMap).map(d => ({
      date: d.date,
      avgPrice: Math.round(d.prices.reduce((a, b) => a + b, 0) / d.prices.length),
      minPrice: d.min === Infinity ? 0 : d.min,
      maxPrice: d.max === -Infinity ? 0 : d.max,
    }));

    res.json(trend);
  } catch (error) {
    next(error);
  }
});

// POST /api/prices/sync - Manual sync trigger (always live data from data.gov.in)
router.post('/sync', async (req, res, next) => {
  try {
    const count = await syncLivePrices(prisma);
    res.json({ message: `Successfully synced ${count} live records from Data.gov.in API!` });
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/stats - Dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const { commodity, state } = req.query;
    const where = {};
    if (commodity) where.commodity = commodity;
    if (state) where.state = state;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Current week average
    const currentWeek = await prisma.mandiPrice.aggregate({
      where: { ...where, arrivalDate: { gte: sevenDaysAgo } },
      _avg: { modalPrice: true },
      _count: true,
    });

    // Previous week average
    const prevWeek = await prisma.mandiPrice.aggregate({
      where: { ...where, arrivalDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      _avg: { modalPrice: true },
    });

    const totalMarkets = await prisma.mandiPrice.findMany({
      where,
      select: { market: true },
      distinct: ['market'],
    });

    const avgPrice = Math.round(currentWeek._avg.modalPrice || 0);
    const prevAvg = prevWeek._avg.modalPrice || avgPrice;
    const trendPercent = prevAvg ? ((avgPrice - prevAvg) / prevAvg * 100).toFixed(1) : 0;

    res.json({
      avgPrice,
      totalRecords: currentWeek._count,
      totalMarkets: totalMarkets.length,
      trendPercent: parseFloat(trendPercent),
      trendDirection: trendPercent >= 0 ? 'UP' : 'DOWN',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
