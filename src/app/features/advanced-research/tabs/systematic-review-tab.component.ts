import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ChecklistStatus,
  PrismaFlowCounts,
  PrismaPreflightResult,
  PRISMA_2020_ITEMS,
  SystematicReviewService
} from '../../../services/systematic-review.service';
import { TabContextBridgeService } from '../services/tab-context-bridge.service';

@Component({
  selector: 'app-systematic-review-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './systematic-review-tab.component.html'
})
export class SystematicReviewTabComponent {
  readonly service = new SystematicReviewService();
  readonly contextBridge = inject(TabContextBridgeService);
  readonly items = PRISMA_2020_ITEMS;
  readonly statuses = signal<Record<number, ChecklistStatus>>({});
  readonly result = signal<PrismaPreflightResult | null>(null);

  identified: number | null = null;
  duplicatesRemoved: number | null = null;
  screened: number | null = null;
  excludedAfterScreening: number | null = null;
  fullTextAssessed: number | null = null;
  excludedAfterFullText: number | null = null;
  included: number | null = null;

  status(id: number): ChecklistStatus {
    return this.statuses()[id] || 'missing';
  }

  setStatus(id: number, value: ChecklistStatus): void {
    this.statuses.update(current => ({ ...current, [id]: value }));
    this.result.set(null);
  }

  audit(): void {
    const flow: PrismaFlowCounts = {
      identified: this.identified,
      duplicatesRemoved: this.duplicatesRemoved,
      screened: this.screened,
      excludedAfterScreening: this.excludedAfterScreening,
      fullTextAssessed: this.fullTextAssessed,
      excludedAfterFullText: this.excludedAfterFullText,
      included: this.included
    };
    this.result.set(this.service.assess(this.statuses(), flow));
  }

  reset(): void {
    this.statuses.set({});
    this.result.set(null);
    this.identified = null;
    this.duplicatesRemoved = null;
    this.screened = null;
    this.excludedAfterScreening = null;
    this.fullTextAssessed = null;
    this.excludedAfterFullText = null;
    this.included = null;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  insertPrismaIntoManuscript(): void {
    const r = this.result();
    if (!r) return;
    const report = `### ئەنجامی پشکنینی PRISMA 2020 بۆ ڕەوتی لێکۆڵینەوەی سیستماتیک:\n` +
      `- تێکڕای تەواوبوون: %${r.completionPercent}\n` +
      `- بڕگەکانی تەواوکراو: ${r.completedItems} لە ${this.items.length}\n` +
      `- ژمارەی سەرچاوەی دۆزراوە: ${this.identified ?? 'دەستنیشاننەکراو'}\n` +
      `- ژمارەی هەڵبژێردراوی کۆتایی بۆ تێز: ${this.included ?? 'دەستنیشاننەکراو'}\n` +
      `- دۆخی گشتی: ${r.readyForReporting ? 'ئامادەیە بۆ ڕاپۆرتکردنی زانستی بەپێی PRISMA' : 'پێویستی بە پێداچوونەوەیە'}`;
    this.contextBridge.insertIntoManuscript(report);
  }

  savePrismaAsCorpusCard(): void {
    const r = this.result();
    if (!r) return;
    const report = `پشکنینی PRISMA 2020: تەواوبوون %${r.completionPercent}، بڕگەی تەواو ${r.completedItems}، سەرچاوەی لەخۆگیراو ${this.included ?? 0}.`;
    this.contextBridge.saveAsCorpusCard('پشکنینی سیستماتیکی PRISMA 2020', report);
  }
}
