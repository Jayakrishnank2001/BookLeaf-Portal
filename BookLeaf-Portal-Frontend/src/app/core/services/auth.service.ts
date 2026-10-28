import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/models';
import { ApiLoginResponse } from '../api/api.types';
import { apiErrorMessage } from '../api/api-error';
import { toUser } from '../api/mappers';

const TOKEN_KEY = 'bookleaf_token';
const USER_KEY = 'bookleaf_user';

/** Reads the `exp` claim so an expired token is never treated as a logged-in session. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(this.restoreSession());
  isAuthenticated = computed(() => this.currentUser() !== null);

  private restoreSession(): User | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      if (!token || !raw || isTokenExpired(token)) {
        this.clearStorage();
        return null;
      }
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<ApiLoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(({ token, user }) => {
          const mapped = toUser(user);
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(mapped));
          this.currentUser.set(mapped);
          return mapped;
        }),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Login failed')))),
      );
  }

  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }
}
