import { inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export class JwtInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Don't add auth token to login/register/public endpoints
    const publicPaths = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/health'];
    const isPublic = publicPaths.some(path => request.url.includes(path));

    if (!isPublic) {
      const token = localStorage.getItem('bookleaf-auth');
      if (token) {
        const parsed = JSON.parse(token);
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${parsed.token}`
          }
        });
      }
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Handle token expiration/ invalid - logout user
        if (err.status === 401) {
          this.auth.logout();
          // Could navigate to login, but interceptor shouldn't navigate
          return throwError(() => err);
        }
        return throwError(() => err);
      })
    );
  }
}