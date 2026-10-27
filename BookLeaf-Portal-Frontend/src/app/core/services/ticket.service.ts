import { Injectable, signal, computed } from '@angular/core';
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
      aiDraft: {
        content: 'Thank you for contacting BookLeaf Author Support. We have received your query and will respond within one business day.',
        generatedAt: now,
        source: 'Ticket context + BookLeaf Knowledge Base',
      },
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

  private mockClassification(subject: string, description: string): AIClassification {
    const text = (subject + ' ' + description).toLowerCase();
    let category: TicketCategory = 'General Inquiry';
    let priority: TicketPriority = 'Medium';
    let reason = 'Author request does not match a specific incident category.';
    if (/royal|payment|payout|pending/.test(text)) {
      category = 'Royalty & Payments';
      priority = 'High';
      reason = 'Author reports a potentially overdue royalty payment.';
    } else if (/isbn|metadata|listing/.test(text)) {
      category = 'ISBN & Metadata Issues';
      priority = 'Medium';
      reason = 'Author reports an ISBN or metadata issue.';
    } else if (/print|quality|cover|binding|spine/.test(text)) {
      category = 'Printing & Quality';
      priority = 'Medium';
      reason = 'Author reports a printing or quality defect.';
    } else if (/flipkart|amazon|distribut|available|listing/.test(text)) {
      category = 'Distribution & Availability';
      priority = 'Low';
      reason = 'Author reports missing availability on a retail channel.';
    } else if (/production|cover design|typesetting|editing|delay/.test(text)) {
      category = 'Book Status & Production Updates';
      priority = 'Critical';
      reason = 'Author reports a missed production milestone with no update.';
    }
    return {
      category,
      categoryConfidence: 88 + Math.floor(Math.random() * 10),
      categoryReason: reason,
      priority,
      priorityConfidence: 85 + Math.floor(Math.random() * 12),
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
