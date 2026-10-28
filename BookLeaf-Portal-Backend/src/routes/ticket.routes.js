const router = require('express').Router();
const controller = require('../controllers/ticket.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createTicketLimiter } = require('../middleware/rateLimiter');
const { createTicketSchema, listTicketsQuerySchema } = require('../validators/ticket.validator');
const { ROLES } = require('../config/constants');

// Author-facing ticket routes. Admin routes live in admin.routes.js.
router.use(authenticate, authorize(ROLES.AUTHOR));

router.post('/', createTicketLimiter, validate(createTicketSchema), controller.create);
router.get('/', validate(listTicketsQuerySchema, 'query'), controller.listMine);
router.get('/:id', controller.getMine);

module.exports = router;