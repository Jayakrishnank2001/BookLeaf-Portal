const { z } = require('zod');
const { STATUSES } = require('../config/constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

const createTicketSchema = z.object({
  // null/omitted = "General / Account Level"
  bookId: objectId.nullish().transform((v) => v || null),
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(150),
  description: z.string().trim().min(10, 'Please describe your query in more detail').max(5000),
  attachments: z
    .array(
      z.object({
        fileName: z.string().trim().max(255),
        size: z.number().nonnegative().max(10 * 1024 * 1024).optional(),
        mimeType: z.string().trim().max(100).optional(),
      })
    )
    .max(5, 'You can attach up to 5 files')
    .optional()
    .default([]),
});

const listTicketsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
});

module.exports = { createTicketSchema, listTicketsQuerySchema };