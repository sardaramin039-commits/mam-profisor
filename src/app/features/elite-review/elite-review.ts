import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReviewCriterion, ReviewsService } from '../../services/reviews';

@Component({
  selector: 'app-elite-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 font-sans shadow-xl text-right" dir="rtl" id="elite-assessment-dashboard">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <mat-icon class="text-2xl">workspace_premium</mat-icon>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-bold text-slate-100 font-serif flex items-center gap-2">
              داشبۆردی هەڵسەنگاندنی باڵا بە ستانداردی هارڤارد (Elite Harvard Scorecard)
            </h3>
            <p class="text-xs text-slate-400 font-serif">
              هەڵسەنگاندنی تۆکمەییی زانستی، ڕەسەنایەتی، و گونجاویی میتۆدۆلۆجی بە ٧ پێوەری نێودەوڵەتی
            </p>
          </div>
        </div>

        <span class="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold">
          Veritas Rigor 3.0
        </span>
      </div>

      <!-- Search & Input Box -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2">
          <input
            type="text"
            [ngModel]="title()"
            (ngModelChange)="title.set($event)"
            placeholder="ناونیشانی تێز یان بەشی توێژینەوەکەت بنووسە..."
            class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <button
            type="button"
            (click)="evaluate()"
            [disabled]="isLoading() || !title().trim()"
            class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold px-4 py-2.5 rounded-xl text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            @if (isLoading()) {
              <span class="animate-spin w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full"></span>
              <span>خەریکی شیکاریی نوخبەیە...</span>
            } @else {
              <mat-icon class="!text-lg">fact_check</mat-icon>
              <span>دەستپێکردنی هەڵسەنگاندنی هارڤارد</span>
            }
          </button>
        </div>
      </div>

      @if (reviewError(); as error) {
        <div class="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 text-xs font-serif">
          نمرەی ساختە پیشان نادرێت؛ هەڵەی پەیوەندی/هەڵسەنگاندن: {{ error }}
        </div>
      }

      <!-- Scorecard Viewport -->
      @if (res(); as r) {
        <div class="space-y-4 pt-2 animate-fade-in">
          <!-- Overall Grade Banner -->
          <div class="p-4 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="space-y-1 text-center sm:text-right">
              <span class="text-xs font-bold text-amber-400 font-serif">ئەنجامی گشتیی تۆکمەییی زانستی (Overall Rigor Index):</span>
              <p class="text-xs text-slate-300 font-serif max-w-xl leading-relaxed">{{ r.critique }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div class="text-center px-4 py-2 bg-slate-900 border border-amber-500/40 rounded-xl">
                <span class="text-[10px] text-slate-400 block font-serif">کۆی نمرە</span>
                <span class="text-2xl font-black text-amber-400 font-mono">{{ r.score }}/100</span>
              </div>
              <div class="text-center px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl">
                <span class="text-[10px] text-slate-400 block font-serif">سەرچاوەی نمرە</span>
                <span class="text-xs font-bold text-slate-200 font-serif">هەڵسەنگاندنی سێرڤەر</span>
              </div>
            </div>
          </div>

          <!-- 7 Criteria Scorecard Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (criterion of criteria(); track criterion.id) {
              <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-200 font-serif">{{ criterion.name }}</span>
                  <span class="font-mono text-amber-400 font-bold">{{ criterion.score }}/100</span>
                </div>
                <!-- Progress bar -->
                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [class]="criterion.score >= 85 ? 'bg-emerald-500' : criterion.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'"
                    [style.width.%]="criterion.score"></div>
                </div>
                <p class="text-[10.5px] text-slate-400 font-serif leading-relaxed">
                  {{ criterion.feedback }}
                </p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class EliteReviewComponent {
  private reviews = inject(ReviewsService);
  title = signal<string>('');
  isLoading = signal<boolean>(false);
  res = signal<{ score: number; critique: string } | null>(null);

  readonly criteria = signal<ReviewCriterion[]>([]);
  reviewError = signal<string | null>(null);

  async evaluate(): Promise<void> {
    if (!this.title().trim()) return;
    this.isLoading.set(true);
    this.reviewError.set(null);
    this.criteria.set([]);
    try {
      const data = await this.reviews.runEliteAssessment(this.title(), 'ناوەڕۆکی بابەت', 'ڕشتەی زانستی', 'دکتۆرا');
      this.res.set(data);
      if (Array.isArray(data?.criteria)) this.criteria.set(data.criteria);
    } catch (error) {
      this.res.set(null);
      this.reviewError.set(error instanceof Error ? error.message : 'نەتوانرا هەڵسەنگاندنی ئەکادیمی لە سێرڤەر وەربگیرێت.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
