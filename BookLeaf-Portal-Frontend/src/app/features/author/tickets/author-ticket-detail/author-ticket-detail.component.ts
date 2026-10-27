import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RealtimeService } from '../../../../core/services/realtime.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Ticket } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { DatePipe } from '../../../../shared/pipes/date.pipe';

@Component({
  selector: 'app-author-ticket-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, BadgeComponent, AvatarComponent, DatePipe],
  templateUrl: './author-ticket-detail.component.html',
  styleUrls: ['./author-ticket-detail.component.css'],
})
export class AuthorTicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketSvc = inject(TicketService);
  private auth = inject(AuthService);
  private realtime = inject(RealtimeService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  sending = signal(false);
  ticket = signal<Ticket | undefined>(undefined);
  replyText = '';

  isUrgent = computed(() => {
    const p = this.ticket()?.priority;
    return p === 'Critical' || p === 'High';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadTicket(id);

    // Listen for live updates on this ticket
    this.realtime.ticketUpdates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ev) => {
      if (ev.ticket.id === id) {
        this.ticket.set(ev.ticket);
        if (ev.name === 'ticket:message' && ev.ticket.messages[ev.ticket.messages.length - 1]?.authorRole === 'admin') {
          this.notify.info('New response from BookLeaf support.');
        }
      }
    });
  }

  private loadTicket(id: string) {
    this.ticketSvc.getTicket(id).subscribe((t) => { this.ticket.set(t); this.loading.set(false); });
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  }

  colorFor(msg: { authorRole: string; authorName: string }): string {
    if (msg.authorRole === 'admin') return '#2f5d4a';
    return this.auth.currentUser()?.avatarColor ?? '#b0492a';
  }

  sendReply() {
    const t = this.ticket();
    if (!t || !this.replyText.trim()) return;
    this.sending.set(true);
    const user = this.auth.currentUser()!;
    this.ticketSvc.addReply(t.id, user.id, user.name, 'author', this.replyText.trim()).subscribe((updated) => {
      this.ticket.set(updated);
      this.replyText = '';
      this.sending.set(false);
      this.notify.success('Your reply has been sent.');
    });
  }
}
