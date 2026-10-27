import { Author, Book, Ticket, User } from '../models/models';

export const MOCK_USERS: User[] = [];
export const MOCK_AUTHORS: Author[] = [];
export const MOCK_BOOKS: Book[] = [];
export const MOCK_TICKETS: Ticket[] = [];

export interface AdminUser {
  id: string;
  name: string;
}

export const ADMIN_USERS: AdminUser[] = [];
