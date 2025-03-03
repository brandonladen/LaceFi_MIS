const app = require('./app');
const { loadEnvConfig } = require('./configs/env');
const logger = require('./common/logger');
loadEnvConfig();

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
});