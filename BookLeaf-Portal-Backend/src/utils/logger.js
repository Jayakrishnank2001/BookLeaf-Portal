// Minimal logger. Swap for pino/winston in production.
const stamp = () => new Date().toISOString();

module.exports = {
  info: (msg, ...args) => console.log(`[${stamp()}] INFO  ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${stamp()}] WARN  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${stamp()}] ERROR ${msg}`, ...args),
};