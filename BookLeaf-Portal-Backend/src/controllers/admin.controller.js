const adminTicketService = require('../services/admin-ticket.service');
const asyncHandler = require('../utils/asyncHandler');
const { toAdminTicket } = require('../utils/serializers');

exports.listTickets = asyncHandler(async (req, res) => {
  const result = await adminTicketService.listForAdmin(req.query);
  res.json({
    tickets: result.tickets.map(toAdminTicket),
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.getForAdmin(req.params.id, req.user.id);
  res.json({ ticket: toAdminTicket(ticket) });
});

exports.overrideClassification = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.overrideClassification(
    req.params.id,
    req.user.id,
    req.body
  );
  res.json({ ticket: toAdminTicket(ticket) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.updateStatus(req.params.id, req.user.id, req.body);
  res.json({ ticket: toAdminTicket(ticket) });
});

exports.assignTicket = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.assignTicket(req.params.id, req.user.id, req.body);
  res.json({ ticket: toAdminTicket(ticket) });
});

exports.addInternalNote = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.addInternalNote(req.params.id, req.user.id, req.body);
  res.json({ ticket: toAdminTicket(ticket) });
});

exports.getOrCreateAIDraft = asyncHandler(async (req, res) => {
  const { regenerate } = req.query;
  const draft = await adminTicketService.getOrCreateAIDraft(req.params.id, req.user.id, {
    regenerate: regenerate === 'true',
  });
  res.json({ draft });
});

exports.sendReply = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.sendReply(req.params.id, req.user.id, req.body);
  res.json({ ticket: toAdminTicket(ticket) });
});