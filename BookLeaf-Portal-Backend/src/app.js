const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

// --- Routes ---
// Health check (public): used by the host to verify the service is up.
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Feature routes get mounted here in later commits:
// app.use('/api/v1', require('./routes'));

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;