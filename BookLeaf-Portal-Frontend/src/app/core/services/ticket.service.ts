import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, takeWhile, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthorTicket } from '../models/models';
import { ApiAuthorTicket } from '../api/api.types';
import { toAuthorTicket } from '../api/mappers';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';

export interface NewTicketInput {
  bookId: string | null; // null = "General / Account Level"
  subject: string;
  description: string;
}

/** Author-facing ticket API. (Admin tickets live in AdminTicketService.) */
@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private realtime = inject(RealtimeService);
  private url = `${environment.apiUrl}/tickets`;

  private author() {
    const user = this.auth.currentUser();
    return { id: user?.id ?? '', name: user?.name ?? '' };
  }

  getTickets(): Observable<AuthorTicket[]> {
    return this.http
      .get<{ tickets: ApiAuthorTicket[] }>(this.url)
      .pipe(map((res) => res.tickets.map((t) => toAuthorTicket(t, this.author()))));
  }

  /** Emits the ticket list now and then every few seconds, so admin replies appear without a refresh. */
  watchTickets(): Observable<AuthorTicket[]> {
    return this.realtime.poll(() => this.getTickets());
  }

  /** Emits undefined when the ticket doesn't exist or belongs to someone else (the API returns 404 for both). */
  getTicket(id: string): Observable<AuthorTicket | undefined> {
    return this.http.get<{ ticket: ApiAuthorTicket }>(`${this.url}/${id}`).pipe(
      map((res) => toAuthorTicket(res.ticket, this.author())),
      catchError((err) => (err.status === 404 || err.status === 400 ? of(undefined) : throwError(() => err))),
    );
  }

  /** Polls one ticket. Stops by itself when the ticket is missing or Closed (it can no longer change). */
  watchTicket(id: string): Observable<AuthorTicket | undefined> {
    return this.realtime
      .poll(() => this.getTicket(id))
      .pipe(takeWhile((ticket) => !!ticket && ticket.status !== 'Closed', true));
  }

  createTicket(input: NewTicketInput): Observable<AuthorTicket> {
    return this.http
      .post<{ ticket: ApiAuthorTicket }>(this.url, input)
      .pipe(map((res) => toAuthorTicket(res.ticket, this.author())));
  }
}
