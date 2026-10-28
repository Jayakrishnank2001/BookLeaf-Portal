import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorMessage } from '../../../../core/api/api-error';
import { AuthorTicket } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { DatePipe } from '../../../../shared/pipes/date.pipe';

@Component({
  selector: 'app-author-ticket-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent, AvatarComponent, DatePipe],
  templateUrl: './author-ticket-detail.component.html',
  styleUrls: ['./author-ticket-detail.component.css'],
})
export class AuthorTicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketSvc = inject(TicketService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  ticket = signal<AuthorTicket | undefined>(undefined);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    // Polled while the page is open; the stream ends by itself if the ticket is Closed or missing.
    this.ticketSvc
      .watchTicket(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticket) => {
          this.announceNewReply(ticket);
          this.ticket.set(ticket);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  /** Toast when a poll brings in a reply that wasn't on screen before. */
  private announceNewReply(next: AuthorTicket | undefined) {
    const previous = this.ticket();
    if (!previous || !next || next.messages.length <= previous.messages.length) return;
    if (next.messages[next.messages.length - 1].authorRole === 'admin') {
      this.notify.info('New response from BookLeaf support.');
    }
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  }

  colorFor(msg: { authorRole: string }): string {
    if (msg.authorRole === 'admin') return '#2f5d4a';
    return this.auth.currentUser()?.avatarColor ?? '#b0492a';
  }
}
