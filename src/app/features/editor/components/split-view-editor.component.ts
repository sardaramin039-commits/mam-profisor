import { Component, ChangeDetectionStrategy, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SoraniSpellingCorrector, SoraniCorrectionResult } from '../../../helpers/sorani-spelling';

@Component({
  selector: 'app-split-view-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white border border-stone-250 rounded-2xl p-5 shadow-lg space-y-4 font-sans text-right" dir="rtl">
      
      <!-- Top Header Row -->
      <div class="flex items-center justify-between border-b border-stone-150 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">auto_fix_high</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
              سەرنووسەری بەراوردی دوولایەنە (Side-by-Side Sorani Orthography Split View)
              <span class="text-[9.5px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                ستانداردی ئەکادیمیای کوردی
              </span>
            </h3>
            <p class="text-[10.5px] text-stone-500 font-serif">
              پیشاندانی دەقی سەرەتایی لە لای ڕاست و دەقی ڕتوشکراوی ڕێنوسی سۆرانیی پێوانەیی لە لای چپ
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Toggle View Mode -->
          <div class="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-250 text-xs">
            <button
              type="button"
              (click)="isSplitView.set(true)"
              [class]="'px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ' + 
                (isSplitView() ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800')">
              <mat-icon class="!text-xs">view_column</mat-icon>
              <span>Split View (دوولایەنە)</span>
            </button>
            <button
              type="button"
              (click)="isSplitView.set(false)"
              [class]="'px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ' + 
                (!isSplitView() ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800')">
              <mat-icon class="!text-xs">view_stream</mat-icon>
              <span>Single View (تەنها سەرنووسەر)</span>
            </button>
          </div>

          <button
            type="button"
            (click)="applyCorrections.emit(correction().correctedText)"
            class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md">
            <mat-icon class="!text-sm">done_all</mat-icon>
            <span>جێگیرکردنی تەواوی چاکسازییەکان لە بەشەکەدا</span>
          </button>
        </div>
      </div>

      <!-- Correction Diagnostic Stats Ribbon -->
      @let corr = correction();
      <div class="p-3 bg-stone-900 text-white rounded-xl flex items-center justify-between text-xs flex-wrap gap-2 shadow-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-serif font-bold text-amber-400 flex items-center gap-1">
            <mat-icon class="!text-sm text-amber-400">task_alt</mat-icon>
            شیکاریی چاکسازییە ڕێنووسییەکان:
          </span>
          <span class="bg-white/10 px-2 py-0.5 rounded text-[10.5px] font-mono text-stone-200">
            گۆڕانکاریی تێکرا: <strong class="text-amber-400">{{ corr.changesCount }}</strong> وشە
          </span>
          <span class="bg-white/10 px-2 py-0.5 rounded text-[10.5px] font-serif text-stone-300">
            پیتە عەرەبییەکان: ك➔ک | ي➔ی | ة➔ە | أ➔ئـ
          </span>
          <span class="bg-white/10 px-2 py-0.5 rounded text-[10.5px] font-serif text-stone-300">
            پێشگری کردارەکان: ئەکات➔دەکات
          </span>
        </div>

        <button
          type="button"
          (click)="copyText(corr.correctedText)"
          class="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1">
          <mat-icon class="!text-xs">content_copy</mat-icon>
          <span>{{ copied() ? 'کۆپی کرا!' : 'کۆپیکردنی دەقی چاککراو' }}</span>
        </button>
      </div>

      <!-- Side-by-Side or Single View Editor Area -->
      @if (isSplitView()) {
        <!-- Split View Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Left/Right Pane 1: Original Editable Text -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between p-2 bg-rose-50 border border-rose-200 rounded-t-xl text-rose-900 text-xs font-bold font-serif">
              <span class="flex items-center gap-1">
                <mat-icon class="!text-sm text-rose-600">edit_note</mat-icon>
                دەقی سەرەتایی / ڕەسەنی بەشەکە (Original Text)
              </span>
              <span class="text-[9.5px] font-mono bg-rose-100 px-1.5 py-0.2 rounded text-rose-800">
                {{ chapterContent().length }} پیت
              </span>
            </div>

            <textarea
              [value]="chapterContent()"
              (input)="onOriginalContentChange($any($event.target).value)"
              rows="16"
              class="w-full p-4 text-xs md:text-sm font-serif leading-relaxed text-stone-900 bg-stone-50 border border-stone-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium resize-y select-all"
              placeholder="دەقی بەشەکە لێرەدا دەردەکەوێت..."></textarea>
          </div>

          <!-- Left/Right Pane 2: Sorani Orthography Corrected Output -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-t-xl text-emerald-950 text-xs font-bold font-serif">
              <span class="flex items-center gap-1">
                <mat-icon class="!text-sm text-emerald-600">verified</mat-icon>
                دەقی چاککراوی ڕێنوسی سۆرانی (Orthography Corrected)
              </span>
              <span class="text-[9.5px] font-mono bg-emerald-100 px-1.5 py-0.2 rounded text-emerald-900 font-bold">
                پێوەری ئەکادیمی
              </span>
            </div>

            <div class="w-full p-4 text-xs md:text-sm font-serif leading-relaxed text-stone-900 bg-emerald-50/20 border border-emerald-200 rounded-b-xl h-[330px] overflow-y-auto whitespace-pre-wrap select-all border-dashed">
              {{ corr.correctedText }}
            </div>
          </div>

        </div>
      } @else {
        <!-- Single View Layout -->
        <div class="space-y-2">
          <div class="flex items-center justify-between p-2 bg-stone-100 border border-stone-250 rounded-t-xl text-stone-900 text-xs font-bold font-serif">
            <span>دەقی سەرنووسەری ئەکادیمی</span>
            <span class="text-[10px] text-stone-500 font-mono">{{ editableText().length }} پیت</span>
          </div>
          <textarea
            [value]="editableText()"
            (input)="onOriginalContentChange($any($event.target).value)"
            rows="18"
            class="w-full p-4 text-xs md:text-sm font-serif leading-relaxed text-stone-900 bg-white border border-stone-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-y select-all"
            placeholder="دەقی بەشەکە لێرەدا دەردەکەوێت..."></textarea>
        </div>
      }

    </div>
  `,
})
export class SplitViewEditorComponent {
  chapterContent = input<string>('');
  
  applyCorrections = output<string>();

  isSplitView = signal<boolean>(true);
  editableText = signal<string>('');
  copied = signal<boolean>(false);

  correction = computed<SoraniCorrectionResult>(() => {
    const raw = this.editableText() || this.chapterContent() || '';
    return SoraniSpellingCorrector.processAndCount(raw);
  });

  constructor() {
    this.editableText.set(this.chapterContent());
  }

  onOriginalContentChange(newVal: string): void {
    this.editableText.set(newVal);
  }

  copyText(txt: string): void {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
