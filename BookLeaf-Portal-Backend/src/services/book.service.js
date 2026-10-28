const Book = require('../models/Book');

// Always scoped by authorId taken from the verified JWT, never from client input.
async function listForAuthor(authorId) {
  return Book.find({ authorId }).sort({ createdAt: 1 });
}

module.exports = { listForAuthor };