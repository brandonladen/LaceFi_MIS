const logger = require('../common/logger');

function loggerMiddleware(req, res, next) {
  logger.info(`${req.method} ${req.url}`);
  next();
}

module.exports = loggerMiddleware;