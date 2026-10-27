import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AUTHOR_ROUTES } from './features/author/author.routes';
import { ADMIN_ROUTES } from './features/admin/admin.routes';

export const routes: Routes = [
  ...AUTH_ROUTES,
  { path: 'author', loadChildren: () => import('./features/author/author.routes').then((m) => m.AUTHOR_ROUTES) },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
