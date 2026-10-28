// Shapes returned by the Express API (see backend src/utils/serializers.js).
// Kept separate from core/models so the UI models don't have to mirror the wire format.
import { TicketCategory, TicketStatus, UserRole } from '../models/models';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authorId: string | null;
}

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
}

export interface ApiBook {
  id: string;
  bookCode: string;
  title: string;
  isbn: string | null;
  genre: string | null;
  publicationDate: string | null;
  status: string;
  isPublished: boolean;
  mrp: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
}

export interface ApiAuthorTicket {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  attachments: { fileName: string; size?: number; mimeType?: string }[];
  book: { id: string; title: string } | null;
  responses: { id: string; from: string; message: string; sentAt: string }[];
  createdAt: string;
  updatedAt: string;
}
