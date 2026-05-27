const config = require('../config');

// Simple in-memory cache to prevent spamming OpenWeather limits
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch real-time weather data for a specific location in India
 * @param {string} state - The Indian state
 * @param {string} district - Optional specific district/city
 * @returns {Promise<Object>} Formatted weather object
 */
async function getLiveWeather(state, district) {
  const query = district ? `${district},${state},IN` : `${state},IN`;
  const cacheKey = query.toLowerCase();

  // Return cached result if fresh
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // If API key is missing, return a sensible default
  if (!config.openWeatherApiKey) {
    console.warn('OPENWEATHER_API_KEY not set. Returning default weather data.');
    return {
      temperature: 30,
      humidity: 65,
      condition: 'Unavailable',
      city: query,
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${config.openWeatherApiKey}&units=metric`;
    
    // Workaround for Node.js ETIMEDOUT macOS network blocking
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const curlCmd = `curl -s "${url}"`;
    const { stdout } = await execAsync(curlCmd, { maxBuffer: 5 * 1024 * 1024 });

    if (!stdout || stdout.trim() === '') {
      throw new Error(`OpenWeather empty response`);
    }

    const rawData = JSON.parse(stdout);

    // Filter out 404s
    if (rawData.cod === '404' || rawData.message === 'city not found') {
      if (district) {
        return await getLiveWeather(state, null);
      }
      throw new Error(`OpenWeather API error: city not found`);
    }

    if (rawData.cod && rawData.cod !== 200) {
      throw new Error(`OpenWeather API error: ${rawData.message}`);
    }
    
    const weatherData = {
      temperature: rawData.main.temp,
      humidity: rawData.main.humidity,
      condition: rawData.weather[0]?.main || 'Clear',
      city: rawData.name,
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: Date.now(), data: weatherData });

    return weatherData;
  } catch (err) {
    console.error(`Failed to fetch live weather for ${query}:`, err.message);
    // Graceful degradation on failure (simulate normal conditions)
    return {
      temperature: 30,
      humidity: 65,
      condition: 'Unknown',
      city: query,
    };
  }
}

module.exports = {
  getLiveWeather,
};
