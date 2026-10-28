const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getOrCreateDraft } = require('./ai/draft.service');

/**
 * List tickets for admin queue with filters.
 * Admin can see ALL tickets across all authors.
 */
async function listForAdmin({ status, category, priority, assignedTo, sort, order, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const skip = (page - 1) * limit;
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .select('-draftResponse') // draftResponse is fetched separately on demand
      .populate('authorId', 'name email')
      .populate('bookId', 'title bookCode')
      .populate('assignedTo', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return { tickets, total, page, limit };
}

/**
 * Get a single ticket with full admin shape (includes internal notes, aiMeta, draft info, assignedTo).
 */
async function getForAdmin(ticketId, adminId) {
  const ticket = await Ticket.findById(ticketId)
    .populate('authorId', 'name email')
    .populate('bookId', 'title bookCode isbn')
    .populate('assignedTo', 'name email role');

  if (!ticket) throw AppError.notFound('Ticket not found');

  return ticket;
}

/**
 * Override category and/or priority. Sets classifiedBy to 'admin'.
 */
async function overrideClassification(ticketId, adminId, { category, priority }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  const update = {};
  if (category !== undefined) {
    update.category = category;
    update.$set = update.$set || {};
    update.$set.category = category;
  }
  if (priority !== undefined) {
    update.$set = update.$set || {};
    update.$set.priority = priority;
  }

  update.$set = update.$set || {};
  update.$set['aiMeta.classifiedBy'] = 'admin';
  update.$set['aiMeta.reasoning'] = `Overridden by admin ${adminId}`;

  Object.assign(ticket, update);
  await ticket.save();

  return ticket;
}

/**
 * Update ticket status.
 */
async function updateStatus(ticketId, adminId, { status }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  ticket.status = status;
  await ticket.save();

  return ticket;
}

/**
 * Assign ticket to an admin (self-assign or assign to another admin).
 */
async function assignTicket(ticketId, adminId, { adminId: targetAdminId }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  // Verify target admin exists and has admin role
  const targetAdmin = await User.findById(targetAdminId);
  if (!targetAdmin) throw AppError.notFound('Admin user not found');
  if (targetAdmin.role !== 'admin') throw AppError.forbidden('Only admins can be assigned tickets');

  ticket.assignedTo = targetAdminId;
  await ticket.save();

  return ticket;
}

/**
 * Add an internal note to a ticket (visible only to admins).
 */
async function addInternalNote(ticketId, adminId, { note }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  const admin = await User.findById(adminId);
  if (!admin) throw AppError.notFound('Admin not found');

  ticket.internalNotes.push({
    adminId,
    adminName: admin.name,
    note,
  });
  await ticket.save();

  return ticket;
}

/**
 * Get or regenerate the AI draft response for a ticket.
 */
async function getOrCreateAIDraft(ticketId, adminId, { regenerate = false } = {}) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  const draft = await getOrCreateDraft(ticket, { regenerate });
  return draft;
}

/**
 * Send a reply to the author. Writes to responses[] so authors see it on poll.
 */
async function sendReply(ticketId, adminId, { message }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket not found');

  const admin = await User.findById(adminId);
  if (!admin) throw AppError.notFound('Admin not found');

  ticket.responses.push({
    adminId,
    adminName: admin.name,
    message,
    sentAt: new Date(),
  });

  // Optionally mark as In Progress when a reply is sent
  if (ticket.status === 'Open') {
    ticket.status = 'In Progress';
  }

  await ticket.save();

  return ticket;
}

module.exports = {
  listForAdmin,
  getForAdmin,
  overrideClassification,
  updateStatus,
  assignTicket,
  addInternalNote,
  getOrCreateAIDraft,
  sendReply,
};