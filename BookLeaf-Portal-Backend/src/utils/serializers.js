// Explicit response shapes per role. Author serializers are allow-lists:
// internalNotes, aiMeta, draftResponse, priority and adminIds can never leak by accident.

// Human-friendly reference shown in both portals, e.g. "BL-2026-3F9A1". Derived from the
// creation year and the tail of the ObjectId, so it needs no counter and never changes.
const ticketCode = (t) => `BL-${new Date(t.createdAt).getFullYear()}-${String(t._id).slice(-5).toUpperCase()}`;

const toAuthorBook = (b) => ({
  id: b._id,
  bookCode: b.bookCode,
  title: b.title,
  isbn: b.isbn,
  genre: b.genre,
  publicationDate: b.publicationDate,
  status: b.status,
  isPublished: b.status === 'Published & Live',
  mrp: b.mrp,
  totalCopiesSold: b.totalCopiesSold,
  totalRoyaltyEarned: b.totalRoyaltyEarned,
  royaltyPaid: b.royaltyPaid,
  royaltyPending: b.royaltyPending,
  lastRoyaltyPayoutDate: b.lastRoyaltyPayoutDate,
  printPartner: b.printPartner,
  availableOn: b.availableOn,
});

const toAuthorTicket = (t) => ({
  id: t._id,
  ticketCode: ticketCode(t),
  subject: t.subject,
  description: t.description,
  status: t.status,
  category: t.category,
  attachments: t.attachments,
  // Populated book is optional; null means General / Account Level.
  book: t.bookId && t.bookId.title ? { id: t.bookId._id, title: t.bookId.title } : null,
  responses: t.responses.map((r) => ({
    id: r._id,
    from: 'BookLeaf Support',
    message: r.message,
    sentAt: r.sentAt,
  })),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

module.exports = { toAuthorBook, toAuthorTicket, ticketCode };