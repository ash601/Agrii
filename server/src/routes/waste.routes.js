const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getLiveWeather } = require('../services/weather.service');

const router = express.Router();
const prisma = new PrismaClient();

// Spoilage thresholds by commodity
const SPOILAGE_THRESHOLDS = {
  'Tomato': { tempMax: 25, humidityMax: 80, shelfDays: 7, category: 'Perishable' },
  'Onion': { tempMax: 30, humidityMax: 70, shelfDays: 30, category: 'Semi-Perishable' },
  'Potato': { tempMax: 15, humidityMax: 85, shelfDays: 60, category: 'Semi-Perishable' },
  'Rice': { tempMax: 35, humidityMax: 65, shelfDays: 180, category: 'Non-Perishable' },
  'Wheat': { tempMax: 30, humidityMax: 60, shelfDays: 365, category: 'Non-Perishable' },
  'Banana': { tempMax: 28, humidityMax: 75, shelfDays: 5, category: 'Perishable' },
  'Apple': { tempMax: 10, humidityMax: 85, shelfDays: 30, category: 'Semi-Perishable' },
  'Green Chilli': { tempMax: 20, humidityMax: 75, shelfDays: 10, category: 'Perishable' },
  'Maize': { tempMax: 30, humidityMax: 60, shelfDays: 180, category: 'Non-Perishable' },
  'Cotton': { tempMax: 35, humidityMax: 60, shelfDays: 365, category: 'Non-Perishable' },
  'Soyabean': { tempMax: 30, humidityMax: 65, shelfDays: 120, category: 'Non-Perishable' },
  'Mustard': { tempMax: 30, humidityMax: 60, shelfDays: 180, category: 'Non-Perishable' },
};

// GET /api/waste-risk
router.get('/', async (req, res, next) => {
  try {
    const { commodity, state, district } = req.query;

    if (!commodity || !state) {
      return res.status(400).json({ error: 'Commodity and state are required.' });
    }

    // Get live weather data (falls back to mock if configured or fails)
    const weather = await getLiveWeather(state, district);

    // Get threshold for this commodity
    const threshold = SPOILAGE_THRESHOLDS[commodity] || {
      tempMax: 30, humidityMax: 70, shelfDays: 30, category: 'General',
    };

    // Calculate market surplus
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const recentArrivals = await prisma.mandiPrice.count({
      where: { commodity, state, arrivalDate: { gte: sevenDaysAgo } },
    });

    const avgArrivals = await prisma.mandiPrice.count({
      where: { commodity, state, arrivalDate: { gte: thirtyDaysAgo } },
    });

    const avgWeeklyArrivals = avgArrivals / 4 || 1;
    const surplusRatio = recentArrivals / avgWeeklyArrivals;

    // Calculate risk factors (0-100 each)
    const tempFactor = weather.temperature > threshold.tempMax
      ? Math.min(100, ((weather.temperature - threshold.tempMax) / threshold.tempMax) * 200)
      : 0;

    const humidityFactor = weather.humidity > threshold.humidityMax
      ? Math.min(100, ((weather.humidity - threshold.humidityMax) / threshold.humidityMax) * 200)
      : 0;

    const surplusFactor = surplusRatio > 1
      ? Math.min(100, (surplusRatio - 1) * 60)
      : 0;

    // Weighted total risk score
    const riskScore = Math.round(
      tempFactor * 0.4 + humidityFactor * 0.3 + surplusFactor * 0.3
    );

    const clampedScore = Math.max(0, Math.min(100, riskScore));

    // Risk level classification
    let riskLevel, recommendation, color;
    if (clampedScore <= 33) {
      riskLevel = 'LOW';
      recommendation = `Safe to hold. ${commodity} can be stored for ${threshold.shelfDays}+ days under current conditions.`;
      color = '#10B981';
    } else if (clampedScore <= 66) {
      riskLevel = 'MEDIUM';
      recommendation = `Consider selling within ${Math.ceil(threshold.shelfDays / 3)} days. Monitor temperature and humidity closely.`;
      color = '#F59E0B';
    } else {
      riskLevel = 'HIGH';
      recommendation = `Sell immediately or arrange cold storage. Current conditions accelerate spoilage significantly.`;
      color = '#EF4444';
    }

    res.json({
      commodity,
      state,
      district: district || 'All Districts',
      category: threshold.category,
      riskScore: clampedScore,
      riskLevel,
      recommendation,
      color,
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        condition: weather.condition,
        city: weather.city,
      },
      factors: {
        temperature: {
          current: weather.temperature,
          threshold: threshold.tempMax,
          score: Math.round(tempFactor),
          status: weather.temperature > threshold.tempMax ? 'EXCEEDS' : 'SAFE',
        },
        humidity: {
          current: weather.humidity,
          threshold: threshold.humidityMax,
          score: Math.round(humidityFactor),
          status: weather.humidity > threshold.humidityMax ? 'EXCEEDS' : 'SAFE',
        },
        marketSurplus: {
          ratio: parseFloat(surplusRatio.toFixed(2)),
          score: Math.round(surplusFactor),
          status: surplusRatio > 1.5 ? 'HIGH_SURPLUS' : surplusRatio > 1 ? 'MODERATE' : 'NORMAL',
        },
      },
      shelfLife: {
        normal: threshold.shelfDays,
        adjusted: Math.max(1, Math.round(threshold.shelfDays * (1 - clampedScore / 200))),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/waste-risk/commodities - Get supported commodities
router.get('/commodities', (req, res) => {
  const commodities = Object.entries(SPOILAGE_THRESHOLDS).map(([name, data]) => ({
    name,
    category: data.category,
    shelfDays: data.shelfDays,
  }));
  res.json(commodities);
});

module.exports = router;
