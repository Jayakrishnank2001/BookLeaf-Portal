import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../../../../core/models/models';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';
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
  private auth = inject(AuthService);

  loading = signal(true);
  search = '';
  statusFilter: string | null = null;
  priorityFilter: string | null = null;
  categoryFilter: string | null = null;
  dateFilter: string | null = null;

  private tickets = signal<Ticket[]>([]);
  filtered = signal<Ticket[]>([]);

  statusOptions: DropdownOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' },
  ];
  priorityOptions: DropdownOption[] = [
    { value: '', label: 'All priorities' },
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
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

  isUrgent = (p: TicketPriority) => p === 'Critical' || p === 'High';

  onFilter(value: string | null, key: 'status' | 'priority' | 'category' | 'date') {
    const v = value || null;
    if (key === 'status') this.statusFilter = v;
    else if (key === 'priority') this.priorityFilter = v;
    else if (key === 'category') this.categoryFilter = v;
    else this.dateFilter = v;
    this.applyFilters();
  }

  ngOnInit() {
    const authorId = this.auth.currentUser()?.id ?? '';
    this.ticketSvc.getTickets(authorId).subscribe((t) => { this.tickets.set(t); this.applyFilters(); this.loading.set(false); });
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    const now = Date.now();
    let list = this.tickets().filter((t) => {
      if (q && !`${t.ticketCode} ${t.subject} ${t.bookTitle ?? ''}`.toLowerCase().includes(q)) return false;
      if (this.statusFilter && t.status !== this.statusFilter) return false;
      if (this.priorityFilter && t.priority !== this.priorityFilter) return false;
      if (this.categoryFilter && t.category !== this.categoryFilter) return false;
      if (this.dateFilter) {
        const days = parseInt(this.dateFilter, 10);
        if (+new Date(t.createdAt) < now - days * 86400000) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    this.filtered.set(list);
  }
}
