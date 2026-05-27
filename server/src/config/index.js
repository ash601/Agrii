const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dataGovApiKey: process.env.DATA_GOV_API_KEY,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  nodeEnv: process.env.NODE_ENV || 'development',
};
