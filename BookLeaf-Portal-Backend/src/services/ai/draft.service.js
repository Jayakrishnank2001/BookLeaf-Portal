const Book = require('../../models/Book');
const Author = require('../../models/Author');
const { generate } = require('./aiClient');
const { buildDraftPrompt } = require('./promptBuilder');
const AppError = require('../../utils/AppError');

/**
 * Returns the cached draft if one exists, otherwise generates and caches it.
 * Caching means opening a ticket repeatedly costs nothing; regenerate must be explicit.
 *
 * @param {Document} ticket Mongoose ticket document (with category already set)
 * @param {{regenerate?: boolean}} [options]
 * @throws {AiUnavailableError} (503 AI_UNAVAILABLE) when the AI cannot respond; the admin writes manually
 */
async function getOrCreateDraft(ticket, { regenerate = false } = {}) {
  if (!regenerate && ticket.draftResponse?.text) {
    return { text: ticket.draftResponse.text, generatedAt: ticket.draftResponse.generatedAt, cached: true };
  }

  const [author, books] = await Promise.all([
    Author.findById(ticket.authorId),
    Book.find({ authorId: ticket.authorId }).sort({ createdAt: 1 }),
  ]);
  if (!author) throw AppError.notFound('Author for this ticket no longer exists');

  const { system, prompt } = buildDraftPrompt({ ticket, author, books });
  const text = await generate({ system, prompt, maxOutputTokens: 700, temperature: 0.4 });

  ticket.draftResponse = { text, generatedAt: new Date() };
  await ticket.save();

  return { text, generatedAt: ticket.draftResponse.generatedAt, cached: false };
}

module.exports = { getOrCreateDraft };