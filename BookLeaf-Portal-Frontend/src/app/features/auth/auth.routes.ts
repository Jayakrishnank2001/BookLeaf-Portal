import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login.component').then((m) => m.LoginComponent),
  },
];
