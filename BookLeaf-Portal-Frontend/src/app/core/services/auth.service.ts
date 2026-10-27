import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User } from '../models/models';
import { MOCK_USERS } from './mock-data';

const STORAGE_KEY = 'bookleaf-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(this.restore());
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

  login(email: string, _password: string): Observable<User> {
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return of(user).pipe(
      delay(700),
      map((u) => {
        if (!u) throw new Error('No account found with that email. Try priya.sharma@email.com or admin@bookleaf.com.');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        this.currentUser.set(u);
        return u;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.currentUser$.next(null);
  }

  hasRole(role: 'author' | 'admin'): boolean {
    return this.currentUser()?.role === role;
  }
}
