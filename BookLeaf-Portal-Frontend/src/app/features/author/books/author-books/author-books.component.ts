import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { BookService } from "../../../../core/services/book.service";
import { AuthService } from "../../../../core/services/auth.service";
import { Book, BookStatus } from "../../../../core/models/models";
import {
  IconComponent,
  IconName,
} from "../../../../shared/components/icon/icon.component";
import { BadgeComponent } from "../../../../shared/components/badge/badge.component";
import {
  SelectComponent,
  DropdownOption,
} from "../../../../shared/components/select/select.component";
import { MoneyPipe } from "../../../../shared/pipes/money.pipe";
import { DatePipe } from "../../../../shared/pipes/date.pipe";
type SortKey = "title" | "copies" | "royalty" | "recent";
@Component({
  selector: "app-author-books",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DecimalPipe,
    IconComponent,
    BadgeComponent,
    SelectComponent,
    MoneyPipe,
    DatePipe,
  ],
  templateUrl: "./author-books.component.html",
  styleUrls: ["./author-books.component.css"],
})
export class AuthorBooksComponent implements OnInit {
  private bookSvc = inject(BookService);
  private auth = inject(AuthService);
  loading = signal(true);
  search = "";
  genreFilter: string | null = null;
  statusFilter: string | null = null;
  sortKey: SortKey = "recent";
  private books = signal<Book[]>([]);
  filtered = signal<Book[]>([]);
  genreOptions: DropdownOption[] = [];
  statusOptions: DropdownOption[] = [];
  sortOptions: DropdownOption[] = [
    { value: "recent", label: "Recently added" },
    { value: "title", label: "Title (A–Z)" },
    { value: "copies", label: "Copies sold (high to low)" },
    { value: "royalty", label: "Royalty pending (high to low)" },
  ];
  ngOnInit() {
    const authorId = this.auth.currentUser()?.id ?? "";
    this.bookSvc.getBooksByAuthor(authorId).subscribe((b) => {
      this.books.set(b);
      this.genreOptions = [
        { value: "", label: "All genres" },
        ...this.bookSvc.getGenres().map((g) => ({ value: g, label: g })),
      ];
      this.statusOptions = [
        { value: "", label: "All statuses" },
        ...this.bookSvc.getStatuses().map((s) => ({ value: s, label: s })),
      ];
      this.applyFilters();
      this.loading.set(false);
    });
  }
  onFilterChange(value: string | null, key: "genre" | "status") {
    if (key === "genre") this.genreFilter = value || null;
    else this.statusFilter = value || null;
    this.applyFilters();
  }
  onSortChange(value: string | null) {
    this.sortKey = (value as SortKey) ?? "recent";
    this.applyFilters();
  }
  applyFilters() {
    const q = this.search.trim().toLowerCase();
    let list = this.books().filter((b) => {
      if (
        q &&
        !`${b.title} ${b.isbn ?? ""} ${b.genre}`.toLowerCase().includes(q)
      )
        return false;
      if (this.genreFilter && b.genre !== this.genreFilter) return false;
      if (this.statusFilter && b.status !== this.statusFilter) return false;
      return true;
    });
    const s = this.sortKey;
    list = [...list].sort((a, b) => {
      if (s === "title") return a.title.localeCompare(b.title);
      if (s === "copies") return b.copiesSold - a.copiesSold;
      if (s === "royalty") return b.royaltyPending - a.royaltyPending;
      return 0;
    });
    this.filtered.set(list);
  }
  clearFilters() {
    this.search = "";
    this.genreFilter = null;
    this.statusFilter = null;
    this.sortKey = "recent";
    this.applyFilters();
  }
}
