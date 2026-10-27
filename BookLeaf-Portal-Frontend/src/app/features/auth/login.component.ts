import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);
  showPass = signal(false);
  formError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  decor = [
    { icon: 'book' as const, color: 'var(--color-primary)', title: 'Track every book', body: 'Production status, royalties, distribution at a glance.' },
    { icon: 'ticket' as const, color: 'var(--color-secondary)', title: 'Talk to the team', body: 'Raise queries and follow every conversation in one thread.' },
    { icon: 'sparkles' as const, color: 'var(--color-accent)', title: 'AI-assisted support', body: 'Smart classification and response drafts for faster replies.' },
  ];

  showErr(field: 'email' | 'password'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  errMsg(field: 'email' | 'password'): string {
    const c = this.form.controls[field];
    if (field === 'email') return c.hasError('required') ? 'Email is required.' : 'Enter a valid email address.';
    if (c.hasError('required')) return 'Password is required.';
    return 'Password must be at least 6 characters.';
  }

  submit() {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.notify.success(`Welcome back, ${user.name.split(' ')[0]}.`);
        this.router.navigate([user.role === 'admin' ? '/admin/dashboard' : '/author/dashboard']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.formError.set(err.message);
      },
    });
  }
}
