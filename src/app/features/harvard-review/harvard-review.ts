import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReviewsService } from '../../services/reviews';

@Component({
  selector: 'app-harvard-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center gap-2">
        <mat-icon class="text-rose-400">school</mat-icon>
        <h3 class="text-lg font-bold text-slate-100">هەڵسەنگاندنی هارفەرد (Harvard Review)</h3>
      </div>
      <input
        type="text"
        [ngModel]="title()"
        (ngModelChange)="title.set($event)"
        placeholder="ناونیشانی توێژینەوە..."
        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
      />
      <button
        (click)="startReview()"
        [disabled]="isLoading()"
        class="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {{ isLoading() ? 'لە شیکاریی دایە...' : 'دەستپێکردنی هەڵسەنگاندن' }}
      </button>

      @if (review(); as r) {
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-sm">
          <div class="text-rose-400 font-bold">نمرەی هەڵسەنگاندن: {{ r.score }}/100</div>
          <p class="text-slate-300 text-xs">{{ r.critique }}</p>
        </div>
      }
      @if (reviewError(); as error) {
        <div class="p-3 bg-rose-950/30 rounded-lg border border-rose-800 text-rose-200 text-xs font-serif">
          نمرەی ساختە پیشان نادرێت؛ {{ error }}
        </div>
      }
    </div>
  `
})
export class HarvardReviewComponent {
  private reviews = inject(ReviewsService);
  title = signal<string>('');
  isLoading = signal<boolean>(false);
  review = signal<{ score: number; critique: string } | null>(null);
  reviewError = signal<string | null>(null);

  async startReview(): Promise<void> {
    if (!this.title().trim()) return;
    this.isLoading.set(true);
    this.reviewError.set(null);
    this.review.set(null);
    try {
      const res = await this.reviews.runHarvardReview(this.title(), 'ناوەڕۆکی توێژینەوە', 'زانستە گشتییەکان');
      this.review.set(res);
    } catch (error) {
      this.review.set(null);
      this.reviewError.set(error instanceof Error ? error.message : 'نەتوانرا هەڵسەنگاندن لە سێرڤەر وەربگیرێت.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
