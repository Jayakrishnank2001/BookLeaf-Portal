const AppError = require('../utils/AppError');

// Role guard. Use after authenticate: router.use(authenticate, authorize('admin'))
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) return next(AppError.forbidden());
  next();
};

module.exports = authorize;