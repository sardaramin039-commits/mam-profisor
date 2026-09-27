import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-academic-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-serif border transition-all"
          [ngClass]="badgeClass">
      <ng-content></ng-content>
    </span>
  `
})
export class AcademicBadgeComponent {
  @Input() variant: 'crimson' | 'gold' | 'emerald' | 'stone' = 'crimson';

  get badgeClass(): string {
    switch (this.variant) {
      case 'gold':
        return 'bg-[#FBF6EE] text-[#8B6508] border-[#E8D4B0]';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'stone':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'crimson':
      default:
        return 'bg-[#FDF2F4] text-harvard-crimson border-harvard-crimson/20';
    }
  }
}
