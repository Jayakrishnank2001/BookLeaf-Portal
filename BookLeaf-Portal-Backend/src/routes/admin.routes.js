const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
  listAdminTicketsQuerySchema,
  updateStatusSchema,
  updateClassificationSchema,
  assignTicketSchema,
  addInternalNoteSchema,
  sendReplySchema,
} = require('../validators/admin.validator');

// All admin routes require authentication + admin role
router.use(authenticate, authorize(ROLES.ADMIN));

// GET /admin/tickets — list all tickets with filters
router.get(
  '/tickets',
  validate(listAdminTicketsQuerySchema, 'query'),
  controller.listTickets
);

// GET /admin/tickets/:id — get a single ticket (full admin shape)
router.get('/tickets/:id', controller.getTicket);

// PATCH /admin/tickets/:id/classification — override category and/or priority
router.patch(
  '/tickets/:id/classification',
  validate(updateClassificationSchema),
  controller.overrideClassification
);

// PATCH /admin/tickets/:id/status — update ticket status
router.patch(
  '/tickets/:id/status',
  validate(updateStatusSchema),
  controller.updateStatus
);

// PATCH /admin/tickets/:id/assign — assign ticket to an admin
router.patch(
  '/tickets/:id/assign',
  validate(assignTicketSchema),
  controller.assignTicket
);

// POST /admin/tickets/:id/notes — add an internal note
router.post(
  '/tickets/:id/notes',
  validate(addInternalNoteSchema),
  controller.addInternalNote
);

// GET /admin/tickets/:id/draft — get or regenerate AI draft
router.get('/tickets/:id/draft', controller.getOrCreateAIDraft);

// POST /admin/tickets/:id/reply — send a reply to the author
router.post(
  '/tickets/:id/reply',
  validate(sendReplySchema),
  controller.sendReply
);

module.exports = router;