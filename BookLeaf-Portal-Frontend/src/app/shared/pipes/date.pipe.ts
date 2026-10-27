import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'blDate', standalone: true })
export class DatePipe implements PipeTransform {
  transform(value: string | null | undefined, style: 'date' | 'datetime' | 'short' = 'date'): string {
    if (!value) return '\u2014';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '\u2014';
    if (style === 'date') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (style === 'short') return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
