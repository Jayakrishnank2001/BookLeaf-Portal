const ticketService = require('../services/ticket.service');
const asyncHandler = require('../utils/asyncHandler');
const { toAuthorTicket } = require('../utils/serializers');

exports.create = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createForAuthor(req.user.authorId, req.body);
  res.status(201).json({ ticket: toAuthorTicket(ticket) });
});

exports.listMine = asyncHandler(async (req, res) => {
  const tickets = await ticketService.listForAuthor(req.user.authorId, req.query);
  res.json({ tickets: tickets.map(toAuthorTicket) });
});

exports.getMine = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getForAuthor(req.user.authorId, req.params.id);
  res.json({ ticket: toAuthorTicket(ticket) });
});