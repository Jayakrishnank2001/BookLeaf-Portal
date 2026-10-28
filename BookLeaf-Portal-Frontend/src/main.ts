import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app/app.routes';
import { ToastsComponent } from './app/shared/components/toasts/toasts.component';
import { RouterOutlet } from '@angular/router';
import { JwtInterceptor } from './app/core/services/jwt.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToastsComponent, RouterOutlet],
  template: '<router-outlet /><app-toasts />',
})
export class App{}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
}).catch((err) => console.error(err));
