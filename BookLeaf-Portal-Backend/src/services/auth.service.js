const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Compared against when the email doesn't exist, so response time doesn't reveal valid emails.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const toPublicUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  authorId: user.authorId || null,
});

function signToken(user) {
  return jwt.sign(
    { role: user.role, authorId: user.authorId ? String(user.authorId) : null },
    env.jwtSecret,
    { subject: String(user._id), expiresIn: env.jwtExpiresIn }
  );
}

async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Same message for "no such user" and "wrong password".
  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  return { token: signToken(user), user: toPublicUser(user) };
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized('Account no longer exists');
  return toPublicUser(user);
}

module.exports = { login, getProfile };