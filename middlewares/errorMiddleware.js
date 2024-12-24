const logger = require('../common/logger');
const { loadEnvConfig } = require('../configs/env');
loadEnvConfig();

function errorMiddleware(err, req, res, next) {
  // Log the error stack trace for debugging purposes (only in development)
  logger.error(err.stack || err);

  // Set the status code, defaulting to 500 if not provided
  const statusCode = err.status || 500;

  // Prepare the error details to be passed to the view
  const errorDetails = process.env.NODE_ENV === 'development' ? err : {};

  // Ensure that the error message and error details are passed to the view
  res.status(statusCode).render('error', {
    message: err.message || 'Something went wrong!',
    error: errorDetails
  });
}

module.exports = errorMiddleware;
