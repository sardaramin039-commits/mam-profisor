import { Component, ChangeDetectionStrategy, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ACADEMIC_GLOSSARY } from '../../../../prompts/academic-glossary';
import { toSoraniNumber } from '../../../pipes/sorani-number.pipe';

export interface HealthMetric {
  name: string;
  nameKurdish: string;
  value: number;
  unit: string;
  targetRange: string;
  status: 'optimal' | 'warning' | 'alert';
  description: string;
  recommendation: string;
}

@Component({
  selector: 'app-thesis-health-report',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <mat-icon class="!text-xl !w-6 !h-6 leading-none">health_and_safety</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 font-serif">
              ڕاپۆرتی تەندروستیی ئەکادیمیی تێز (Thesis Health Report)
            </h3>
            <p class="text-[11px] text-slate-400 font-serif">
              پێوانەکردنی یەکانگیری لۆژیکی، چڕیی زاراوەسازی و درێژی ڕستەکان بەپێی ستانداردە جیهانییەکان
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-1.5 text-xs">
            <span class="text-slate-400 font-serif">نمرەی تەندروستی گشتی:</span>
            <span class="font-bold text-sm" [class]="getScoreColorClass(overallHealthScore())">
              ٪{{ toSorani(overallHealthScore()) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Overview Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Metric 1: Logical Consistency -->
        <div class="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300 font-serif">یەکانگیریی لۆژیکی</span>
            <mat-icon class="!text-base text-teal-400">account_tree</mat-icon>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold font-mono text-teal-300">٪{{ toSorani(logicalScore()) }}</span>
            <span class="text-[10px] text-slate-500 font-serif">/ ١٠٠٪</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-teal-500 h-full rounded-full transition-all duration-500" [style.width.%]="logicalScore()"></div>
          </div>
          <p class="text-[10.5px] text-slate-400 font-serif">
            {{ transitionsFound() }} گرێدەری لۆژیکی و هاوسەنگیی دەق دۆزراونەتەوە
          </p>
        </div>

        <!-- Metric 2: Terminology Density -->
        <div class="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300 font-serif">چڕیی زاراوەسازی</span>
            <mat-icon class="!text-base text-indigo-400">psychology</mat-icon>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold font-mono text-indigo-300">٪{{ toSorani(terminologyDensity()) }}</span>
            <span class="text-[10px] text-slate-500 font-serif">(ستاندارد: ٤-٨٪)</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-indigo-500 h-full rounded-full transition-all duration-500" [style.width.%]="Math.min(100, terminologyDensity() * 12)"></div>
          </div>
          <p class="text-[10.5px] text-slate-400 font-serif">
            {{ recognizedAcademicTerms() }} زاراوەی ئەکادیمیی ناسێنراو لە دەقدا
          </p>
        </div>

        <!-- Metric 3: Avg Sentence Length -->
        <div class="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300 font-serif">تێکڕای درێژیی ڕستە</span>
            <mat-icon class="!text-base text-amber-400">straighten</mat-icon>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold font-mono text-amber-300">{{ toSorani(avgSentenceLength()) }}</span>
            <span class="text-[10px] text-slate-400 font-serif">وشە / ڕستە</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-amber-500 h-full rounded-full transition-all duration-500" [style.width.%]="Math.min(100, (avgSentenceLength() / 30) * 100)"></div>
          </div>
          <p class="text-[10.5px] text-slate-400 font-serif">
            ستانداردی ڕستەی زانستی: ١٥ بۆ ٢٥ وشە
          </p>
        </div>
      </div>

      <!-- Actionable Health Diagnoses & Recommendations -->
      <div class="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3">
        <h4 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
          <mat-icon class="!text-sm text-teal-400">checklist</mat-icon>
          <span>پشکنینی هەڵسەنگاندن و پێشنیارەکانی باشترکردن:</span>
        </h4>

        <div class="space-y-2">
          @for (rec of healthRecommendations(); track rec.title) {
            <div class="p-3 rounded-lg border flex items-start gap-2.5" [class]="rec.cardClass">
              <mat-icon class="!text-base shrink-0 mt-0.5" [class]="rec.iconClass">{{ rec.icon }}</mat-icon>
              <div class="space-y-0.5 text-xs">
                <p class="font-bold font-serif text-slate-200">{{ rec.title }}</p>
                <p class="text-[11px] text-slate-400 font-serif leading-relaxed">{{ rec.detail }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ThesisHealthReportComponent {
  thesisText = input<string>('');
  Math = Math;

  private readonly academicConnectors = [
    'لە ئەنجامدا', 'بە پێچەوانەوە', 'سەرەڕای ئەوەش', 'لە هەمان کاتدا',
    'بەم پێیەش', 'کەواتە', 'بۆیە', 'لە ڕوانگەی', 'پشت بەست بە',
    'لە ڕووی زانستییەوە', 'وەک دەرئەنجام', 'دەکرێت بگوترێت', 'بەڵگەی ئەوەیە'
  ];

  toSorani(val: number | string): string {
    return toSoraniNumber(val);
  }

  // Calculate words and sentences
  words = computed(() => {
    const text = this.thesisText() || '';
    return text.trim().split(/\s+/).filter(w => w.length > 0);
  });

  sentences = computed(() => {
    const text = this.thesisText() || '';
    return text.split(/[.،؛؟!\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  });

  // 1. Logical consistency metric
  transitionsFound = computed(() => {
    const text = this.thesisText() || '';
    let count = 0;
    for (const conn of this.academicConnectors) {
      const regex = new RegExp(conn, 'g');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  });

  logicalScore = computed(() => {
    const wordCount = this.words().length;
    if (wordCount === 0) return 0;
    const connectors = this.transitionsFound();
    const ratio = (connectors / Math.max(1, wordCount / 100)); // Expected ~2-4 connectors per 100 words
    const baseScore = Math.min(100, Math.round(ratio * 28) + 30);
    return Math.min(100, Math.max(15, baseScore));
  });

  // 2. Terminology density metric
  recognizedAcademicTerms = computed(() => {
    const text = (this.thesisText() || '').toLowerCase();
    let count = 0;
    for (const entry of ACADEMIC_GLOSSARY) {
      const kurdish = entry.translation.split('/')[0].trim().toLowerCase();
      if (kurdish.length > 2 && text.includes(kurdish)) count++;
    }
    return count;
  });

  terminologyDensity = computed(() => {
    const wordCount = this.words().length;
    if (wordCount <= 0) return 0;
    const termHits = this.recognizedAcademicTerms();
    const pct = (termHits / (wordCount / 100));
    return isNaN(pct) ? 0 : Math.round(pct * 10) / 10;
  });

  // 3. Average sentence length metric
  avgSentenceLength = computed(() => {
    const wordCount = this.words().length;
    const sentCount = this.sentences().length;
    if (sentCount <= 0 || wordCount <= 0) return 0;
    return Math.round(wordCount / sentCount);
  });

  // Overall combined health score
  overallHealthScore = computed(() => {
    if (this.words().length < 20) return 60;
    const l = this.logicalScore();
    const t = Math.min(100, this.terminologyDensity() * 15);
    const sentLen = this.avgSentenceLength();
    const sentScore = sentLen >= 14 && sentLen <= 26 ? 95 : sentLen < 10 || sentLen > 35 ? 60 : 80;
    return Math.round((l * 0.4) + (t * 0.3) + (sentScore * 0.3));
  });

  healthRecommendations = computed(() => {
    const list: { title: string; detail: string; icon: string; iconClass: string; cardClass: string }[] = [];
    const wordCount = this.words().length;
    const sentLen = this.avgSentenceLength();
    const density = this.terminologyDensity();
    const connectors = this.transitionsFound();

    if (wordCount < 50) {
      list.push({
        title: 'قەبارەی دەقەکە بۆ شیکاری کەمە',
        detail: 'بەشێکی تەواو یان چەند پەرەگرافێکی نووسینەکەت بنووسە بۆ بەدەستهێنانی ڕاپۆرتی تەندروستی وردتر.',
        icon: 'info',
        iconClass: 'text-sky-400',
        cardClass: 'bg-sky-950/30 border-sky-800/60'
      });
      return list;
    }

    if (sentLen > 28) {
      list.push({
        title: 'ڕستەکان زۆر درێژن (Run-on Sentences)',
        detail: `تێکڕای درێژی ڕستەکانت (${toSoraniNumber(sentLen)} وشە) زیاترە لە ستاندارد. پێشنیار دەکرێت ڕستە درێژەکان دابەش بکەیت بۆ پاراستنی ڕوونی زمانەوانی.`,
        icon: 'warning',
        iconClass: 'text-amber-400',
        cardClass: 'bg-amber-950/30 border-amber-800/60'
      });
    } else if (sentLen < 12) {
      list.push({
        title: 'ڕستەکان زۆر کورتن (Fragment Sentences)',
        detail: 'ڕستەکانت کورتن، بەکارهێنانی ئامرازەکانی گرێدانی لۆژیکی بۆ پێکەوەبەستنی بیرۆکەکان گونجاوترە.',
        icon: 'info',
        iconClass: 'text-sky-400',
        cardClass: 'bg-sky-950/30 border-sky-800/60'
      });
    } else {
      list.push({
        title: 'درێژیی ڕستەکان لە ئاستی ستاندارددایە',
        detail: `تێکڕای ${toSoraniNumber(sentLen)} وشە بۆ هەر ڕستەیەک بە تەواوی لەگەڵ پێوەرە ئەکادیمییەکان دەگونجێت.`,
        icon: 'check_circle',
        iconClass: 'text-emerald-400',
        cardClass: 'bg-emerald-950/30 border-emerald-800/60'
      });
    }

    if (density < 2.5) {
      list.push({
        title: 'چڕیی زاراوەی زانستی کەمە',
        detail: 'پێشنیار دەکرێت زاراوەی پسپۆڕانەتر لە فەرهەنگی ئەکادیمی کوردی بۆ بەشەکە بەکاربهێنیت بۆ بەرزکردنەوەی ئاستی زانستی.',
        icon: 'psychology',
        iconClass: 'text-indigo-400',
        cardClass: 'bg-indigo-950/30 border-indigo-800/60'
      });
    } else {
      list.push({
        title: 'چڕیی زاراوەسازیی ئەکادیمی نایابە',
        detail: `بەشەکە پڕە لە چەمک و دەستەواژەی قورس و زانستی و لەگەڵ فەرهەنگی سۆرانی هاوتەریبە.`,
        icon: 'verified',
        iconClass: 'text-teal-400',
        cardClass: 'bg-teal-950/30 border-teal-800/60'
      });
    }

    if (connectors < 3 && wordCount > 120) {
      list.push({
        title: 'پێویستی بە گرێدەری لۆژیکیی زیاتر هەیە',
        detail: 'بۆ بەستنەوەی سەرەنجام و هۆکارەکان، زیاتر وشەکانی (لە ئەنجامدا، بەپێی ئەمەش، سەرەڕای ئەوەش) زیاد بکە.',
        icon: 'alt_route',
        iconClass: 'text-amber-400',
        cardClass: 'bg-amber-950/30 border-amber-800/60'
      });
    }

    return list;
  });

  getScoreColorClass(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  }
}
