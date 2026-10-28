import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/models';
import { ApiBook } from '../api/api.types';
import { toBook } from '../api/mappers';

/** The API scopes every request to the logged-in author via the JWT, so no author id is sent. */
@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/books`;

  getBooks(): Observable<Book[]> {
    return this.http.get<{ books: ApiBook[] }>(this.url).pipe(map((res) => res.books.map(toBook)));
  }

  /** Emits undefined when the book doesn't exist or isn't this author's (404 / invalid id). */
  getBook(id: string): Observable<Book | undefined> {
    return this.http.get<{ book: ApiBook }>(`${this.url}/${id}`).pipe(
      map((res) => toBook(res.book)),
      catchError((err) => (err.status === 404 || err.status === 400 ? of(undefined) : throwError(() => err))),
    );
  }
}
