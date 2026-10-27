import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Book } from '../../../core/models/models';
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
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  fileName = signal<string | null>(null);
  submitted = signal(false);
  createdId = signal<string | null>(null);
  createdCode = signal<string>('');
  createdSubject = signal<string>('');
  createdBook = signal<string | null>(null);
  selectedBookId = signal<string>('');

  books: Book[] = [];
  bookOptions: DropdownOption[] = [];

  form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.minLength(6)]],
    description: ['', [Validators.required, Validators.minLength(12)]],
  });

  ngOnInit() {
    const authorId = this.auth.currentUser()?.id ?? '';
    this.bookSvc.getBooksByAuthor(authorId).subscribe((b) => {
      this.books = b;
      this.bookOptions = [
        { value: '', label: 'General / Account Level' },
        ...b.map((x) => ({ value: x.id, label: x.title })),
      ];
      const preselect = this.route.snapshot.queryParamMap.get('bookId');
      if (preselect && b.some((x) => x.id === preselect)) this.selectedBookId.set(preselect);
    });
  }

  onBookSelect(value: string | null) {
    this.selectedBookId.set(value ?? '');
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) this.fileName.set(input.files[0].name);
  }

  showErr(field: 'subject' | 'description'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const user = this.auth.currentUser()!;
    const v = this.form.getRawValue();
    const bookId = this.selectedBookId() || null;
    this.ticketSvc.createTicket(user.id, user.name, {
      bookId, subject: v.subject, description: v.description,
    }).subscribe((t) => {
      this.loading.set(false);
      this.submitted.set(true);
      this.createdId.set(t.id);
      this.createdCode.set(t.ticketCode);
      this.createdSubject.set(t.subject);
      this.createdBook.set(t.bookTitle);
      this.notify.success('Your query has been submitted.');
    });
  }
}
