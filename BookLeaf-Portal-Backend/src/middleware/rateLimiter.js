const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Slows down password guessing. Uses the same error shape as the rest of the API.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new AppError('Too many login attempts. Please try again later.', 429, 'RATE_LIMITED')),
});

module.exports = { loginLimiter };