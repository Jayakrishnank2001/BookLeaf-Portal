const bookService = require('../services/book.service');
const asyncHandler = require('../utils/asyncHandler');
const { toAuthorBook } = require('../utils/serializers');

exports.listMine = asyncHandler(async (req, res) => {
  const books = await bookService.listForAuthor(req.user.authorId);
  res.json({ books: books.map(toAuthorBook) });
});

exports.getMine = asyncHandler(async (req, res) => {
  const book = await bookService.getForAuthor(req.user.authorId, req.params.id);
  res.json({ book: toAuthorBook(book) });
});