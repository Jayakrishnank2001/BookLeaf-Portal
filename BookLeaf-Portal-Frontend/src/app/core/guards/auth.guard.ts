import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/models';

const homeFor = (role: UserRole) => (role === 'admin' ? '/admin/dashboard' : '/author/dashboard');

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// Not logged in -> login page. Logged in with the wrong role -> that user's own home.
const requireRole = (role: UserRole): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  return user.role === role ? true : router.createUrlTree([homeFor(user.role)]);
};

export const authorGuard = requireRole('author');
export const adminGuard = requireRole('admin');
