import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Book } from '../models/models';
import { MOCK_BOOKS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class BookService {
  getBooks(): Observable<Book[]> {
    return of(MOCK_BOOKS).pipe(delay(450));
  }

  getBooksByAuthor(authorId: string): Observable<Book[]> {
    return of(MOCK_BOOKS.filter((b) => b.authorId === authorId)).pipe(delay(450));
  }

  getBook(id: string): Observable<Book | undefined> {
    return of(MOCK_BOOKS.find((b) => b.id === id)).pipe(delay(350));
  }

  getGenres(): string[] {
    return Array.from(new Set(MOCK_BOOKS.map((b) => b.genre)));
  }

  getStatuses(): Book['status'][] {
    return Array.from(new Set(MOCK_BOOKS.map((b) => b.status)));
  }

  totalCopiesSold(authorId: string): number {
    return MOCK_BOOKS.filter((b) => b.authorId === authorId).reduce((s, b) => s + b.copiesSold, 0);
  }

  totalPendingRoyalty(authorId: string): number {
    return MOCK_BOOKS.filter((b) => b.authorId === authorId).reduce((s, b) => s + b.royaltyPending, 0);
  }

  publishedCount(authorId: string): number {
    return MOCK_BOOKS.filter((b) => b.authorId === authorId && b.status === 'Published & Live').length;
  }
}
