const mongoose = require('mongoose');

// Profile data for a BookLeaf author. Login credentials live in User.
const authorSchema = new mongoose.Schema(
  {
    authorCode: { type: String, required: true, unique: true }, // e.g. "AUTH001" from the dataset
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    joinedDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Author', authorSchema);