const { z } = require('zod');
const { STATUSES, CATEGORIES, PRIORITIES } = require('../config/constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

// Query filters for ticket list
const listAdminTicketsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedTo: objectId.optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'priority']).optional().default('updatedAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Body for updating ticket status
const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});

// Body for updating category and/or priority
const updateClassificationSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
}).refine((data) => data.category !== undefined || data.priority !== undefined, {
  message: 'At least one of category or priority must be provided',
});

// Body for assigning a ticket
const assignTicketSchema = z.object({
  adminId: objectId,
});

// Body for adding an internal note
const addInternalNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note cannot be empty').max(2000),
});

// Body for sending a reply to author
const sendReplySchema = z.object({
  message: z.string().trim().min(1, 'Reply cannot be empty').max(5000),
});

module.exports = {
  listAdminTicketsQuerySchema,
  updateStatusSchema,
  updateClassificationSchema,
  assignTicketSchema,
  addInternalNoteSchema,
  sendReplySchema,
};