import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(type: ToastMessage['type'], text: string, timeout = 4200) {
    const id = ++this.counter;
    const toast: ToastMessage = { id, type, text, timeout };
    const list = [...this.toasts(), toast];
    this.toasts.set(list);
    if (timeout) {
      setTimeout(() => this.dismiss(id), timeout);
    }
    return id;
  }

  success(text: string) { return this.show('success', text); }
  error(text: string) { return this.show('error', text, 6000); }
  info(text: string) { return this.show('info', text); }
  warning(text: string) { return this.show('warning', text); }

  dismiss(id: number) {
    this.toasts.set(this.toasts().filter((t) => t.id !== id));
  }
}
