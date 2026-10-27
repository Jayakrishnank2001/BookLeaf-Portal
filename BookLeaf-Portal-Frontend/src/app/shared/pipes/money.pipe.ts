import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'blMoney', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, prefix = '\u20b9'): string {
    if (value === null || value === undefined) return '\u2014';
    const n = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
    return `${prefix}${n}`;
  }
}
