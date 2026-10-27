import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory, AIClassification } from '../models/models';
import { MOCK_TICKETS, MOCK_BOOKS } from './mock-data';
import { RealtimeService } from './realtime.service';

export interface NewTicketInput {
  bookId: string | null;
  subject: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private tickets = signal<Ticket[]>([]);
  loading = signal(false);

  constructor(private realtime: RealtimeService) {
    this.realtime.ticketUpdates$.subscribe((ev) => this.upsertTicket(ev.ticket));
  }

  private refresh() {
    this.tickets.set([...MOCK_TICKETS]);
  }

  getTickets(authorId?: string): Observable<Ticket[]> {
    const list = authorId ? MOCK_TICKETS.filter((t) => t.authorId === authorId) : [...MOCK_TICKETS];
    return of(list).pipe(delay(500));
  }

  getTicket(id: string): Observable<Ticket | undefined> {
    return of(MOCK_TICKETS.find((t) => t.id === id)).pipe(delay(300));
  }

  createTicket(authorId: string, authorName: string, input: NewTicketInput): Observable<Ticket> {
    const book = MOCK_BOOKS.find((b) => b.id === input.bookId);
    const ai = this.mockClassification(input.subject, input.description);
    const now = new Date().toISOString();
    const seq = String(MOCK_TICKETS.length + 1).padStart(3, '0');
    const ticket: Ticket = {
      id: 't-' + Date.now(),
      ticketCode: `BL-2026-${seq}`,
      subject: input.subject,
      description: input.description,
      authorId,
      authorName,
      bookId: input.bookId,
      bookTitle: book?.title ?? null,
      status: 'Open',
      priority: ai.priority,
      category: ai.category,
      assignedTo: null,
      assignedToName: null,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: 'm-' + Date.now(),
          authorId,
          authorName,
          authorRole: 'author',
          content: input.description,
          createdAt: now,
        },
      ],
      internalNotes: [],
      aiClassification: ai,
    };
    MOCK_TICKETS.unshift(ticket);
    this.realtime.emit('ticket:created', ticket);
    return of(ticket).pipe(delay(900));
  }

  addReply(ticketId: string, authorId: string, authorName: string, authorRole: 'author' | 'admin', content: string): Observable<Ticket> {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId)!;
    const msg: TicketMessage = {
      id: 'm-' + Date.now(),
      authorId, authorName, authorRole, content,
      createdAt: new Date().toISOString(),
    };
    ticket.messages.push(msg);
    ticket.updatedAt = new Date().toISOString();
    this.realtime.emit('ticket:message', ticket);
    return of(ticket).pipe(delay(400));
  }

  private mockClassification(_subject: string, _description: string): AIClassification {
    return {
      category: 'General Inquiry',
      categoryConfidence: 0,
      categoryReason: '',
      priority: 'Medium',
      priorityConfidence: 0,
    };
  }

  private upsertTicket(ticket: Ticket) {
    const list = this.tickets();
    const i = list.findIndex((t) => t.id === ticket.id);
    if (i >= 0) {
      const next = [...list];
      next[i] = ticket;
      this.tickets.set(next);
    } else {
      this.tickets.set([ticket, ...list]);
    }
  }
}
