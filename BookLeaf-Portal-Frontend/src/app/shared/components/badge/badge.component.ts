import { Component, Input } from '@angular/core';
import { TicketStatus, TicketPriority, TicketCategory, BookStatus } from '../../../core/models/models';

type BadgeKind = 'status' | 'priority' | 'category' | 'book-status';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css'],
})
export class BadgeComponent {
  @Input() kind: BadgeKind = 'status';
  @Input() value: string = '';
  @Input() dot = false;
  @Input() solid = false;

  fg = '';
  bg = '';
  border = '';

  ngOnInit() {
    const p = this.palette();
    this.fg = p.fg;
    this.bg = this.solid ? p.fg : p.bg;
    this.border = this.solid ? 'transparent' : (p.border ?? '');
    if (this.solid) { this.fg = '#fff'; }
  }

  label(): string { return this.value || ''; }

  private palette(): { fg: string; bg: string; border?: string } {
    if (this.kind === 'status') return this.statusPalette(this.value as TicketStatus);
    if (this.kind === 'priority') return this.priorityPalette(this.value as TicketPriority);
    if (this.kind === 'book-status') return this.bookStatusPalette(this.value as BookStatus);
    return this.categoryPalette(this.value as TicketCategory);
  }

  private statusPalette(s: TicketStatus) {
    switch (s) {
      case 'Open': return { fg: 'var(--color-info)', bg: 'var(--color-info-50)', border: 'transparent' };
      case 'In Progress': return { fg: 'var(--color-warning)', bg: 'var(--color-warning-50)', border: 'transparent' };
      case 'Resolved': return { fg: 'var(--color-success)', bg: 'var(--color-success-50)', border: 'transparent' };
      case 'Closed': return { fg: 'var(--color-ink-3)', bg: 'var(--color-paper-2)', border: 'transparent' };
    }
  }

  private priorityPalette(p: TicketPriority) {
    switch (p) {
      case 'Critical': return { fg: 'var(--color-critical)', bg: 'var(--color-critical-50)', border: 'transparent' };
      case 'High': return { fg: 'var(--color-high)', bg: 'var(--color-high-50)', border: 'transparent' };
      case 'Medium': return { fg: 'var(--color-medium)', bg: 'var(--color-medium-50)', border: 'transparent' };
      case 'Low': return { fg: 'var(--color-low)', bg: 'var(--color-low-50)', border: 'transparent' };
    }
  }

  private categoryPalette(c: TicketCategory) {
    switch (c) {
      case 'Royalty & Payments': return { fg: 'var(--color-primary-700)', bg: 'var(--color-primary-50)' };
      case 'ISBN & Metadata Issues': return { fg: 'var(--color-info)', bg: 'var(--color-info-50)' };
      case 'Printing & Quality': return { fg: 'var(--color-secondary)', bg: 'var(--color-secondary-50)' };
      case 'Distribution & Availability': return { fg: 'var(--color-accent)', bg: 'var(--color-accent-50)' };
      case 'Book Status & Production Updates': return { fg: 'var(--color-high)', bg: 'var(--color-high-50)' };
      case 'General Inquiry': return { fg: 'var(--color-ink-2)', bg: 'var(--color-paper-2)' };
    }
  }

  private bookStatusPalette(s: BookStatus) {
    switch (s) {
      case 'Published & Live': return { fg: 'var(--color-success)', bg: 'var(--color-success-50)' };
      case 'In Production - Cover Design':
      case 'In Production - Typesetting':
      case 'In Production - Editing':
      case 'In Press': return { fg: 'var(--color-warning)', bg: 'var(--color-warning-50)' };
    }
  }
}
