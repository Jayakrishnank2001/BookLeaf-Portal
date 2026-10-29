import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminTicketService } from '../../../core/services/admin-ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorMessage } from '../../../core/api/api-error';
import { avatarColorFor, initialsFor } from '../../../core/api/mappers';
import { Ticket, TicketCategory, TicketMessage, TicketPriority, TicketStatus } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { SelectComponent, DropdownOption } from '../../../shared/components/select/select.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { DatePipe } from '../../../shared/pipes/date.pipe';

type SavingField = 'status' | 'priority' | 'category' | 'assign';

const toOptions = (values: string[]): DropdownOption[] => values.map((v) => ({ value: v, label: v }));

@Component({
  selector: 'app-admin-ticket-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, BadgeComponent, AvatarComponent, SelectComponent, TimeAgoPipe, DatePipe],
  templateUrl: './admin-ticket-detail.component.html',
  styleUrls: ['./admin-ticket-detail.component.css'],
})
export class AdminTicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminSvc = inject(AdminTicketService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  ticket = signal<Ticket | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // What is currently being saved. Selects are disabled meanwhile so changes can't overlap.
  savingField = signal<SavingField | null>(null);
  sendingReply = signal(false);
  addingNote = signal(false);

  // AI draft state
  draftLoading = signal(false);
  draftUnavailable = signal(false);
  draftInserted = signal(false);
  draftErrorReason = signal<string | null>(null);
  draftRetryAfter = signal<number | null>(null);

  // Form fields. Signals (not plain fields): the app is zoneless, so Angular only re-renders
  // when a signal changes. Clearing a plain field after an async save would leave stale text on screen.
  replyMessage = signal('');
  noteContent = signal('');
  resolveAfterSend = signal(false);

  statusOptions = toOptions(['Open', 'In Progress', 'Resolved', 'Closed']);
  priorityOptions = toOptions(['Critical', 'High', 'Medium', 'Low']);
  categoryOptions = toOptions([
    'Royalty & Payments',
    'ISBN & Metadata Issues',
    'Printing & Quality',
    'Distribution & Availability',
    'Book Status & Production Updates',
    'General Inquiry',
  ]);

  isClosed = computed(() => this.ticket()?.status === 'Closed');
  isAssignedToMe = computed(() => {
    const t = this.ticket();
    return !!t?.assignedTo && t.assignedTo === this.auth.currentUser()?.id;
  });
  draft = computed(() => {
    const d = this.ticket()?.aiDraft;
    return d?.content ? d : null;
  });

  // Highlights tickets that have been waiting a while (oldest unresolved should stand out).
  waiting = computed(() => {
    const t = this.ticket();
    if (!t || t.status === 'Resolved' || t.status === 'Closed') return null;
    const days = Math.floor((Date.now() - +new Date(t.createdAt)) / 86400000);
    return days >= 2 ? { days, severe: days >= 5 } : null;
  });

  // The author's original query is always the first message, even when the API
  // returns only the replies.
  thread = computed<TicketMessage[]>(() => {
    const t = this.ticket();
    if (!t) return [];
    const messages = t.messages ?? [];
    const startsWithOriginal = messages[0]?.authorRole === 'author' && messages[0].content === t.description;
    if (startsWithOriginal) return messages;
    const original: TicketMessage = {
      id: `${t.id}-original`,
      authorId: t.authorId,
      authorName: t.authorName,
      authorRole: 'author',
      content: t.description,
      createdAt: t.createdAt,
    };
    return [original, ...messages];
  });

  ngOnInit() {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id');
    this.error.set(null);
    this.loading.set(true);
    if (!id) {
      this.error.set('No ticket ID provided.');
      this.loading.set(false);
      return;
    }

    this.adminSvc.getTicket(id).subscribe({
      next: (t) => {
        if (!t) this.error.set('Ticket not found.');
        else {
          this.setTicket(t);
          this.autoDraft(t);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Unable to load ticket. Please check your connection.'));
        this.loading.set(false);
      },
    });
  }

  // ---- helpers for the template ----

  isUrgent(p: TicketPriority): boolean {
    return p === 'Critical' || p === 'High';
  }

  initials(name: string): string {
    return initialsFor(name);
  }

  colorFor(msg: TicketMessage): string {
    return msg.authorRole === 'admin' ? '#2f5d4a' : avatarColorFor(msg.authorName);
  }

  avatarColor(name: string): string {
    return avatarColorFor(name);
  }

  /** Tells the admin whether a field still holds the AI's answer or was overridden. */
  aiHint(field: 'category' | 'priority'): string | null {
    const t = this.ticket();
    const ai = t?.aiClassification;
    if (!t || !ai) return null;
    const suggested = field === 'category' ? ai.category : ai.priority;
    const current = field === 'category' ? t.category : t.priority;
    return suggested === current ? 'Set by AI' : `Overridden \u00b7 AI suggested ${suggested}`;
  }

  // ---- ticket updates (optimistic: the UI updates at once and rolls back on failure) ----

  private mutate(
    field: SavingField,
    optimistic: Partial<Ticket>,
    request: (current: Ticket) => Observable<Ticket>,
    successMessage: string,
  ) {
    const previous = this.ticket();
    if (!previous || this.savingField()) return;

    this.ticket.set({ ...previous, ...optimistic });
    this.savingField.set(field);

    request(previous).subscribe({
      next: (updated) => {
        this.setTicket(updated);
        this.savingField.set(null);
        this.notify.success(successMessage);
      },
      error: (err) => {
        this.ticket.set(previous);
        this.savingField.set(null);
        this.notify.error(apiErrorMessage(err, 'Could not save the change. Please try again.'));
      },
    });
  }

  onStatusChange(value: string | null) {
    if (!value) return;
    this.mutate('status', { status: value as TicketStatus }, (t) => this.adminSvc.updateStatus(t.id, value as TicketStatus), 'Status updated');
  }

  onPriorityChange(value: string | null) {
    if (!value) return;
    const priority = value as TicketPriority;
    this.mutate('priority', { priority }, (t) => this.adminSvc.overrideClassification(t.id, { priority }), 'Priority updated');
  }

  onCategoryChange(value: string | null) {
    if (!value) return;
    const category = value as TicketCategory;
    this.mutate('category', { category }, (t) => this.adminSvc.overrideClassification(t.id, { category }), 'Category updated');
  }

  assignToMe() {
    const me = this.auth.currentUser();
    if (!me) return;
    this.mutate('assign', { assignedTo: me.id, assignedToName: me.name }, (t) => this.adminSvc.assignTicket(t.id, me.id), 'Assigned to you');
  }

  // ---- AI draft ----

  /** Opening a ticket that still needs a reply prepares a draft (the API caches it, so this costs nothing twice). */
  private autoDraft(t: Ticket) {
    if (t.aiDraft?.content || t.status === 'Resolved' || t.status === 'Closed') return;
    this.generateDraft(false);
  }

  generateDraft(regenerate: boolean) {
    const t = this.ticket();
    if (!t || this.draftLoading()) return;
    this.draftLoading.set(true);
    this.draftUnavailable.set(false);
    this.draftErrorReason.set(null);
    this.draftRetryAfter.set(null);

    this.adminSvc.getAIDraft(t.id, regenerate).subscribe({
      next: () => this.refreshTicket(() => {
        this.draftLoading.set(false);
        this.draftInserted.set(false);
        if (!this.draft()) this.draftUnavailable.set(true);
      }),
      error: (err: HttpErrorResponse) => {
        // Capture the specific error reason for display (RATE_LIMITED, PROVIDER_ERROR, etc.)
        const body = err.error?.error;
        this.draftErrorReason.set(body?.reason ?? null);
        this.draftRetryAfter.set(body?.retryAfter ?? null);
        // AI down / rate limited / no key: the admin can still write the reply by hand.
        this.draftLoading.set(false);
        this.draftUnavailable.set(true);
      },
    });
  }

  useDraft() {
    const d = this.draft();
    if (!d) return;
    this.replyMessage.set(d.content);
    this.draftInserted.set(true);
    setTimeout(() => document.getElementById('reply-box')?.focus(), 0);
  }

  // ---- reply & notes ----

  sendReply() {
    const t = this.ticket();
    const message = this.replyMessage().trim();
    if (!t || !message || this.sendingReply()) return;
    this.sendingReply.set(true);

    this.adminSvc.sendReply(t.id, message).subscribe({
      next: (updated) => {
        this.setTicket(updated);
        this.replyMessage.set('');
        this.draftInserted.set(false);
        this.notify.success('Reply sent to the author');

        if (this.resolveAfterSend() && updated.status !== 'Resolved') {
          this.adminSvc.updateStatus(t.id, 'Resolved').subscribe({
            next: (resolved) => {
              this.setTicket(resolved);
              this.resolveAfterSend.set(false);
              this.sendingReply.set(false);
            },
            error: () => {
              this.sendingReply.set(false);
              this.notify.warning('Reply sent, but the ticket could not be marked as resolved.');
            },
          });
        } else {
          this.sendingReply.set(false);
        }
      },
      error: (err) => {
        this.sendingReply.set(false);
        this.notify.error(apiErrorMessage(err, 'Failed to send the reply. Your text is still here.'));
      },
    });
  }

  addNote() {
    const t = this.ticket();
    const content = this.noteContent().trim();
    if (!t || !content || this.addingNote()) return;
    this.addingNote.set(true);

    this.adminSvc.addInternalNote(t.id, content).subscribe({
      next: () => {
        this.noteContent.set('');
        this.refreshTicket(() => this.addingNote.set(false));
        this.notify.success('Internal note added');
      },
      error: (err) => {
        this.addingNote.set(false);
        this.notify.error(apiErrorMessage(err, 'Failed to add the note.'));
      },
    });
  }

  /**
   * Always store a fresh copy: signals ignore set() with the same object reference, so a
   * service that returns the object it mutated in place would otherwise not update the page.
   */
  private setTicket(ticket: Ticket) {
    this.ticket.set({ ...ticket });
  }

  private refreshTicket(done?: () => void) {
    const id = this.ticket()?.id;
    if (!id) return;
    this.adminSvc.getTicket(id).subscribe({
      next: (updated) => {
        if (updated) this.setTicket(updated);
        done?.();
      },
      error: () => done?.(),
    });
  }
}