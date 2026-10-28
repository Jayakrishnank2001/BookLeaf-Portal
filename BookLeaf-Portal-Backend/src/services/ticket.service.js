const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { classifyTicket } = require('./ai/classification.service');

const AUTHOR_HIDDEN_FIELDS = '-internalNotes -draftResponse -aiMeta -assignedTo -priority';

/**
 * AI triage (category + priority). Runs AFTER the ticket is saved and never blocks or
 * fails ticket creation. Updates only if no admin has overridden the classification in the
 * meantime (classifiedBy still 'fallback'), so a slow AI call can't clobber a human decision.
 */
async function runAiTriage(ticketId) {
  const guard = { _id: ticketId, 'aiMeta.classifiedBy': 'fallback' };
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return;
    const { category, priority, reasoning } = await classifyTicket(ticket);
    await Ticket.updateOne(guard, {
      $set: { category, priority, 'aiMeta.classifiedBy': 'ai', 'aiMeta.reasoning': reasoning, 'aiMeta.aiFailed': false },
    });
  } catch (err) {
    // Defaults (General Inquiry / Medium) stay in place; flag it so admins know to triage by hand.
    logger.warn(`AI triage failed for ticket ${ticketId}: ${err.reason || err.message}`);
    await Ticket.updateOne(guard, { $set: { 'aiMeta.aiFailed': true } }).catch(() => {});
  }
}

async function createForAuthor(authorId, { bookId, subject, description, attachments }) {
  // A book can only be referenced if it belongs to this author.
  if (bookId) {
    const owns = await Book.exists({ _id: bookId, authorId });
    if (!owns) throw AppError.notFound('Book not found');
  }

  // Saved first so the ticket is never lost. Category/priority start as the schema defaults
  // (General Inquiry / Medium, classifiedBy: 'fallback') and AI classification updates them in
  // the background. If the AI call fails, those defaults stay and the ticket is flagged aiFailed.
  const ticket = await Ticket.create({ authorId, bookId, subject, description, attachments });
  // Fire-and-forget: the author gets an instant response; triage lands a moment later.
  runAiTriage(ticket._id);

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

module.exports = { createForAuthor, listForAuthor, getForAuthor, runAiTriage };