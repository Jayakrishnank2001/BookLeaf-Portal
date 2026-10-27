import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { BookService } from '../../../../core/services/book.service';
import { Book } from '../../../../core/models/models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { DatePipe } from '../../../../shared/pipes/date.pipe';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-author-book-detail',
    standalone: true,
    imports: [RouterLink, IconComponent, BadgeComponent, MoneyPipe, DatePipe, DecimalPipe],
    templateUrl: './author-book-detail.component.html',
    styleUrls: ['./author-book-detail.component.css'],
})

export class AuthorBookDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private bookSvc = inject(BookService);
    loading = signal(true);
    book = signal<Book | undefined>(undefined);
    paidPct = computed(() => {
        const b = this.book();
        if (!b || b.royaltyEarned === 0)
            return 0;
        return Math.min(100, Math.round((b.royaltyPaid / b.royaltyEarned) * 100));
    });
    
    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.bookSvc.getBook(id).subscribe((b) => {
            this.book.set(b);
            this.loading.set(false);
        });
    }
}
