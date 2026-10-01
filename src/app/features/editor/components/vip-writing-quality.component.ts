import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  VipAcademicLevel,
  VipDiscipline,
  VipWritingQualityResult,
  VipWritingQualityService
} from './vip-writing-quality.service';

@Component({
  selector: 'app-vip-writing-quality',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vip-writing-quality.component.html'
})
export class VipWritingQualityComponent {
  private service = inject(VipWritingQualityService);

  chapterText = input<string>('');
  academicLevel = input<VipAcademicLevel>('bachelor');
  discipline = input<VipDiscipline>('humanities');

  result = signal<VipWritingQualityResult | null>(null);
  analyzing = signal(false);

  levelLabel = computed(() => this.service.getPolicy(this.academicLevel()).label);

  dimensionScore(key: string): number | null {
    return this.result()?.dimensions.find(d => d.key === key)?.score ?? null;
  }

  analyze(): void {
    this.analyzing.set(true);
    try {
      this.result.set(this.service.analyze(this.chapterText(), this.academicLevel(), this.discipline()));
    } finally {
      this.analyzing.set(false);
    }
  }
}
