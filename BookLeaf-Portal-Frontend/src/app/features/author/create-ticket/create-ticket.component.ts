import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorMessage } from '../../../core/api/api-error';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SelectComponent, DropdownOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, SelectComponent],
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.css'],
})
export class CreateTicketComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookSvc = inject(BookService);
  private ticketSvc = inject(TicketService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  fileName = signal<string | null>(null);
  submitted = signal(false);
  createdId = signal<string | null>(null);
  createdCode = signal<string>('');
  createdSubject = signal<string>('');
  createdBook = signal<string | null>(null);
  selectedBookId = signal<string>('');

  // "General / Account Level" is always available, even if the books request fails.
  bookOptions: DropdownOption[] = [{ value: '', label: 'General / Account Level' }];

  form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(5000)]],
  });

  ngOnInit() {
    this.bookSvc.getBooks().subscribe({
      next: (books) => {
        this.bookOptions = [
          { value: '', label: 'General / Account Level' },
          ...books.map((b) => ({ value: b.id, label: b.title })),
        ];
        const preselect = this.route.snapshot.queryParamMap.get('bookId');
        if (preselect && books.some((b) => b.id === preselect)) this.selectedBookId.set(preselect);
      },
      error: (err) => this.notify.error(apiErrorMessage(err, 'Could not load your books.')),
    });
  }

  onBookSelect(value: string | null) {
    this.selectedBookId.set(value ?? '');
  }

  // Attachment is UI-only for now: the file name is shown but nothing is uploaded.
  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) this.fileName.set(input.files[0].name);
  }

  showErr(field: 'subject' | 'description'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.loading()) return; // guards against double submits
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { subject, description } = this.form.getRawValue();

    this.ticketSvc.createTicket({ bookId: this.selectedBookId() || null, subject, description }).subscribe({
      next: (ticket) => {
        this.loading.set(false);
        this.submitted.set(true);
        this.createdId.set(ticket.id);
        this.createdCode.set(ticket.ticketCode);
        this.createdSubject.set(ticket.subject);
        this.createdBook.set(ticket.bookTitle);
        this.notify.success('Your query has been submitted.');
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(apiErrorMessage(err, 'Could not submit your query.'));
      },
    });
  }
}
