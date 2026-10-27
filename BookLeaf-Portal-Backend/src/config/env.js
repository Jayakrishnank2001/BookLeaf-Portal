// Loads and validates environment variables once, at startup.
// Missing required values crash the app immediately instead of failing later at runtime.
require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // AI key is intentionally optional: without it the AI layer is disabled
  // and the app falls back to manual triage/replies.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
  aiModel: process.env.AI_MODEL || 'claude-haiku-4-5',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 10000,
});

module.exports = env;