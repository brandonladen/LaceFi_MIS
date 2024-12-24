const dotenv = require('dotenv');
const path = require('path');
const logger = require('../common/logger');

function loadEnvConfig() {
  try {
    // Attempt to load the .env file
    const envPath = path.join(__dirname, '../.env');
    dotenv.config({ path: envPath });

    // Validate required environment variables
    const requiredEnvVars = [
      'JWT_SECRET',
      // Add other required env vars here
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      logger.warn(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Ensure the .env file exists and contains: ${missingEnvVars.join(', ')}`);
      }
    }

    logger.info('Environment variables loaded successfully');
  } catch (error) {
    logger.error('Error loading environment variables:', error);
    process.exit(1); // Exit if env vars can't be loaded
  }
}

module.exports = { loadEnvConfig };
