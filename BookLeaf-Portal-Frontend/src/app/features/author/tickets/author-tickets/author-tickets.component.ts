import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorMessage } from '../../../../core/api/api-error';
import { AuthorTicket } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { SelectComponent, DropdownOption } from '../../../../shared/components/select/select.component';
import { DatePipe } from '../../../../shared/pipes/date.pipe';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-author-tickets',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, BadgeComponent, SelectComponent, DatePipe, TimeAgoPipe],
  templateUrl: './author-tickets.component.html',
  styleUrls: ['./author-tickets.component.css'],
})
export class AuthorTicketsComponent implements OnInit {
  private ticketSvc = inject(TicketService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  search = '';
  statusFilter: string | null = null;
  categoryFilter: string | null = null;
  dateFilter: string | null = null;

  private tickets = signal<AuthorTicket[]>([]);
  filtered = signal<AuthorTicket[]>([]);

  statusOptions: DropdownOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' },
  ];
  categoryOptions: DropdownOption[] = [
    { value: '', label: 'All categories' },
    { value: 'Royalty & Payments', label: 'Royalty & Payments' },
    { value: 'ISBN & Metadata Issues', label: 'ISBN & Metadata Issues' },
    { value: 'Printing & Quality', label: 'Printing & Quality' },
    { value: 'Distribution & Availability', label: 'Distribution & Availability' },
    { value: 'Book Status & Production Updates', label: 'Book Status & Production Updates' },
    { value: 'General Inquiry', label: 'General Inquiry' },
  ];
  dateOptions: DropdownOption[] = [
    { value: '', label: 'Any time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];

  onFilter(value: string | null, key: 'status' | 'category' | 'date') {
    const v = value || null;
    if (key === 'status') this.statusFilter = v;
    else if (key === 'category') this.categoryFilter = v;
    else this.dateFilter = v;
    this.applyFilters();
  }

  ngOnInit() {
    // Polled: when the team replies or changes a status, the list updates on its own.
    this.ticketSvc
      .watchTickets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tickets) => {
          this.tickets.set(tickets);
          this.applyFilters(); // keeps the author's filters and search across refreshes
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    const now = Date.now();
    const list = this.tickets().filter((t) => {
      if (q && !`${t.ticketCode} ${t.subject} ${t.bookTitle ?? ''}`.toLowerCase().includes(q)) return false;
      if (this.statusFilter && t.status !== this.statusFilter) return false;
      if (this.categoryFilter && t.category !== this.categoryFilter) return false;
      if (this.dateFilter) {
        const days = parseInt(this.dateFilter, 10);
        if (+new Date(t.createdAt) < now - days * 86400000) return false;
      }
      return true;
    });
    this.filtered.set([...list].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
  }
}
