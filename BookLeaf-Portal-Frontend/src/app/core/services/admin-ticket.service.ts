import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, InternalNote, AIDraft, TicketActivityPoint } from '../models/models';
import { ApiAdminTicket, ApiAdminTicketList, ApiAIDraft } from '../api/api.types';
import { toAdminTicket } from '../api/mappers';
import { apiErrorMessage } from '../api/api-error';

export interface TicketUpdate {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string | null;
}

export interface TicketFilters {
  status?: TicketStatus | null;
  category?: TicketCategory | null;
  priority?: TicketPriority | null;
  assignedTo?: string | null;
  sort?: 'createdAt' | 'updatedAt' | 'priority';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AdminTicketService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin/tickets`;
  getTickets(filters: TicketFilters = {}): Observable<PaginatedTickets> {
    const params: Record<string, string | number> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.category) params['category'] = filters.category;
    if (filters.priority) params['priority'] = filters.priority;
    if (filters.assignedTo) params['assignedTo'] = filters.assignedTo;
    if (filters.sort) params['sort'] = filters.sort;
    if (filters.order) params['order'] = filters.order;
    if (filters.page) params['page'] = filters.page;
    if (filters.limit) params['limit'] = filters.limit;

    return this.http
      .get<ApiAdminTicketList>(this.url, { params })
      .pipe(
        map((res) => ({
          tickets: res.tickets.map((t) => toAdminTicket(t)),
          total: res.total,
          page: res.page,
          limit: res.limit,
        })),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to load tickets')))),
      );
  }

  getTicket(id: string): Observable<Ticket | undefined> {
    return this.http
      .get<{ ticket: ApiAdminTicket }>(`${this.url}/${id}`)
      .pipe(
        map((res) => toAdminTicket(res.ticket)),
        catchError((err) => {
          if (err.status === 404) return of(undefined);
          return throwError(() => new Error(apiErrorMessage(err, 'Failed to load ticket')));
        }),
      );
  }

  updateStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http
      .patch<{ ticket: ApiAdminTicket }>(`${this.url}/${id}/status`, { status })
      .pipe(
        map((res) => toAdminTicket(res.ticket)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to update status')))),
      );
  }

  overrideClassification(id: string, update: { category?: TicketCategory; priority?: TicketPriority }): Observable<Ticket> {
    return this.http
      .patch<{ ticket: ApiAdminTicket }>(`${this.url}/${id}/classification`, update)
      .pipe(
        map((res) => toAdminTicket(res.ticket)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to update classification')))),
      );
  }

  assignTicket(id: string, adminId: string): Observable<Ticket> {
    return this.http
      .patch<{ ticket: ApiAdminTicket }>(`${this.url}/${id}/assign`, { adminId })
      .pipe(
        map((res) => toAdminTicket(res.ticket)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to assign ticket')))),
      );
  }

  addInternalNote(ticketId: string, note: string): Observable<InternalNote> {
    return this.http
      .post<{ ticket: ApiAdminTicket }>(`${this.url}/${ticketId}/notes`, { note })
      .pipe(
        map((res) => {
          const ticket = toAdminTicket(res.ticket);
          const lastNote = ticket.internalNotes[ticket.internalNotes.length - 1];
          return lastNote ?? { id: '', authorId: '', authorName: '', content: note, createdAt: new Date().toISOString() };
        }),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to add note')))),
      );
  }

  getAIDraft(ticketId: string, regenerate = false): Observable<AIDraft> {
    return this.http
      .get<{ draft: ApiAIDraft }>(`${this.url}/${ticketId}/draft`, {
        params: { regenerate: String(regenerate) },
      })
      .pipe(
        map((res) => ({
          content: res.draft.text,
          generatedAt: res.draft.generatedAt,
          source: 'Backend AI',
        })),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to load AI draft')))),
      );
  }

  sendReply(ticketId: string, message: string): Observable<Ticket> {
    return this.http
      .post<{ ticket: ApiAdminTicket }>(`${this.url}/${ticketId}/reply`, { message })
      .pipe(
        map((res) => toAdminTicket(res.ticket)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Failed to send reply')))),
      );
  }

  getMetrics(tickets: Ticket[]) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      open: tickets.filter((t) => t.status === 'Open').length,
      inProgress: tickets.filter((t) => t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
      closed: tickets.filter((t) => t.status === 'Closed').length,
      critical: tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Closed').length,
      high: tickets.filter((t) => t.priority === 'High' && t.status !== 'Closed').length,
      unassigned: tickets.filter((t) => !t.assignedTo && t.status !== 'Closed' && t.status !== 'Resolved').length,
      resolvedToday: tickets.filter(
        (t) => t.status === 'Resolved' && t.updatedAt.slice(0, 10) === today,
      ).length,
    };
  }

  getActivity(tickets: Ticket[]): TicketActivityPoint[] {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const dayMap = new Map<string, number>();
    days.forEach((d) => dayMap.set(d, 0));
    tickets.forEach((t) => {
      const d = t.createdAt.slice(0, 10);
      if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    });
    return days.map((d) => ({ date: d, count: dayMap.get(d) ?? 0 }));
  }

  priorityWeight(t: Ticket): number {
    const order: Record<TicketPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return order[t.priority];
  }
}
