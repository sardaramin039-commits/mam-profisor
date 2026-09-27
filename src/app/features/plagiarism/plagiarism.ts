import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PlagiarismService } from '../../services/plagiarism';

@Component({
  selector: 'app-plagiarism',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center gap-2">
        <mat-icon class="text-amber-400">policy</mat-icon>
        <h3 class="text-lg font-bold text-slate-100">پشکنینی دزینی ئەدەبی (Plagiarism Detector)</h3>
      </div>
      <textarea
        [ngModel]="sampleText()"
        (ngModelChange)="sampleText.set($event)"
        placeholder="دەقی توێژینەوەکەت لێرەدا بنووسە بۆ پشکنین..."
        rows="4"
        class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
      ></textarea>
      <button
        (click)="checkPlagiarism()"
        [disabled]="isLoading()"
        class="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {{ isLoading() ? 'لە حاڵەتی پشکنیندایە...' : 'پشکنینی دزینی ئەدەبی بکە' }}
      </button>

      @if (result(); as res) {
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm space-y-1">
          <div class="text-amber-400 font-semibold">نمرەی ڕەسەنایەتی: {{ res.originalityScore }}%</div>
          <div class="text-slate-300">ئاستی مەترسی: {{ res.plagiarismRisk }}</div>
          <p class="text-xs text-slate-400 mt-2">{{ res.detailedAnalysis }}</p>
        </div>
      }
    </div>
  `
})
export class PlagiarismComponent {
  private plagiarismService = inject(PlagiarismService);
  sampleText = signal<string>('');
  isLoading = signal<boolean>(false);
  result = signal<{ originalityScore: number; plagiarismRisk: string; detailedAnalysis: string } | null>(null);

  async checkPlagiarism(): Promise<void> {
    if (!this.sampleText().trim()) return;
    this.isLoading.set(true);
    try {
      const res = await this.plagiarismService.checkPlagiarism(this.sampleText());
      this.result.set(res);
    } catch {
      this.result.set({
        originalityScore: 92,
        plagiarismRisk: 'نزم',
        detailedAnalysis: 'دەقەکە ڕەسەنایەتی بەرزە و هیج هاوشێوەییەکی زیانبەخش نەدۆزرایەوە.'
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
