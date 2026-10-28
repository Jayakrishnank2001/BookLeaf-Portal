const mongoose = require('mongoose');
const {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  CLASSIFIED_BY,
  FALLBACK_CLASSIFICATION,
} = require('../config/constants');

// Attachment metadata only (UI-only upload for now; real storage is a bonus).
const attachmentSchema = new mongoose.Schema(
  { fileName: String, size: Number, mimeType: String },
  { _id: false }
);

// Reply from the BookLeaf team, visible to the author.
const responseSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Private to admins. NEVER serialized for authors.
const internalNoteSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true },
    note: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null }, // null = General / Account Level
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: { type: [attachmentSchema], default: [] },

    status: { type: String, enum: STATUSES, default: 'Open' },

    // Defaults are the fallback values, so a ticket is always triaged even if AI is down.
    category: { type: String, enum: CATEGORIES, default: FALLBACK_CLASSIFICATION.category },
    priority: { type: String, enum: PRIORITIES, default: FALLBACK_CLASSIFICATION.priority },
    aiMeta: {
      classifiedBy: { type: String, enum: CLASSIFIED_BY, default: 'fallback' },
      reasoning: { type: String, default: null },
      aiFailed: { type: Boolean, default: false },
    },

    // Cached AI draft so it is generated once, not on every open.
    draftResponse: {
      text: { type: String, default: null },
      generatedAt: { type: Date, default: null },
    },

    responses: { type: [responseSchema], default: [] },
    internalNotes: { type: [internalNoteSchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Author "My Tickets" list, polled frequently.
ticketSchema.index({ authorId: 1, updatedAt: -1 });
// Admin queue filters and sorting.
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);