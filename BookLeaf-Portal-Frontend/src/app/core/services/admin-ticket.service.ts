import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, InternalNote, AIDraft } from '../models/models';
import { MOCK_TICKETS, ADMIN_USERS, AdminUser } from './mock-data';
import { RealtimeService } from './realtime.service';

export interface TicketUpdate {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string | null;
  assignedToName?: string | null;
}

export interface TicketActivityPoint {
  date: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class AdminTicketService {
  constructor(private realtime: RealtimeService) { }

  getTickets(): Observable<Ticket[]> {
    return of([...MOCK_TICKETS].sort((a, b) => this.priorityWeight(a) - this.priorityWeight(b) || +new Date(a.createdAt) - +new Date(b.createdAt))).pipe(delay(550));
  }

  getTicket(id: string): Observable<Ticket | undefined> {
    return of(MOCK_TICKETS.find((t) => t.id === id)).pipe(delay(350));
  }

  updateTicket(id: string, update: TicketUpdate): Observable<Ticket> {
    const ticket = MOCK_TICKETS.find((t) => t.id === id)!;
    if (update.status) ticket.status = update.status;
    if (update.priority) ticket.priority = update.priority;
    if (update.category) ticket.category = update.category;
    if (update.assignedTo !== undefined) {
      ticket.assignedTo = update.assignedTo;
      ticket.assignedToName = update.assignedTo ? (ADMIN_USERS.find((a: AdminUser) => a.id === update.assignedTo)?.name ?? null) : null;
    }
    ticket.updatedAt = new Date().toISOString();
    this.realtime.emit('ticket:status-changed', ticket);
    return of(ticket).pipe(delay(450));
  }

  addInternalNote(ticketId: string, authorId: string, authorName: string, content: string): Observable<InternalNote> {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId)!;
    const note: InternalNote = { id: 'n-' + Date.now(), authorId, authorName, content, createdAt: new Date().toISOString() };
    ticket.internalNotes.push(note);
    ticket.updatedAt = new Date().toISOString();
    return of(note).pipe(delay(350));
  }

  saveAIDraft(ticketId: string, content: string): Observable<Ticket> {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId)!;
    ticket.aiDraft = { content, generatedAt: new Date().toISOString(), source: 'Backend AI' };
    return of(ticket).pipe(delay(300));
  }

  generateDraft(ticketId: string): Observable<AIDraft> {
    const draft: AIDraft = {
      content: '',
      generatedAt: new Date().toISOString(),
      source: 'Backend AI',
    };
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
    if (ticket) ticket.aiDraft = draft;
    return of(draft).pipe(delay(1100));
  }

  sendResponse(ticketId: string, content: string, authorId: string, authorName: string): Observable<Ticket> {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId)!;
    ticket.messages.push({
      id: 'm-' + Date.now(),
      authorId, authorName, authorRole: 'admin', content,
      createdAt: new Date().toISOString(),
    });
    if (ticket.status === 'Open') ticket.status = 'In Progress';
    ticket.updatedAt = new Date().toISOString();
    this.realtime.emit('ticket:message', ticket);
    return of(ticket).pipe(delay(500));
  }

  getActivity(): Observable<TicketActivityPoint[]> {
    const all = MOCK_TICKETS;
    if (all.length === 0) {
      return of([]).pipe(delay(400));
    }
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return d;
    });
    const dayMap = new Map<string, number>();
    days.forEach((d) => dayMap.set(d.toISOString().slice(0, 10), 0));
    all.forEach((t) => {
      const d = new Date(t.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    });
    return of(days.map((d) => ({ date: d.toISOString().slice(0, 10), count: dayMap.get(d.toISOString().slice(0, 10)) ?? 0 }))).pipe(delay(400));
  }

  getMetrics() {
    const all = MOCK_TICKETS;
    const today = new Date();
    return {
      open: all.filter((t) => t.status === 'Open').length,
      inProgress: all.filter((t) => t.status === 'In Progress').length,
      resolved: all.filter((t) => t.status === 'Resolved').length,
      closed: all.filter((t) => t.status === 'Closed').length,
      critical: all.filter((t) => t.priority === 'Critical' && t.status !== 'Closed').length,
      high: all.filter((t) => t.priority === 'High' && t.status !== 'Closed').length,
      unassigned: all.filter((t) => !t.assignedTo && t.status !== 'Closed' && t.status !== 'Resolved').length,
      resolvedToday: all.filter((t) => t.status === 'Resolved' && new Date(t.updatedAt).toISOString().slice(0, 10) === today.toISOString().slice(0, 10)).length,
    };
  }

  getAdminUsers() {
    return ADMIN_USERS;
  }

  priorityWeight(t: Ticket): number {
    const order: Record<TicketPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return order[t.priority];
  }
}
