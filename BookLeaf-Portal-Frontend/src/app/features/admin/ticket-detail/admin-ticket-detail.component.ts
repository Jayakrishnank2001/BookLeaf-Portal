import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminTicketService } from '../../../core/services/admin-ticket.service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { DatePipe } from '../../../shared/pipes/date.pipe';

export interface TicketFilterBadge {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-ticket-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, BadgeComponent, TimeAgoPipe, DatePipe],
  templateUrl: './admin-ticket-detail.component.html',
  styleUrls: ['./admin-ticket-detail.component.css'],
})
export class AdminTicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminSvc = inject(AdminTicketService);

  ticket = signal<Ticket | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  statusSelection: TicketStatus = 'Open';
  prioritySelection: TicketPriority = 'Medium';

  // Modals / overlays
  showReplyBox = signal(false);
  showNoteBox = signal(false);
  showAssign = signal(false);
  showDraft = signal(false);

  // Forms
  replyMessage = '';
  noteContent = '';
  assignAdminId = '';

  statusOptions: TicketFilterBadge[] = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Closed', value: 'Closed' },
  ];
  priorityOptions: TicketFilterBadge[] = [
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  ngOnInit() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (!ticketId) {
      this.error.set('No ticket ID provided.');
      this.loading.set(false);
      return;
    }

    this.adminSvc.getTicket(ticketId).subscribe({
      next: (t) => {
        if (!t) {
          this.error.set('Ticket not found.');
        } else {
          this.ticket.set(t);
          this.statusSelection = t.status;
          this.prioritySelection = t.priority;
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load ticket. Please check your connection.');
        this.loading.set(false);
      },
    });
  }

  isUrgent(p: TicketPriority): boolean {
    return p === 'Critical' || p === 'High';
  }

  statusColor(s: TicketStatus): string {
    return s === 'Resolved' ? 'var(--color-success)' : s === 'Closed' ? 'var(--color-neutral)' : s === 'In Progress' ? 'var(--color-info)' : 'var(--color-warning)';
  }

  priorityColor(p: TicketPriority): string {
    return p === 'Critical' ? 'var(--color-critical)' : p === 'High' ? 'var(--color-high)' : p === 'Medium' ? 'var(--color-medium)' : 'var(--color-low)';
  }

  // ---- Actions ----

  updateStatus(status: TicketStatus) {
    const t = this.ticket();
    if (!t) return;
    this.adminSvc.updateStatus(t.id, status).subscribe({
      next: (updated) => this.ticket.set(updated),
      error: () => this.error.set('Failed to update status.'),
    });
  }

  overrideClassification(category?: TicketCategory, priority?: TicketPriority) {
    const t = this.ticket();
    if (!t) return;
    this.adminSvc.overrideClassification(t.id, { category, priority }).subscribe({
      next: (updated) => { this.ticket.set(updated); this.showAssign.set(false); },
      error: () => this.error.set('Failed to update classification.'),
    });
  }

  assignTicket(adminId: string) {
    const t = this.ticket();
    if (!t) return;
    this.adminSvc.assignTicket(t.id, adminId).subscribe({
      next: (updated) => { this.ticket.set(updated); this.showAssign.set(false); },
      error: () => this.error.set('Failed to assign ticket.'),
    });
  }

  addInternalNote() {
    const t = this.ticket();
    if (!t || !this.noteContent.trim()) return;
    this.adminSvc.addInternalNote(t.id, this.noteContent.trim()).subscribe({
      next: () => {
        this.adminSvc.getTicket(t.id).subscribe({
          next: (updated) => { if (updated) this.ticket.set(updated); },
        });
        this.noteContent = '';
        this.showNoteBox.set(false);
      },
      error: () => this.error.set('Failed to add note.'),
    });
  }

  regenerateDraft() {
    const t = this.ticket();
    if (!t) return;
    this.adminSvc.getAIDraft(t.id, true).subscribe({
      next: (draft) => {
        this.adminSvc.getTicket(t.id).subscribe({
          next: (updated) => { if (updated) this.ticket.set(updated); },
        });
        this.showDraft.set(false);
      },
      error: () => this.error.set('Failed to regenerate draft.'),
    });
  }

  sendReply() {
    const t = this.ticket();
    if (!t || !this.replyMessage.trim()) return;
    this.adminSvc.sendReply(t.id, this.replyMessage.trim()).subscribe({
      next: (updated) => { this.ticket.set(updated); this.replyMessage = ''; this.showReplyBox.set(false); },
      error: () => this.error.set('Failed to send reply.'),
    });
  }
}
