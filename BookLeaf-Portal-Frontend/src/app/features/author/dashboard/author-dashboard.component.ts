import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorMessage } from '../../../core/api/api-error';
import { AuthorTicket, Book } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { BookCoverComponent } from '../../../shared/components/book-cover/book-cover.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface Metric {
  label: string;
  value: string;
  icon: IconName;
  accent: string;
  sub?: string;
}

@Component({
  selector: 'app-author-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, IconComponent, BadgeComponent, BookCoverComponent, MoneyPipe, TimeAgoPipe],
  templateUrl: './author-dashboard.component.html',
  styleUrls: ['./author-dashboard.component.css'],
})
export class AuthorDashboardComponent implements OnInit {
  private bookSvc = inject(BookService);
  private ticketSvc = inject(TicketService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  ticketsLoading = signal(true);
  books = signal<Book[]>([]);
  tickets = signal<AuthorTicket[]>([]);

  firstName = this.auth.currentUser()?.name.split(' ')[0] ?? 'Author';
  greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  })();

  recentBooks = computed(() => this.books().slice(-3).reverse());
  recentTickets = computed(() =>
    [...this.tickets()].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4),
  );

  metrics = computed<Metric[]>(() => {
    const b = this.books();
    const open = this.tickets().filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
    return [
      { label: 'Total books', value: String(b.length), icon: 'book', accent: 'var(--color-primary)' },
      {
        label: 'Published',
        value: String(b.filter((x) => x.status === 'Published & Live').length),
        icon: 'check',
        accent: 'var(--color-success)',
      },
      {
        label: 'Copies sold',
        value: b.reduce((s, x) => s + x.copiesSold, 0).toLocaleString('en-IN'),
        icon: 'trending',
        accent: 'var(--color-info)',
      },
      {
        label: 'Pending royalty',
        value: '\u20b9' + b.reduce((s, x) => s + x.royaltyPending, 0).toLocaleString('en-IN'),
        icon: 'rupee',
        accent: 'var(--color-accent)',
      },
      { label: 'Open tickets', value: String(open), icon: 'ticket', accent: 'var(--color-high)' },
    ];
  });

  ngOnInit() {
    this.bookSvc.getBooks().subscribe({
      next: (books) => {
        this.books.set(books);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });

    // Polled, so the "Open tickets" count and recent list stay current.
    this.ticketSvc
      .watchTickets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tickets) => {
          this.tickets.set(tickets);
          this.ticketsLoading.set(false);
        },
        error: () => this.ticketsLoading.set(false),
      });
  }
}
