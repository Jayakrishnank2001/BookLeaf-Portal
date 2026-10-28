import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { BookService } from '../../../../core/services/book.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorMessage } from '../../../../core/api/api-error';
import { Book } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { BookCoverComponent } from '../../../../shared/components/book-cover/book-cover.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { DatePipe } from '../../../../shared/pipes/date.pipe';

@Component({
  selector: 'app-author-book-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent, BookCoverComponent, MoneyPipe, DatePipe, DecimalPipe],
  templateUrl: './author-book-detail.component.html',
  styleUrls: ['./author-book-detail.component.css'],
})
export class AuthorBookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookSvc = inject(BookService);
  private notify = inject(NotificationService);

  loading = signal(true);
  book = signal<Book | undefined>(undefined);

  paidPct = computed(() => {
    const b = this.book();
    if (!b || b.royaltyEarned === 0) return 0;
    return Math.min(100, Math.round((b.royaltyPaid / b.royaltyEarned) * 100));
  });

  // The data stores only the date of the last payout (not its amount), so the card
  // shows the date and describes the lifetime total underneath. Covers the edge cases:
  // unpublished book, published but never paid, and paid.
  payoutNote = computed(() => {
    const b = this.book();
    if (!b) return '';
    if (b.status !== 'Published & Live') return 'Not yet published';
    return b.royaltyPaid > 0 ? `\u20b9${b.royaltyPaid.toLocaleString('en-IN')} paid in total` : 'No payout yet';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.bookSvc.getBook(id).subscribe({
      next: (book) => {
        this.book.set(book);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }
}
