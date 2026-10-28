import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/models';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

const API_BASE = 'http://localhost:5000';

const STORAGE_KEY = 'bookleaf-auth';

const TOKEN_KEY = 'bookleaf_token';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.restore());

  constructor(private http: HttpClient) { }

  currentUser = signal<User | null>(this.restore());
  isAuthenticated = computed(() => this.currentUser() !== null);

  private restore(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/api/v1/auth/login`, { email, password })
      .pipe(
        map(({ token, user }) => {
          localStorage.setItem(TOKEN_KEY, token);                 // needed for later API calls
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          this.currentUser.set(user);
          return user;
        }),
        catchError((err: HttpErrorResponse) => {
          // Backend errors look like { error: { code, message } }
          const message =
            err.status === 0
              ? 'Cannot reach the server. Please try again.'
              : err.error?.error?.message || 'Login failed';
          return throwError(() => new Error(message));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
  }

  hasRole(role: 'author' | 'admin'): boolean {
    return this.currentUser()?.role === role;
  }
}
