import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Ticket } from '../models/models';

export type RealtimeEventName = 'ticket:created' | 'ticket:updated' | 'ticket:message' | 'ticket:status-changed';

export interface RealtimeEvent {
  name: RealtimeEventName;
  ticket: Ticket;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private events$ = new Subject<RealtimeEvent>();
  connected = signal(true);
  ticketUpdates$ = this.events$.asObservable();

  constructor() {
    // Mock ambient reconnection simulation
    setTimeout(() => {
      this.connected.set(false);
      setTimeout(() => this.connected.set(true), 1400);
    }, 25000);
  }

  emit(name: RealtimeEventName, ticket: Ticket) {
    this.events$.next({ name, ticket });
  }

  // Simulate an incoming admin message appearing on an open ticket (demo of live updates)
  simulateIncoming(ticket: Ticket, adminName: string) {
    const updated: Ticket = {
      ...ticket,
      messages: [
        ...ticket.messages,
        {
          id: 'm-live-' + Date.now(),
          authorId: 'u-admin',
          authorName: adminName,
          authorRole: 'admin',
          content: 'Just confirming — I am reviewing your request now and will share an update shortly.',
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.emit('ticket:message', updated);
  }
}
