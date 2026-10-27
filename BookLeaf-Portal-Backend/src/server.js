const env = require('./config/env'); // loads + validates env first
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`API listening on port ${env.port} (${env.nodeEnv})`);
    if (!env.anthropicApiKey) {
      logger.warn('ANTHROPIC_API_KEY not set: AI features disabled, manual fallback mode.');
    }
  });

  // Graceful shutdown so in-flight requests finish and DB closes cleanly.
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});