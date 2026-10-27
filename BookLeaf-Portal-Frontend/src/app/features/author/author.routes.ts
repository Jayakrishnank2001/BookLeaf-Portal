import { Routes } from '@angular/router';
import { authorGuard } from '../../core/guards/auth.guard';
import { AuthorLayoutComponent } from '../../layouts/author-layout/author-layout.component';

export const AUTHOR_ROUTES: Routes = [
  {
    path: '',
    component: AuthorLayoutComponent,
    canActivate: [authorGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/author-dashboard.component').then(
            (m) => m.AuthorDashboardComponent
          ),
      },
      {
        path: 'books',
        loadComponent: () =>
          import('./books/author-books/author-books.component').then(
            (m) => m.AuthorBooksComponent
          ),
      },
      {
        path: 'books/:id',
        loadComponent: () =>
          import('./books/author-book-detail/author-book-detail.component').then(
            (m) => m.AuthorBookDetailComponent
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./tickets/author-tickets/author-tickets.component').then(
            (m) => m.AuthorTicketsComponent
          ),
      },
      {
        path: 'tickets/new',
        loadComponent: () =>
          import('./create-ticket/create-ticket.component').then(
            (m) => m.CreateTicketComponent
          ),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./tickets/author-ticket-detail/author-ticket-detail.component').then(
            (m) => m.AuthorTicketDetailComponent
          ),
      },
    ],
  },
];
