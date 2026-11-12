import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-academic-rigor-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border p-3.5 space-y-2 font-sans transition-all duration-300" dir="rtl"
         [ngClass]="{
           'bg-rose-950/60 border-rose-600/80 text-rose-100 shadow-lg shadow-rose-950/30 animate-pulse': isDropBelowThreshold(),
           'bg-amber-950/40 border-amber-500/60 text-amber-100': !isDropBelowThreshold() && rigorScore() < 85,
           'bg-emerald-950/30 border-emerald-500/50 text-emerald-100': rigorScore() >= 85
         }">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
               [ngClass]="{
                 'bg-rose-600 text-white animate-bounce': isDropBelowThreshold(),
                 'bg-amber-500 text-slate-950': !isDropBelowThreshold() && rigorScore() < 85,
                 'bg-emerald-500 text-slate-950': rigorScore() >= 85
               }">
            <mat-icon class="!text-base">{{ isDropBelowThreshold() ? 'warning' : 'verified' }}</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold font-serif flex items-center gap-2">
              <span>ئاستی چڕی و ڕەسەنایەتیی ئەکادیمی (Academic Rigor Score):</span>
            </h4>
            <p class="text-[10.5px] opacity-90">شەن و کەوی ڕاستەوخۆی سەرچاوەکان، مێتۆدۆلۆژی و داڕشتنی زانستی</p>
          </div>
        </div>

        <!-- Dynamic Badge Color Badge-BG -->
        <span class="px-3 py-1 rounded-full text-xs font-extrabold font-mono border shadow-sm transition-all"
              [ngClass]="{
                'bg-rose-600 text-white border-rose-400 shadow-rose-500/40 animate-pulse': isDropBelowThreshold(),
                'bg-amber-500/20 text-amber-300 border-amber-500/40': !isDropBelowThreshold() && rigorScore() < 85,
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40': rigorScore() >= 85
              }">
          {{ rigorScore() }} / 100
        </span>
      </div>

      <!-- Real-time Alert Notification when score falls below 70 -->
      @if (isDropBelowThreshold()) {
        <div class="p-2.5 bg-rose-900/90 border border-rose-500/80 rounded-xl text-xs space-y-1 font-serif text-white shadow-inner">
          <div class="flex items-center gap-1.5 font-bold text-rose-200">
            <mat-icon class="!text-sm text-rose-300">error</mat-icon>
            <span>⚠️ ئاگاداری ڕاستەوخۆ: نمرەی ڕەسەنایەتی لە خوار ٧٠ ڕادەوەستێت!</span>
          </div>
          <p class="text-[11px] text-rose-100 leading-relaxed">
            داڕشتنی ئەم بەشە پێویستی بە توندکردنی زاراوە ئەکادیمییەکان، زیادکردنی ژمارەی سەرچاوەی یەکەمین و کەمکردنەوەی پێکهاتەی سادەیە تاوەکو بە پێوەری هارفەرد بگونجێت.
          </p>
        </div>
      }
    </div>
  `
})
export class AcademicRigorBannerComponent {
  chapterContent = input<string>('');
  chapterTitle = input<string>('');

  rigorScore = computed(() => {
    const text = this.chapterContent() || '';
    if (!text.trim()) return 50;

    let score = 100;
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount < 100) score -= 25;
    else if (wordCount < 300) score -= 15;

    // Check citation markers
    const hasCitations = /\[\d+\]|\(\w+,\s*\d{4}\)|سەرچاوە|Harvard|IEEE/i.test(text);
    if (!hasCitations) score -= 20;

    // Check academic markers
    const hasAcademicTerms = /مێتۆدۆلۆژی|گریمانە|شیکاری|داتا|پێوەر|ئەنجام|گوتار/i.test(text);
    if (!hasAcademicTerms) score -= 15;

    // Penalty for informal phrases
    if (/زۆر زۆر|وەکو|شت|هیچ/i.test(text)) score -= 10;

    return Math.max(30, Math.min(100, score));
  });

  isDropBelowThreshold = computed(() => this.rigorScore() < 70);
}
