const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Verifies "Authorization: Bearer <token>" and attaches the identity to req.user.
// Expired/invalid tokens throw JWT errors that errorHandler maps to 401.
module.exports = (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw AppError.unauthorized('Missing or malformed Authorization header');

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, role: payload.role, authorId: payload.authorId || null };
    next();
  } catch (err) {
    next(err);
  }
};