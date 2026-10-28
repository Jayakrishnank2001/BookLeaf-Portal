const Book = require('../models/Book');
const AppError = require('../utils/AppError');

// Always scoped by authorId taken from the verified JWT, never from client input.
async function listForAuthor(authorId) {
  return Book.find({ authorId }).sort({ createdAt: 1 });
}

// authorId in the filter is the ownership check; someone else's book gives the same 404 as a missing one.
async function getForAuthor(authorId, bookId) {
  const book = await Book.findOne({ _id: bookId, authorId });
  if (!book) throw AppError.notFound('Book not found');
  return book;
}

module.exports = { listForAuthor, getForAuthor };