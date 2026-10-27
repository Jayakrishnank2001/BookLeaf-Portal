import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { BookService } from "../../../core/services/book.service";
import { TicketService } from "../../../core/services/ticket.service";
import { AuthService } from "../../../core/services/auth.service";
import { Book, Ticket } from "../../../core/models/models";
import {
  IconComponent,
  IconName,
} from "../../../shared/components/icon/icon.component";
import { BadgeComponent } from "../../../shared/components/badge/badge.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { TimeAgoPipe } from "../../../shared/pipes/time-ago.pipe";
import { DatePipe } from "../../../shared/pipes/date.pipe";
interface Metric {
  label: string;
  value: string;
  icon: IconName;
  accent: string;
  sub?: string;
}
@Component({
  selector: "app-author-dashboard",
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    IconComponent,
    BadgeComponent,
    BadgeComponent,
    MoneyPipe,
    TimeAgoPipe,
    DatePipe,
  ],
  templateUrl: "./author-dashboard.component.html",
  styleUrls: ["./author-dashboard.component.css"],
})
export class AuthorDashboardComponent implements OnInit {
  private bookSvc = inject(BookService);
  private ticketSvc = inject(TicketService);
  private auth = inject(AuthService);
  loading = signal(true);
  ticketsLoading = signal(true);
  books = signal<Book[]>([]);
  tickets = signal<Ticket[]>([]);
  firstName = this.auth.currentUser()?.name.split(" ")[0] ?? "Author";
  recentBooks = computed(() => this.books().slice(0, 3));
  recentTickets = computed(() =>
    [...this.tickets()]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 4),
  );
  metrics = computed<Metric[]>(() => {
    const b = this.books();
    const open = this.tickets().filter(
      (t) => t.status === "Open" || t.status === "In Progress",
    ).length;
    return [
      {
        label: "Total books",
        value: String(b.length),
        icon: "book",
        accent: "var(--color-primary)",
      },
      {
        label: "Published",
        value: String(b.filter((x) => x.status === "Published & Live").length),
        icon: "check",
        accent: "var(--color-success)",
      },
      {
        label: "Copies sold",
        value: b.reduce((s, x) => s + x.copiesSold, 0).toLocaleString("en-IN"),
        icon: "trending",
        accent: "var(--color-info)",
      },
      {
        label: "Pending royalty",
        value:
          "\u20b9" +
          b.reduce((s, x) => s + x.royaltyPending, 0).toLocaleString("en-IN"),
        icon: "rupee",
        accent: "var(--color-accent)",
      },
      {
        label: "Open tickets",
        value: String(open),
        icon: "ticket",
        accent: "var(--color-high)",
      },
    ];
  });
  ngOnInit() {
    const authorId = this.auth.currentUser()?.id ?? "";
    this.bookSvc.getBooksByAuthor(authorId).subscribe((b) => {
      this.books.set(b);
      this.loading.set(false);
    });
    this.ticketSvc.getTickets(authorId).subscribe((t) => {
      this.tickets.set(t);
      this.ticketsLoading.set(false);
    });
  }
}
