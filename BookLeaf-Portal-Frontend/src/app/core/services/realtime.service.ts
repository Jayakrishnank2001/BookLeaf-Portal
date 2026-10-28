import { Injectable, signal } from '@angular/core';
import { Observable, Subject, catchError, defer, exhaustMap, filter, fromEvent, merge, tap, throwError, timer, EMPTY } from 'rxjs';
import { Ticket } from '../models/models';

export const POLL_INTERVAL_MS = 8000;

export type RealtimeEventName = 'ticket:created' | 'ticket:updated' | 'ticket:message' | 'ticket:status-changed';

export interface RealtimeEvent {
  name: RealtimeEventName;
  ticket: Ticket;
}

/**
 * Near-real-time updates via polling (the assignment allows polling / SSE / WebSockets).
 * `connected` drives the "Connected / Reconnecting" indicator in both layouts.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  connected = signal(true);

  /**
   * Calls `request` immediately, then every `intervalMs`, and re-fetches the moment the tab
   * becomes visible again. Polling pauses while the tab is hidden, and a slow response never
   * stacks up extra requests (exhaustMap).
   *
   * Errors: if the FIRST request fails the error is passed on so the page can show an error
   * state; once data has loaded, later failures just flip `connected` and the next tick retries.
   */
  poll<T>(request: () => Observable<T>, intervalMs = POLL_INTERVAL_MS): Observable<T> {
    return defer(() => {
      let hasData = false;
      return merge(timer(0, intervalMs), fromEvent(document, 'visibilitychange')).pipe(
        filter(() => !document.hidden),
        exhaustMap(() =>
          request().pipe(
            tap(() => {
              hasData = true;
              this.connected.set(true);
            }),
            catchError((err) => {
              this.connected.set(false);
              return hasData ? EMPTY : throwError(() => err);
            }),
          ),
        ),
      );
    });
  }

  // --- Used only by the still-mocked admin services; removed when the admin API is wired. ---
  private events$ = new Subject<RealtimeEvent>();
  ticketUpdates$ = this.events$.asObservable();

  emit(name: RealtimeEventName, ticket: Ticket) {
    this.events$.next({ name, ticket });
  }
}
