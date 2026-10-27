import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';
import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./tickets/admin-tickets.component').then(
            (m) => m.AdminTicketsComponent
          ),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./ticket-detail/admin-ticket-detail.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
    ],
  },
];
