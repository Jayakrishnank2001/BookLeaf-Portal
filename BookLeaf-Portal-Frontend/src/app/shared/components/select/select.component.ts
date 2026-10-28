import { Component, Input, Output, EventEmitter, signal, ElementRef, inject, HostListener } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
})
export class SelectComponent {
  @Input() value: string | null = null;
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Select';
  @Input() block = false;
  @Input() disabled = false;
  @Input() width: number | null = null;
  @Output() valueChange = new EventEmitter<string | null>();

  open = signal(false);
  private host = inject(ElementRef<HTMLElement>);

  get selected(): boolean {
    return this.options.some((o) => o.value === this.value);
  }
  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label ?? '';
  }

  toggle() {
    if (!this.disabled) this.open.set(!this.open());
  }

  choose(opt: DropdownOption) {
    if (opt.disabled) return;
    this.value = opt.value;
    this.open.set(false);
    this.valueChange.emit(opt.value);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
