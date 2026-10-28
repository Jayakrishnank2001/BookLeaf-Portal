const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

// Login identity. Authors link to an Author profile; admins have no authorId.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select:false => never returned by queries unless explicitly requested with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    name: { type: String, required: true, trim: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      default: null,
      required: function requiredForAuthors() {
        return this.role === ROLES.AUTHOR;
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);