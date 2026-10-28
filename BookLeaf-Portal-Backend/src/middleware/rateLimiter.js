const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const build = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(message, 429, 'RATE_LIMITED')),
  });

// Slows down password guessing.
const loginLimiter = build(15 * 60 * 1000, 30, 'Too many login attempts. Please try again later.');

// Protects against ticket spam, which would also drive up AI costs.
const createTicketLimiter = build(60 * 60 * 1000, 60, 'Too many tickets submitted. Please try again later.');

module.exports = { loginLimiter, createTicketLimiter };