const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');

const AUTHOR_HIDDEN_FIELDS = '-internalNotes -draftResponse -aiMeta -assignedTo -priority';

async function createForAuthor(authorId, { bookId, subject, description, attachments }) {
  // A book can only be referenced if it belongs to this author.
  if (bookId) {
    const owns = await Book.exists({ _id: bookId, authorId });
    if (!owns) throw AppError.notFound('Book not found');
  }

  // Saved first so the ticket is never lost. Category/priority use schema defaults
  // (General Inquiry / Medium, classifiedBy: 'fallback'); AI classification will
  // update them afterwards and degrade to these defaults if the AI call fails.
  const ticket = await Ticket.create({ authorId, bookId, subject, description, attachments });
  return ticket.populate('bookId', 'title');
}

async function listForAuthor(authorId, { status } = {}) {
  const filter = { authorId };
  if (status) filter.status = status;

  return Ticket.find(filter)
    .select(AUTHOR_HIDDEN_FIELDS)
    .populate('bookId', 'title')
    .sort({ updatedAt: -1 })
    .limit(100);
}

async function getForAuthor(authorId, ticketId) {
  // authorId in the filter = ownership check. Someone else's ticket gives the same
  // 404 as a missing one, so ticket ids can't be probed.
  const ticket = await Ticket.findOne({ _id: ticketId, authorId })
    .select(AUTHOR_HIDDEN_FIELDS)
    .populate('bookId', 'title');
  if (!ticket) throw AppError.notFound('Ticket not found');
  return ticket;
}

module.exports = { createForAuthor, listForAuthor, getForAuthor };