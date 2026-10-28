const mongoose = require('mongoose');

// Books still in production have null mrp, publicationDate, royalty rate and printPartner,
// so those fields are intentionally nullable (no `required`).
const bookSchema = new mongoose.Schema(
  {
    bookCode: { type: String, required: true, unique: true }, // e.g. "BK001"
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true, index: true },
    title: { type: String, required: true, trim: true },
    isbn: { type: String, default: null },
    genre: { type: String, default: null },
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true }, // "Published & Live", "In Production - Cover Design", ...
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);