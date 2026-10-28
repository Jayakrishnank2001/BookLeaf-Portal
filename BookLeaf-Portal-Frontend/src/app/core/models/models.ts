export type UserRole = 'author' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarColor: string;
  initials: string;
  title?: string;
}

export type BookStatus =
  | 'Published & Live'
  | 'In Production - Cover Design'
  | 'In Production - Typesetting'
  | 'In Production - Editing'
  | 'In Press';

export interface Author {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
  bio?: string;
}

export interface Book {
  id: string;
  bookCode: string;
  title: string;
  genre: string;
  isbn: string | null;
  status: BookStatus;
  publicationDate: string | null;
  mrp: number | null;
  copiesSold: number;
  royaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  printPartner: string | null;
  platforms: string[];
  lastPayoutDate: string | null;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export interface TicketMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AIClassification {
  category: TicketCategory;
  categoryConfidence: number;
  categoryReason: string;
  priority: TicketPriority;
  priorityConfidence: number;
}

export interface AIDraft {
  content: string;
  generatedAt: string;
  source: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  authorId: string;
  authorName: string;
  bookId: string | null;
  bookTitle: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  internalNotes: InternalNote[];
  aiClassification?: AIClassification;
  aiDraft?: AIDraft;
}

/**
 * A ticket as an author sees it. Priority, internal notes, AI data and assignment
 * are internal to the BookLeaf team, so the API never sends them to authors
 * and the type makes it impossible to render them by accident.
 */
export type AuthorTicket = Omit<
  Ticket,
  'priority' | 'assignedTo' | 'assignedToName' | 'internalNotes' | 'aiClassification' | 'aiDraft'
>;

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: 'ticket' | 'message' | 'system';
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
  timeout?: number;
}
