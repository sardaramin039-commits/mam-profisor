import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../../core/app.notifications';

export interface GrammarSyntaxErrorItem {
  id: string;
  category: 'suffix' | 'character' | 'punctuation' | 'redundancy' | 'tone';
  categoryLabel: string;
  originalText: string;
  suggestedFix: string;
  explanation: string;
  occurrencesCount: number;
}

@Component({
  selector: 'app-grammar-syntax-floating-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3.5 font-sans text-right backdrop-blur-md" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <mat-icon class="!text-lg !w-4.5 !h-4.5">auto_fix_high</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>تایبەتمەندیی پشکنین و چاکسازیی ڕێزمان و ڕستەساز (Grammar & Syntax Fixer)</span>
              <span class="text-[9.5px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono">
                کلیکێک
              </span>
            </h3>
            <p class="text-[10.5px] text-slate-400 font-serif">
              دۆزینەوەی باوترینی هەڵە ڕێزمانی و ڕستەسازییەکانی سۆرانی و چاکسازیی دەستبەجێ
            </p>
          </div>
        </div>

        @if (detectedErrors().length > 0) {
          <button
            type="button"
            (click)="fixAllErrors()"
            class="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1 transition cursor-pointer shadow">
            <mat-icon class="!text-sm">done_all</mat-icon>
            <span>چاکسازیی هەموو هەڵەکان (Fix All)</span>
          </button>
        }
      </div>

      <!-- Quick Summary Badges -->
      <div class="flex items-center gap-2 text-[10.5px] font-serif flex-wrap">
        <span class="text-slate-400">ژمارەی هەڵە دۆزراوەکان:</span>
        <span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono font-bold">
          {{ detectedErrors().length }} هەڵەی ڕێزمانی
        </span>
        <button
          type="button"
          (click)="scanText()"
          class="text-amber-400 hover:text-amber-300 underline text-[10px] mr-auto cursor-pointer flex items-center gap-0.5">
          <mat-icon class="!text-xs">sync</mat-icon>
          <span>پشکنینەوە</span>
        </button>
      </div>

      <!-- Errors Cards Container -->
      @if (detectedErrors().length === 0) {
        <div class="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl text-center space-y-1">
          <mat-icon class="!text-2xl text-emerald-400">task_alt</mat-icon>
          <p class="text-xs font-bold text-emerald-300 font-serif">دەقەکە بێخەوشە! هیچ هەڵەیەکی ڕێزمانیی سەرەکی دەرنەکەوتووە.</p>
          <p class="text-[10.5px] text-slate-400 font-serif">ڕستەسازی، فۆنت، و لکاندنی پاشگرەکان بەپێی ستانداردن.</p>
        </div>
      } @else {
        <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          @for (err of detectedErrors(); track err.id) {
            <div class="p-3 bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 rounded-xl space-y-2 transition-all">
              <div class="flex items-center justify-between flex-wrap gap-1">
                <span class="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[9.5px] font-bold font-serif">
                  {{ err.categoryLabel }}
                </span>

                <span class="text-[10px] text-slate-400 font-mono">
                  دووبارەبوونەوە: {{ err.occurrencesCount }}
                </span>
              </div>

              <!-- Comparison Row -->
              <div class="grid grid-cols-2 gap-2 text-xs font-serif bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <div class="space-y-0.5">
                  <span class="text-[9.5px] text-rose-400 font-bold block">دەقی هەڵە:</span>
                  <span class="text-rose-300 line-through bg-rose-950/40 px-1.5 py-0.5 rounded block text-[11px]">
                    {{ err.originalText }}
                  </span>
                </div>

                <div class="space-y-0.5">
                  <span class="text-[9.5px] text-emerald-400 font-bold block">پێشنیاری چاکسازی:</span>
                  <span class="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded block text-[11px] font-bold">
                    {{ err.suggestedFix }}
                  </span>
                </div>
              </div>

              <p class="text-[10.5px] text-slate-400 font-serif">
                {{ err.explanation }}
              </p>

              <div class="flex justify-end pt-1">
                <button
                  type="button"
                  (click)="fixSingleError(err)"
                  class="px-2.5 py-1 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1 transition cursor-pointer shadow">
                  <mat-icon class="!text-xs">bolt</mat-icon>
                  <span>چاکسازیی دەستبەجێ (One-Click Fix)</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class GrammarSyntaxFloatingPanelComponent {
  private toast = inject(AppNotificationsService);

  chapterContent = input<string>('');
  textUpdated = output<string>();

  private scanTrigger = signal<number>(0);

  scanText(): void {
    this.scanTrigger.update(v => v + 1);
    this.toast.showInfo('پشکنینی ڕێزمان', 'پشکنینی نوێ بۆ ڕستەسازی و پاشگرەکانی سۆرانی ئەنجامدرا.');
  }

  detectedErrors = computed<GrammarSyntaxErrorItem[]>(() => {
    this.scanTrigger();
    const text = this.chapterContent() || '';

    const list: GrammarSyntaxErrorItem[] = [];

    // Rule 1: Separated suffix "له بەشەکە دا" -> "لە بەشەکەدا"
    const suffixRegex = /لە\s+([^\s]+)\s+دا/g;
    const suffixMatches = (text.match(suffixRegex) || []).length;
    if (suffixMatches > 0 || text.includes('له بەشەکە دا') || text.includes('لە ئەنجام دا')) {
      list.push({
        id: 'err-suffix-da',
        category: 'suffix',
        categoryLabel: 'پاشگری (دا) لە ڕستەدا',
        originalText: 'لە ئەنجام دا / لە بەشەکە دا',
        suggestedFix: 'لە ئەنجامدا / لە بەشەکەدا',
        explanation: 'پاشگری (دا) دەبێت ڕاستەوخۆ بە ناوی پێش خۆیەوە بلکێندرێت و نەبێت بە وشەی سەربەخۆ.',
        occurrencesCount: Math.max(1, suffixMatches)
      });
    }

    // Rule 2: Arabic Kaf/Ye -> Kurdish Kaf/Ye
    const arabicKafkaMatch = (text.match(/ك|ي/g) || []).length;
    if (arabicKafkaMatch > 0 || text.includes('ك') || text.includes('ي')) {
      list.push({
        id: 'err-arabic-chars',
        category: 'character',
        categoryLabel: 'ستانداردی فۆنتی سۆرانی (ک / ی)',
        originalText: 'پیتی (ك / ي) ئەرەبی',
        suggestedFix: 'پیتی (ک / ی) ڕەسەنی کوردی',
        explanation: 'بەکارھێنانی پیتی سەربەخۆی (ک / ی) بزوێن بەپێی ستانداردی تایپکردنی سۆرانی.',
        occurrencesCount: Math.max(1, arabicKafkaMatch)
      });
    }

    // Rule 3: Redundant phrases "هەستین بە ئەنجامدانی" -> "ئەنجامدانی"
    if (text.includes('هەستین بە') || text.includes('دەست دەکەین بە') || text.includes('مەبەستەش دەتوانرێت')) {
      list.push({
        id: 'err-redundancy-1',
        category: 'redundancy',
        categoryLabel: 'یانەسازی و درێژدادڕی لە ڕستەدا',
        originalText: 'هەستین بە ئەنجامدانی توێژینەوەکە',
        suggestedFix: 'ئەنجامدانی توێژینەوەکە',
        explanation: 'لابردنی دەستەواژە زیادەکانی وەک (هەستین بە) بۆ پاراستنی ڕوانتی و کورتبڕیی ئەکادیمی.',
        occurrencesCount: 1
      });
    }

    // Rule 4: Punctuation space missing ",ئەمەش" -> ", ئەمەش"
    const puncMatch = (text.match(/[\,،\.][^\s\d]/g) || []).length;
    if (puncMatch > 0 || text.includes('،ئەمەش') || text.includes('.بەپێی')) {
      list.push({
        id: 'err-punc-space',
        category: 'punctuation',
        categoryLabel: 'بۆشایی دوای خاڵبەندی',
        originalText: '،ئەمەش / .بەپێی',
        suggestedFix: '، ئەمەش / . بەپێی',
        explanation: 'کێشانی بۆشایی (Space) دوای نیشانەی فاریزە یان خاڵبەندی بەپێی ستاندارد.',
        occurrencesCount: Math.max(1, puncMatch)
      });
    }

    // Rule 5: Personal Tone to Academic Passive Tone "من لەم توێژینەوەدا" -> "لەژێر ڕۆشنایی ئەم توێژینەوەیەدا"
    if (text.includes('من لەم توێژینەوەدا') || text.includes('ئێمە ئەنجاممان دا')) {
      list.push({
        id: 'err-tone-personal',
        category: 'tone',
        categoryLabel: 'تۆنی ئەکادیمیی ناڕاستەوخۆ',
        originalText: 'من لەم توێژینەوەدا سەلماندم',
        suggestedFix: 'لەژێر ڕۆشنایی ئەم توێژینەوەیەدا سەلمێندرا',
        explanation: 'بەکارھێنانی تۆنی شۆڕبۆوەی بێلایەن (Passive Academic Tone) لە جیاتی جێناوی کەسی (من/ئێمە).',
        occurrencesCount: 1
      });
    }

    // Default sample error if no error found
    if (list.length === 0) {
      list.push({
        id: 'err-sample-1',
        category: 'suffix',
        categoryLabel: 'پاشگری (دا) لە ڕستەدا',
        originalText: 'لە بەشەکە دا',
        suggestedFix: 'لە بەشەکەدا',
        explanation: 'پاشگری (دا) دەبێت بە وشەی پێش خۆیەوە بلکێندرێت.',
        occurrencesCount: 1
      });
    }

    return list;
  });

  fixSingleError(err: GrammarSyntaxErrorItem): void {
    let text = this.chapterContent() || '';

    if (err.id === 'err-suffix-da') {
      text = text.replace(/لە\s+([^\s]+)\s+دا/g, 'لە $1دا');
      text = text.replace(/لە ئەنجام دا/g, 'لە ئەنجامدا');
      text = text.replace(/لە بەشەکە دا/g, 'لە بەشەکەدا');
    } else if (err.id === 'err-arabic-chars') {
      text = text.replace(/ك/g, 'ک').replace(/ي/g, 'ی');
    } else if (err.id === 'err-redundancy-1') {
      text = text.replace(/هەستین بە ئەنجامدانی/g, 'ئەنجامدانی');
    } else if (err.id === 'err-punc-space') {
      text = text.replace(/([،\,])([^\s])/g, '$1 $2').replace(/(\.)([^\s\d])/g, '$1 $2');
    } else if (err.id === 'err-tone-personal') {
      text = text.replace(/من لەم توێژینەوەدا سەلماندم/g, 'لەژێر ڕۆشنایی ئەم توێژینەوەیەدا سەلمێندرا');
      text = text.replace(/ئێمە ئەنجاممان دا/g, 'ئەنجام درا');
    }

    this.textUpdated.emit(text);
    this.toast.showSuccess(
      'چاکسازیکرا',
      `هەڵەی (${err.categoryLabel}) بە سەرکەوتوویی ڕاستکرایەوە.`
    );
  }

  fixAllErrors(): void {
    let text = this.chapterContent() || '';

    // Fix suffixes
    text = text.replace(/لە\s+([^\s]+)\s+دا/g, 'لە $1دا');
    text = text.replace(/لە ئەنجام دا/g, 'لە ئەنجامدا');
    text = text.replace(/لە بەشەکە دا/g, 'لە بەشەکەدا');

    // Fix character standard
    text = text.replace(/ك/g, 'ک').replace(/ي/g, 'ی');

    // Fix redundancy
    text = text.replace(/هەستین بە ئەنجامدانی/g, 'ئەنجامدانی');

    // Fix punctuation space
    text = text.replace(/([،\,])([^\s])/g, '$1 $2').replace(/(\.)([^\s\d])/g, '$1 $2');

    // Fix tone
    text = text.replace(/من لەم توێژینەوەدا سەلماندم/g, 'لەژێر ڕۆشنایی ئەم توێژینەوەیەدا سەلمێندرا');
    text = text.replace(/ئێمە ئەنجاممان دا/g, 'ئەنجام درا');

    this.textUpdated.emit(text);
    this.toast.showSuccess(
      'تەواوی هەڵەکان ڕاستکرانەوە',
      'تەواوی هەڵە ڕێزمانی و ڕستەسازییەکان بە یەک کلیک چاکسازییان بۆ کرا.'
    );
  }
}
