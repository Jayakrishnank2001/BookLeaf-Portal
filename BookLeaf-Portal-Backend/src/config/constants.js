// Single source of truth for enums, shared by models, validators and AI services.

const ROLES = Object.freeze({ AUTHOR: 'author', ADMIN: 'admin' });

const CATEGORIES = Object.freeze([
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
]);

const PRIORITIES = Object.freeze(['Critical', 'High', 'Medium', 'Low']);

const STATUSES = Object.freeze(['Open', 'In Progress', 'Resolved', 'Closed']);

// Who set the current category/priority on a ticket.
const CLASSIFIED_BY = Object.freeze(['ai', 'admin', 'fallback']);

// Used when AI is unavailable so the ticket is still created and triaged.
const FALLBACK_CLASSIFICATION = Object.freeze({
  category: 'General Inquiry',
  priority: 'Medium',
});

module.exports = {
  ROLES,
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  CLASSIFIED_BY,
  FALLBACK_CLASSIFICATION,
};