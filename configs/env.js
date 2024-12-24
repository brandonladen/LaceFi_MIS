const dotenv = require('dotenv');
const path = require('path');
const logger = require('../common/logger');

function loadEnvConfig() {
  try {
    const result = dotenv.config({ path: path.join(__dirname, '../.env') });
    
    if (result.error) {
      throw result.error;
    }

    // Validate required environment variables
    const requiredEnvVars = [
      'JWT_SECRET',
      // Add other required env vars here
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    logger.info('Environment variables loaded successfully');
  } catch (error) {
    logger.error('Error loading environment variables:', error);
    process.exit(1); // Exit if env vars can't be loaded
  }
}

module.exports = { loadEnvConfig };