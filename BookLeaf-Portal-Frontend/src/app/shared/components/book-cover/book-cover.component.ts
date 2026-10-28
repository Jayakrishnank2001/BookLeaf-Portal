import { Component, Input } from '@angular/core';
import { hashString } from '../../../core/utils/hash';

// Brand-coloured gradient pairs. The pair is picked from the title, so a book always
// gets the same cover without any image storage.
const PALETTES: [string, string][] = [
  ['#ea492e', '#c43620'],
  ['#0d4f3d', '#4b916d'],
  ['#0d487f', '#4a7a8a'],
  ['#c0571f', '#c98a1a'],
  ['#4b3a6b', '#8a5a9c'],
];

@Component({
  selector: 'app-book-cover',
  standalone: true,
  host: { style: 'display: block; width: 100%;' },
  template: `
    <div class="cover" [style.background]="gradient()" [style.aspect-ratio]="ratio">
      <span class="brand">BookLeaf</span>
      <span class="title">{{ title }}</span>
    </div>
  `,
  styles: [`
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
      border-radius: 10px;
      color: #fff;
      overflow: hidden;
    }
    .brand { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.8; }
    .title {
      font-family: var(--font-serif);
      font-size: 1.05rem;
      font-weight: 600;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    }
  `],
})
export class BookCoverComponent {
  @Input({ required: true }) title = '';
  /** CSS aspect-ratio; the dashboard/grid use landscape, the detail page uses portrait. */
  @Input() ratio = '16 / 10';

  gradient(): string {
    const [from, to] = PALETTES[hashString(this.title) % PALETTES.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }
}
