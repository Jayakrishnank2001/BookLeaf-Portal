const AppError = require('../utils/AppError');

// Catches any request that matched no route.
module.exports = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};