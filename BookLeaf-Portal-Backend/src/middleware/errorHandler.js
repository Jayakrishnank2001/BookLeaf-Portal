const { ZodError } = require('zod');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const logger = require('../utils/logger');

// Converts known library errors into AppError so every response has the same shape:
// { "error": { "code": "...", "message": "...", "details": [...] } }
function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Invalid ObjectId in a URL param, e.g. /tickets/abc
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
  }

  // Duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new AppError(`Duplicate value for ${field}`, 409, 'DUPLICATE_KEY');
  }

  if (err.name === 'JsonWebTokenError') return AppError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return AppError.unauthorized('Token expired');

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON body');

  return null; // unknown error
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const known = normalize(err);

  if (!known) {
    // Unexpected bug: log full details, return a safe generic message.
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong on our side. Please try again.',
        ...(env.nodeEnv !== 'production' && { stack: err.stack }),
      },
    });
  }

  res.status(known.statusCode).json({
    error: {
      code: known.code,
      message: known.message,
      ...(known.details && { details: known.details }),
    },
  });
};