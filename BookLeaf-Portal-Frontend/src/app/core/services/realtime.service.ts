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

  // Placeholder for simulated incoming messages — will be replaced by real WebSocket backend
  simulateIncoming(_ticket: Ticket, _adminName: string) {
    // No-op until backend realtime connection is implemented
  }
}
