import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminTicketService, PaginatedTickets } from '../../../core/services/admin-ticket.service';
import { Ticket, TicketStatus, TicketPriority } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SelectComponent, DropdownOption } from '../../../shared/components/select/select.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

type SortKey = 'priority' | 'created' | 'updated' | 'subject';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, BadgeComponent, SelectComponent, DatePipe, TimeAgoPipe],
  templateUrl: './admin-tickets.component.html',
  styleUrls: ['./admin-tickets.component.css'],
})
export class AdminTicketsComponent implements OnInit {
  private adminSvc = inject(AdminTicketService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal<string | null>(null);
  search = '';
  statusFilter: string | null = null;
  categoryFilter: string | null = null;
  priorityFilter: string | null = null;
  assignedFilter: string | null = null;
  dateFilter: string | null = null;
  sortKey: SortKey = 'priority';
  sortDir: 'asc' | 'desc' = 'desc';

  currentUserId = this.auth.currentUser()?.id ?? null;

  private all = signal<Ticket[]>([]);
  filtered = signal<Ticket[]>([]);

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
    { value: 'ISBN & Metadata Issues', label: 'ISBN & Metadata' },
    { value: 'Printing & Quality', label: 'Printing & Quality' },
    { value: 'Distribution & Availability', label: 'Distribution & Availability' },
    { value: 'Book Status & Production Updates', label: 'Book Status & Production' },
    { value: 'General Inquiry', label: 'General Inquiry' },
  ];
  priorityOptions: DropdownOption[] = [
    { value: '', label: 'All priorities' },
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];
  assignedOptions: DropdownOption[] = [
    { value: '', label: 'Anyone' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'me', label: 'My Tickets' },
  ];
  dateOptions: DropdownOption[] = [
    { value: '', label: 'Any time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];
  sortOptions: DropdownOption[] = [
    { value: 'priority', label: 'Priority (Critical first)' },
    { value: 'created', label: 'Oldest first' },
    { value: 'updated', label: 'Recently updated' },
    { value: 'subject', label: 'Subject (A–Z)' },
  ];

  prioOrder: Record<TicketPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  isUrgent = (p: TicketPriority) => p === 'Critical' || p === 'High';
  prioColor = (p: TicketPriority) =>
    p === 'Critical' ? 'var(--color-critical)' : p === 'High' ? 'var(--color-high)' : p === 'Medium' ? 'var(--color-medium)' : 'var(--color-low)';

  ngOnInit() {
    // Subscribe to query param changes so sidebar nav (Ticket Queue → My Assigned
    // → Ticket Queue) updates the assigned filter without page reload.
    this.route.queryParamMap.subscribe((params) => {
      const assignedParam = params.get('assigned');
      this.assignedFilter = assignedParam === 'me' ? 'me' : null;
      this.applyFilters();
    });

    this.adminSvc.getTickets({ sort: 'updatedAt', order: 'desc' }).subscribe({
      next: (result: PaginatedTickets) => {
        this.all.set(result.tickets);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load tickets. Please check your connection and try again.');
        this.loading.set(false);
      },
    });
  }

  onFilter(value: string | null, key: 'status' | 'category' | 'priority' | 'assigned' | 'date') {
    const v = value || null;
    if (key === 'status') this.statusFilter = v;
    else if (key === 'category') this.categoryFilter = v;
    else if (key === 'priority') this.priorityFilter = v;
    else if (key === 'assigned') this.assignedFilter = v;
    else this.dateFilter = v;
    this.applyFilters();
  }

  onSort(value: string | null) {
    this.sortKey = (value as SortKey) ?? 'priority';
    this.applyFilters();
  }

  toggleSort(key: SortKey) {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.applyFilters();
  }

  sortIcon(key: SortKey): 'sort' | 'arrow-up' | 'arrow-down' {
    if (this.sortKey !== key) return 'sort';
    return this.sortDir === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    const now = Date.now();
    let list = this.all().filter((t) => {
      if (q && !`${t.ticketCode} ${t.subject} ${t.authorName} ${t.bookTitle ?? ''}`.toLowerCase().includes(q)) return false;
      if (this.statusFilter && t.status !== this.statusFilter) return false;
      if (this.categoryFilter && t.category !== this.categoryFilter) return false;
      if (this.priorityFilter && t.priority !== this.priorityFilter) return false;
      if (this.assignedFilter) {
        if (this.assignedFilter === 'unassigned' && t.assignedTo) return false;
        else if (this.assignedFilter === 'me') {
          if (t.assignedTo !== this.currentUserId) return false;
        } else if (t.assignedTo !== this.assignedFilter) return false;
      }
      if (this.dateFilter) {
        const days = parseInt(this.dateFilter, 10);
        if (+new Date(t.createdAt) < now - days * 86400000) return false;
      }
      return true;
    });

    const dir = this.sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (this.sortKey === 'priority') return (this.prioOrder[a.priority] - this.prioOrder[b.priority]) * dir || +new Date(a.createdAt) - +new Date(b.createdAt);
      if (this.sortKey === 'created') return (+new Date(a.createdAt) - +new Date(b.createdAt)) * dir;
      if (this.sortKey === 'updated') return (+new Date(a.updatedAt) - +new Date(b.updatedAt)) * dir;
      return a.subject.localeCompare(b.subject) * dir;
    });
    this.filtered.set(list);
  }

  clearFilters() {
    this.search = ''; this.statusFilter = null; this.categoryFilter = null;
    this.priorityFilter = null; this.assignedFilter = null; this.dateFilter = null;
    this.sortKey = 'priority'; this.sortDir = 'asc';
    this.applyFilters();
  }
}
