import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WordCountControllerService, ChapterWordCountAudit } from '../../../services/word-count-controller.service';
import { EditorService } from '../services/editor';
import { AppNotificationsService } from '../../../core/app.notifications';

@Component({
  selector: 'app-strict-word-count-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header with Status Badge -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <mat-icon class="!text-lg">pin</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-100 font-serif">کۆنتڕۆڵکەری توندی ژمارەی وشەکان (Strict Word-Count Controller)</h4>
            <p class="text-[10px] text-slate-400">ژماردنی یەکگرتووی دەقی کوردی/عەرەبی بە جیاکردنەوەی پێڕست و ناونیشانەکان</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <span [class]="'px-3 py-1 rounded-full text-[10.5px] font-bold font-serif border ' +
            (audit().isCompliant ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40')">
            {{ audit().statusLabel }}
          </span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
          <span class="text-[10px] text-slate-400 block font-serif">🎯 ئامانجی تێز</span>
          <span class="text-sm font-bold font-mono text-indigo-400">{{ audit().targetWords }}</span>
          <span class="text-[9px] text-slate-500 block">وشەی فەرمی</span>
        </div>

        <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
          <span class="text-[10px] text-slate-400 block font-serif">✍️ وشەی نووسراو</span>
          <span class="text-sm font-bold font-mono text-emerald-400">{{ audit().currentWords }}</span>
          <span class="text-[9px] text-slate-500 block">دەقی سەرەکی</span>
        </div>

        <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
          <span class="text-[10px] text-slate-400 block font-serif">⏳ ماوە بۆ ئامانج</span>
          <span [class]="'text-sm font-bold font-mono ' + (audit().remainingWords > 0 ? 'text-amber-400' : 'text-purple-400')">
            {{ audit().remainingWords > 0 ? audit().remainingWords : '+' + Math.abs(audit().remainingWords) }}
          </span>
          <span class="text-[9px] text-slate-500 block">{{ audit().remainingWords > 0 ? 'وشە ماوە' : 'وشەی زیادە' }}</span>
        </div>

        <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
          <span class="text-[10px] text-slate-400 block font-serif">📊 ڕێژەی تەواوبوون</span>
          <span class="text-sm font-bold font-mono text-slate-200">{{ audit().percentage }}٪</span>
          <span class="text-[9px] text-slate-500 block">لە سەدا</span>
        </div>
      </div>

      <!-- Target Settings & Options Panel -->
      <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <label class="text-[11px] font-bold text-slate-300 font-serif">
            دەستنیشانکردنی ئامانجی سەرجەم تێز:
          </label>
          <div class="flex items-center gap-1.5">
            @for (preset of [5000, 10000, 15000, 20000, 30000]; track preset) {
              <button
                type="button"
                (click)="onSetTarget(preset)"
                [class]="audit().targetWords === preset ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer">
                {{ preset }}
              </button>
            }
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="number"
            [ngModel]="audit().targetWords"
            (ngModelChange)="onSetTarget($event)"
            step="500"
            min="1000"
            class="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono text-center"
          />
          <span class="text-xs text-slate-400 font-serif">وشە بۆ هەموو تێزەکە</span>

          <!-- Counting Toggles -->
          <div class="mr-auto flex items-center gap-3 text-[10.5px] font-serif text-slate-300">
            <label class="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                [ngModel]="controller.excludeBibliography()"
                (ngModelChange)="controller.excludeBibliography.set($event)"
                class="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>جیاکردنەوەی سەرچاوەکان</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                [ngModel]="controller.excludeTitles()"
                (ngModelChange)="controller.excludeTitles.set($event)"
                class="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>جیاکردنەوەی سەرناو</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Chapter Word Audits List -->
      <div class="space-y-2">
        <h5 class="text-[11px] font-bold text-slate-300 font-serif flex items-center gap-1">
          <mat-icon class="!text-sm text-indigo-400">table_rows</mat-icon>
          ئامانج و ژمارەی وشەکانی بەشەکان:
        </h5>

        <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
          @for (ch of audit().chapterAudits; track ch.chapterId) {
            <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200 font-serif">{{ ch.chapterTitle }}</span>
                <span [class]="'px-2 py-0.5 rounded text-[10px] font-mono border ' + ch.badgeClass">
                  {{ ch.currentWords }} / {{ ch.targetWords }} وشە ({{ ch.percentage }}٪)
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  [class]="ch.percentage > 105 ? 'bg-purple-500' : ch.percentage >= 95 ? 'bg-emerald-500' : 'bg-amber-500'"
                  [style.width.%]="Math.min(100, ch.percentage)"
                  class="h-full transition-all duration-300">
                </div>
              </div>

              <!-- Chapter Controls -->
              <div class="flex items-center justify-between text-[10.5px] pt-1">
                <div class="flex items-center gap-1">
                  <span class="text-slate-400">ئامانجی ئەم بەشە:</span>
                  <input
                    type="number"
                    [ngModel]="ch.targetWords"
                    (ngModelChange)="onSetSectionTarget(ch.chapterId, $event)"
                    step="200"
                    min="100"
                    class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-center text-slate-200"
                  />
                  <span class="text-slate-500">وشە</span>
                </div>

                <button
                  type="button"
                  (click)="onAdjustExact(ch.chapterId)"
                  [disabled]="isAdjusting() === ch.chapterId"
                  class="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                  <mat-icon class="!text-xs !w-3 !h-3">auto_fix_high</mat-icon>
                  <span>{{ isAdjusting() === ch.chapterId ? 'خەریکی ڕێکخستنە...' : 'چەسپاندنی تەواوی وشەکان' }}</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Action status message -->
      @if (progressMessage()) {
        <div class="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
          <mat-icon class="!text-sm animate-spin">refresh</mat-icon>
          <span>{{ progressMessage() }}</span>
        </div>
      }
    </div>
  `
})
export class StrictWordCountWidgetComponent {
  public controller = inject(WordCountControllerService);
  private toastService = inject(AppNotificationsService);

  readonly Math = Math;
  readonly audit = this.controller.manuscriptAudit;

  isAdjusting = signal<number | null>(null);
  progressMessage = signal<string | null>(null);

  onSetTarget(val: any): void {
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      this.controller.setManuscriptTarget(num);
    }
  }

  onSetSectionTarget(chapterId: number, val: any): void {
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      this.controller.setSectionTarget(chapterId, num);
    }
  }

  async onAdjustExact(chapterId: number): Promise<void> {
    this.isAdjusting.set(chapterId);
    this.progressMessage.set('دەستپێکردنی ڕێکخستنی ژمارەی وشەکان...');

    try {
      const res = await this.controller.adjustChapterToExactWordCount(chapterId, msg => {
        this.progressMessage.set(msg);
      });
      if (res.success) {
        this.toastService.showSuccess('تەواو کرا', res.message);
      } else {
        this.toastService.showWarning('تەواو نەکرا', res.message);
      }
    } catch (err: any) {
      this.toastService.showError('هەڵە لە ڕێکخستندا', err?.message || 'پەیوەندی سەرکەوتوو نەبوو.');
    } finally {
      this.isAdjusting.set(null);
      this.progressMessage.set(null);
    }
  }
}
