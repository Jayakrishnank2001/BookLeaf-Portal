// Adapter layer: API payloads -> UI models. Components only ever see UI models,
// so a change in the wire format is fixed here and nowhere else.
import { AuthorTicket, Book, BookStatus, TicketCategory, TicketMessage, Ticket, TicketPriority, TicketStatus, User } from '../models/models';
import { ApiAuthorTicket, ApiBook, ApiUser, ApiAdminTicket } from './api.types';
import { hashString } from '../utils/hash';

const AVATAR_COLORS = ['#b0492a', '#2f5d4a', '#0d487f', '#8a5a14', '#6b3f8c', '#0d4f3d'];

export const initialsFor = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

export const avatarColorFor = (seed: string): string => AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];

export function toUser(api: ApiUser): User {
  return {
    id: api.id,
    email: api.email,
    name: api.name,
    role: api.role,
    initials: initialsFor(api.name),
    avatarColor: avatarColorFor(api.email),
  };
}

export function toBook(api: ApiBook): Book {
  return {
    id: api.id,
    bookCode: api.bookCode,
    title: api.title,
    genre: api.genre ?? 'Uncategorised',
    isbn: api.isbn,
    status: api.status as BookStatus,
    publicationDate: api.publicationDate,
    mrp: api.mrp,
    copiesSold: api.totalCopiesSold,
    royaltyEarned: api.totalRoyaltyEarned,
    royaltyPaid: api.royaltyPaid,
    royaltyPending: api.royaltyPending,
    printPartner: api.printPartner,
    platforms: api.availableOn,
    lastPayoutDate: api.lastRoyaltyPayoutDate,
  };
}

/** The author's original query becomes the first message; admin responses follow it. */
export function toAuthorTicket(api: ApiAuthorTicket, author: { id: string; name: string }): AuthorTicket {
  const original: TicketMessage = {
    id: `${api.id}-original`,
    authorId: author.id,
    authorName: author.name,
    authorRole: 'author',
    content: api.description,
    createdAt: api.createdAt,
  };
  const replies: TicketMessage[] = api.responses.map((r) => ({
    id: r.id,
    authorId: 'support',
    authorName: r.from,
    authorRole: 'admin',
    content: r.message,
    createdAt: r.sentAt,
  }));

  return {
    id: api.id,
    ticketCode: api.ticketCode,
    subject: api.subject,
    description: api.description,
    authorId: author.id,
    authorName: author.name,
    bookId: api.book?.id ?? null,
    bookTitle: api.book?.title ?? null,
    status: api.status,
    category: api.category,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    messages: [original, ...replies],
  };
}

/** Full admin shape: everything visible to BookLeaf support staff. */
export function toAdminTicket(api: ApiAdminTicket): Ticket {
  return {
    id: api.id,
    ticketCode: api.ticketCode,
    subject: api.subject,
    description: api.description,
    authorId: api.author?.id ?? '',
    authorName: api.author?.name ?? 'Unknown Author',
    bookId: api.book?.id ?? null,
    bookTitle: api.book?.title ?? null,
    status: api.status as TicketStatus,
    priority: api.priority as TicketPriority,
    category: api.category,
    assignedTo: api.assignedTo?.id ?? null,
    assignedToName: api.assignedTo?.name ?? null,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    messages: api.responses.map((r) => ({
      id: r.id,
      authorId: r.adminId,
      authorName: r.adminName,
      authorRole: 'admin' as const,
      content: r.message,
      createdAt: r.sentAt,
    })),
    internalNotes: api.internalNotes.map((n) => ({
      id: n.id,
      authorId: n.adminId,
      authorName: n.adminName,
      content: n.note,
      createdAt: n.createdAt,
    })),
    aiClassification: api.aiMeta
      ? {
          category: api.aiMeta.category as TicketCategory,
          categoryConfidence: api.aiMeta.categoryConfidence,
          categoryReason: api.aiMeta.categoryReason,
          priority: api.aiMeta.priority as TicketPriority,
          priorityConfidence: api.aiMeta.priorityConfidence,
        }
      : undefined,
    aiDraft: api.draftResponse
      ? { content: api.draftResponse?.text || '', generatedAt: api.draftResponse?.generatedAt || api.updatedAt, source: 'Backend AI' }
      : undefined,
  };
}
