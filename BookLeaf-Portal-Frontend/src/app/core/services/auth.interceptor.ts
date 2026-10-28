import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

/**
 * Adds "Authorization: Bearer <token>" to calls to OUR API only (never to third-party hosts),
 * and signs the user out when the API says the token is missing, invalid or expired.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isLogin = req.url.endsWith('/auth/login');
  const token = auth.getToken();

  const request =
    isApiCall && !isLogin && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApiCall && !isLogin) {
        auth.logout();
        notify.warning('Your session has expired. Please sign in again.');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
