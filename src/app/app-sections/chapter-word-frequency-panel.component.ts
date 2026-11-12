import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { calculateKurdishWordFrequency, WordFrequencyResult } from '../helpers/kurdish-academic-text-analysis';

@Component({
  selector: 'app-chapter-word-frequency-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let freq = frequencyResult();
    <div class="mt-1.5 p-3.5 bg-stone-900 text-stone-100 border border-amber-500/40 rounded-xl space-y-3 shadow-lg font-serif text-xs">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <mat-icon class="!text-sm !w-4 !h-4">insights</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
              شیکاریی فرێکوێنسیی وشەکان و هەمەچەشنیی فەرهەنگی
              <span class="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-amber-300 border border-stone-700">Top 10 Words</span>
            </h4>
            <p class="text-[10px] text-stone-400 font-serif">
              ڕێگری لە دووبارەبوونەوەی وشەکان و پاراستنی دەوڵەمەندیی زاراوەسازیی ئەکادیمی
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Stop Words Filter Toggle -->
          <button type="button" 
                  (click)="toggleFilter.emit()" 
                  class="px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer"
                  [class]="excludeStopWords() ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-stone-800 text-stone-300 border-stone-700'">
            {{ excludeStopWords() ? '✓ دەرکردنی ئامرازە ڕێزمانییەکان (لە، بە، بۆ...)' : 'سەرجەم وشەکان' }}
          </button>

          <button type="button" (click)="close.emit()" class="text-stone-400 hover:text-white p-0.5 cursor-pointer" title="داخستن">
            <mat-icon class="!text-sm">close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Diversity Metrics Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
        <div class="p-2 bg-stone-950/70 rounded-lg border border-stone-800">
          <span class="text-stone-400 text-[9px] block">کۆی وشە پشکنراوەکان:</span>
          <span class="font-mono font-bold text-white text-xs">{{ freq.totalWords }}</span>
        </div>
        <div class="p-2 bg-stone-950/70 rounded-lg border border-stone-800">
          <span class="text-stone-400 text-[9px] block">وشە بێهاوتاکان (Unique):</span>
          <span class="font-mono font-bold text-amber-300 text-xs">{{ freq.uniqueWords }}</span>
        </div>
        <div class="p-2 bg-stone-950/70 rounded-lg border border-stone-800">
          <span class="text-stone-400 text-[9px] block">ڕێژەی هەمەچەشنی (TTR):</span>
          <span class="font-mono font-bold text-emerald-400 text-xs">{{ freq.diversityRatio }}٪</span>
        </div>
        <div class="p-2 bg-stone-950/70 rounded-lg border border-stone-800">
          <span class="text-stone-400 text-[9px] block">هەڵسەنگاندنی فەرهەنگ:</span>
          <span class="font-bold text-[10px] text-amber-200">{{ freq.diversityLabel }}</span>
        </div>
      </div>

      <!-- Top 10 Words Table / Chips -->
      @if (freq.topWords.length > 0) {
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
          @for (item of freq.topWords; track item.word; let idx = $index) {
            <div class="flex items-center justify-between p-2 rounded-lg border text-[11px] transition"
                 [class]="item.isOverused ? 'bg-rose-950/40 border-rose-700/80 text-rose-200' : 'bg-stone-950/60 border-stone-800 text-stone-200'">
              <div class="flex items-center gap-1.5 truncate">
                <span class="font-mono text-[9px] text-stone-500 w-3.5">{{ idx + 1 }}.</span>
                <span class="font-bold font-serif truncate" [title]="item.word">{{ item.word }}</span>
              </div>
              <div class="flex items-center gap-1 text-[10px] font-mono shrink-0">
                <span class="font-bold">{{ item.count }} جار</span>
                <span class="text-stone-500 text-[9px]">({{ item.percentage }}٪)</span>
                @if (item.isOverused) {
                  <span title="ئەم وشەیە زۆر دووبارەبووەتەوە؛ پێشنیار دەکرێت هاوواتا بەکاربهێنیت" class="text-rose-400 font-bold">⚠️</span>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="text-stone-500 text-center py-2 text-[11px]">هیچ وشەیەک بۆ شیکاری بەردەست نییە؛ تکایە دەق لە سەرنووسەردا بنووسە.</p>
      }
    </div>
  `
})
export class ChapterWordFrequencyPanelComponent {
  content = input<string>('');
  excludeStopWords = input<boolean>(true);
  toggleFilter = output<void>();
  close = output<void>();

  frequencyResult = computed<WordFrequencyResult>(() => {
    return calculateKurdishWordFrequency(this.content() || '', this.excludeStopWords(), 10);
  });
}
