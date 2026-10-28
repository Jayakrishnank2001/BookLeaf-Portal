import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../../core/services/book.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorMessage } from '../../../../core/api/api-error';
import { Book } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { BookCoverComponent } from '../../../../shared/components/book-cover/book-cover.component';
import { SelectComponent, DropdownOption } from '../../../../shared/components/select/select.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { DatePipe } from '../../../../shared/pipes/date.pipe';

type SortKey = 'title' | 'copies' | 'royalty' | 'recent';

@Component({
  selector: 'app-author-books',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, IconComponent, BadgeComponent, BookCoverComponent, SelectComponent, MoneyPipe, DatePipe],
  templateUrl: './author-books.component.html',
  styleUrls: ['./author-books.component.css'],
})
export class AuthorBooksComponent implements OnInit {
  private bookSvc = inject(BookService);
  private notify = inject(NotificationService);

  loading = signal(true);
  search = '';
  genreFilter: string | null = null;
  statusFilter: string | null = null;
  sortKey: SortKey = 'recent';

  private books = signal<Book[]>([]);
  filtered = signal<Book[]>([]);
  genreOptions: DropdownOption[] = [];
  statusOptions: DropdownOption[] = [];
  sortOptions: DropdownOption[] = [
    { value: 'recent', label: 'Recently added' },
    { value: 'title', label: 'Title (A\u2013Z)' },
    { value: 'copies', label: 'Copies sold (high to low)' },
    { value: 'royalty', label: 'Royalty pending (high to low)' },
  ];

  ngOnInit() {
    this.bookSvc.getBooks().subscribe({
      next: (books) => {
        this.books.set(books);
        // Filter options come from the author's own books, not a hardcoded list.
        this.genreOptions = [{ value: '', label: 'All genres' }, ...this.distinct(books.map((b) => b.genre))];
        this.statusOptions = [{ value: '', label: 'All statuses' }, ...this.distinct(books.map((b) => b.status))];
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  private distinct(values: string[]): DropdownOption[] {
    return [...new Set(values)].sort().map((v) => ({ value: v, label: v }));
  }

  onFilterChange(value: string | null, key: 'genre' | 'status') {
    if (key === 'genre') this.genreFilter = value || null;
    else this.statusFilter = value || null;
    this.applyFilters();
  }

  onSortChange(value: string | null) {
    this.sortKey = (value as SortKey) ?? 'recent';
    this.applyFilters();
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    let list = this.books().filter((b) => {
      if (q && !`${b.title} ${b.isbn ?? ''} ${b.genre}`.toLowerCase().includes(q)) return false;
      if (this.genreFilter && b.genre !== this.genreFilter) return false;
      if (this.statusFilter && b.status !== this.statusFilter) return false;
      return true;
    });

    const s = this.sortKey;
    // The API returns books oldest-first, so "recent" is simply the reverse.
    if (s === 'recent') list = [...list].reverse();
    else {
      list = [...list].sort((a, b) => {
        if (s === 'title') return a.title.localeCompare(b.title);
        if (s === 'copies') return b.copiesSold - a.copiesSold;
        return b.royaltyPending - a.royaltyPending;
      });
    }
    this.filtered.set(list);
  }

  clearFilters() {
    this.search = '';
    this.genreFilter = null;
    this.statusFilter = null;
    this.sortKey = 'recent';
    this.applyFilters();
  }
}
