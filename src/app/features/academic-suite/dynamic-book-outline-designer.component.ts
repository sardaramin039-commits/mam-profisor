import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { buildAcademicThesisOutline } from '../../helpers/outline-structure';

export interface KurdishStandardEvaluation {
  status: 'compliant' | 'warning' | 'needs_adjustment';
  statusLabel: string;
  badgeClass: string;
  wordDensityLabel: string;
  subsectionsAdvice: string;
  structureDistribution: { name: string; percentage: number; words: number }[];
}

@Component({
  selector: 'app-dynamic-book-outline-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>دیزاینەری داینامیکیی پێڕستی کتێب (Dynamic Outline Designer)</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">
                ستانداردی سۆرانی
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              دابەشکردنی داینامیکی بەش و ژێر-بەشەکان بەپێی ڕێژەی وشە لە لاپەڕەدا و بەراوردی ستانداردە زانستییەکان
            </p>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button (click)="applyPreset('thesis')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            نامەی ماستەر/دکتۆرا
          </button>
          <button (click)="applyPreset('book')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            کتێبی زانستی B5
          </button>
          <button (click)="applyPreset('monograph')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            مۆنۆگرافی چڕ
          </button>
        </div>
      </div>

      <!-- Controls Matrix: Pages, Words-per-page, Subsections -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
        <!-- Target Pages -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>ژمارەی لاپەڕەی کتێب:</span>
            <span class="text-purple-400 font-mono text-sm">{{ targetPages() }} لاپەڕە</span>
          </label>
          <input
            type="range"
            min="10"
            max="300"
            step="5"
            [ngModel]="targetPages()"
            (ngModelChange)="targetPages.set($event)"
            class="w-full accent-purple-500 cursor-pointer" />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>١٠ لاپەڕە</span>
            <span>١٥٠ لاپەڕە</span>
            <span>٣٠٠ لاپەڕە</span>
          </div>
        </div>

        <!-- Words Per Page Ratio -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>ڕێژەی وشە لە لاپەڕەیەکدا:</span>
            <span class="text-indigo-400 font-mono text-sm">{{ wordsPerPage() }} وشە</span>
          </label>
          <input
            type="range"
            min="200"
            max="500"
            step="25"
            [ngModel]="wordsPerPage()"
            (ngModelChange)="wordsPerPage.set($event)"
            class="w-full accent-indigo-500 cursor-pointer" />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>٢٠٠ (فراوان)</span>
            <span>٣٥٠ (ستاندارد)</span>
            <span>٥٠٠ (چڕ)</span>
          </div>
        </div>

        <!-- Subsections per Chapter -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>چڕیی ژێر-بەشەکان:</span>
            <span class="text-violet-400 font-mono text-sm">{{ subtopicsPerChapter() }} تەوەر لە فەسلێکدا</span>
          </label>
          <input
            type="range"
            min="2"
            max="6"
            step="1"
            [ngModel]="subtopicsPerChapter()"
            (ngModelChange)="subtopicsPerChapter.set($event)"
            class="w-full accent-violet-500 cursor-pointer" />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>٢ (سادە)</span>
            <span>٤ (هاوسەنگ)</span>
            <span>٦ (تەواو چڕ)</span>
          </div>
        </div>
      </div>

      <!-- Real-time Mathematical & Architectural Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">کۆی وشەی کتێبەکە</span>
          <span class="text-lg font-bold font-mono text-purple-300">{{ totalWordsBudget() }}</span>
          <span class="text-[10px] text-slate-500 block">وشەی خەمڵێنراو</span>
        </div>

        <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">ژمارەی فەسلە سەرەکییەکان</span>
          <span class="text-lg font-bold font-mono text-indigo-300">{{ majorChaptersCount() }}</span>
          <span class="text-[10px] text-slate-500 block">فەسڵی سەرەکی</span>
        </div>

        <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">کۆی تەوەر و ژێر-بەشەکان</span>
          <span class="text-lg font-bold font-mono text-violet-300">{{ totalSubstantiveUnits() }}</span>
          <span class="text-[10px] text-slate-500 block">تەوەری سەربەخۆ</span>
        </div>

        <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">قەبارەی هەر تەوەرێک</span>
          <span class="text-lg font-bold font-mono text-emerald-300">{{ wordsPerSubsection() }}</span>
          <span class="text-[10px] text-slate-500 block">وشە لە یەک وەڵامدا</span>
        </div>
      </div>

      <!-- Kurdish Academic Standards Compliance Panel -->
      @if (evaluation(); as eval) {
        <div class="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <mat-icon class="!text-sm !w-4 !h-4 text-purple-400">verified</mat-icon>
              <span class="text-xs font-bold text-slate-200">هەڵسەنگاندن بەپێی ستانداردە ئەکادیمییەکانی کوردیی سۆرانی:</span>
            </div>
            <span [class]="eval.badgeClass" class="text-xs px-2.5 py-0.5 rounded-full font-bold">
              {{ eval.statusLabel }}
            </span>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed font-serif">
            {{ eval.wordDensityLabel }} {{ eval.subsectionsAdvice }}
          </p>

          <!-- Structure Balance Bar -->
          <div class="space-y-1">
            <span class="text-[10px] text-slate-400 block">هاوسەنگیی بەشەکان بەپێی نەریتی ئەکادیمی:</span>
            <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
              <div class="h-full bg-blue-500" style="width: 15%" title="پێشەکی و چوارچێوە: ١٥٪"></div>
              <div class="h-full bg-purple-500" style="width: 25%" title="چەمکسازی و تیۆری: ٢٥٪"></div>
              <div class="h-full bg-indigo-500" style="width: 20%" title="میتۆدۆلۆژیا: ٢٠٪"></div>
              <div class="h-full bg-emerald-500" style="width: 30%" title="شیکاری و دۆزینەوە: ٣٠٪"></div>
              <div class="h-full bg-amber-500" style="width: 10%" title="ئەنجام و ڕاسپاردە: ١٠٪"></div>
            </div>
            <div class="flex justify-between text-[9px] text-slate-500 pt-0.5">
              <span>پێشەکی (١٥٪)</span>
              <span>تیۆری (٢٥٪)</span>
              <span>مێتۆد (٢٠٪)</span>
              <span>شیکاری (٣٠٪)</span>
              <span>ئەنجام (١٠٪)</span>
            </div>
          </div>
        </div>
      }

      <!-- Apply Button -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        <span class="text-xs text-slate-400">
          بە پەسەندکردن، تەواوی بەشەکان بەپێی ئەم ئەندازەیە بۆ پەنجەرەی دووەم ڕێکدەخرێن.
        </span>

        <button
          type="button"
          (click)="applyDesignedOutline()"
          class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
          <mat-icon class="!text-sm !w-4 !h-4">done_all</mat-icon>
          <span>جێبەجێکردن و ڕێکخستنی پێڕست لە نووسیندا</span>
        </button>
      </div>
    </div>
  `
})
export class DynamicBookOutlineDesignerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  targetPages = signal<number>(50);
  wordsPerPage = signal<number>(350);
  subtopicsPerChapter = signal<number>(4);

  totalWordsBudget = computed(() => this.targetPages() * this.wordsPerPage());

  totalSubstantiveUnits = computed(() => {
    // Exact user algorithm: pages / response capacity
    const pagesPerResponse = 2; // ~550-650 words capacity
    return Math.max(2, Math.ceil(this.targetPages() / pagesPerResponse));
  });

  majorChaptersCount = computed(() => {
    const units = this.totalSubstantiveUnits();
    const subs = this.subtopicsPerChapter();
    return Math.max(2, Math.min(8, Math.ceil(units / subs)));
  });

  wordsPerSubsection = computed(() => {
    const total = this.totalWordsBudget();
    const units = this.totalSubstantiveUnits();
    return Math.max(350, Math.round((total * 0.70) / units));
  });

  evaluation = computed<KurdishStandardEvaluation>(() => {
    const wPerSub = this.wordsPerSubsection();
    const wpp = this.wordsPerPage();

    let status: 'compliant' | 'warning' | 'needs_adjustment' = 'compliant';
    let statusLabel = 'پەسەندکراوی تەواو بەپێی ستاندارد';
    let badgeClass = 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    let wordDensityLabel = `ڕێژەی ${wpp} وشە لە لاپەڕەیەکدا تەواو هاوتایە لەگەڵ پێوەری چاپ و پێداچوونەوەی ئەکادیمیی زانکۆکانی کوردستان.`;
    let subsectionsAdvice = `قەبارەی هەر تەوەرێک (${wPerSub} وشە) لە سنوری تەواوی توانای نووسینی تێرکەردایە بەبێ کورتکردنەوە.`;

    if (wPerSub < 350) {
      status = 'warning';
      statusLabel = 'تەوەرەکان کورتن';
      badgeClass = 'bg-amber-950 text-amber-300 border border-amber-800';
      subsectionsAdvice = 'قەبارەی وشەی هەر تەوەرێک کەمە، پێشنیار دەکرێت ژمارەی تەوەرەکان کەم بکرێتەوە یان لاپەڕە زیاد بکرێت.';
    } else if (wPerSub > 850) {
      status = 'needs_adjustment';
      statusLabel = 'تەوەرەکان پێویستیان بە وردکردنەوەیە';
      badgeClass = 'bg-rose-950 text-rose-300 border border-rose-800';
      subsectionsAdvice = 'تەوەرەکان قەبارەیان زیاترە لە توانای یەک وەڵامی تێرکەر، تکایە ڕێژەی ژێر-بەشەکان زیاد بکە.';
    }

    return {
      status,
      statusLabel,
      badgeClass,
      wordDensityLabel,
      subsectionsAdvice,
      structureDistribution: [
        { name: 'پێشەکی و چوارچێوە', percentage: 15, words: Math.round(this.totalWordsBudget() * 0.15) },
        { name: 'چوارچێوەی تیۆری', percentage: 25, words: Math.round(this.totalWordsBudget() * 0.25) },
        { name: 'میتۆدۆلۆژیا', percentage: 20, words: Math.round(this.totalWordsBudget() * 0.20) },
        { name: 'شیکاری و داتاکان', percentage: 30, words: Math.round(this.totalWordsBudget() * 0.30) },
        { name: 'دەرئەنجام و ڕاسپاردە', percentage: 10, words: Math.round(this.totalWordsBudget() * 0.10) }
      ]
    };
  });

  applyPreset(preset: 'thesis' | 'book' | 'monograph'): void {
    if (preset === 'thesis') {
      this.targetPages.set(80);
      this.wordsPerPage.set(280);
      this.subtopicsPerChapter.set(4);
    } else if (preset === 'book') {
      this.targetPages.set(120);
      this.wordsPerPage.set(350);
      this.subtopicsPerChapter.set(5);
    } else {
      this.targetPages.set(40);
      this.wordsPerPage.set(450);
      this.subtopicsPerChapter.set(3);
    }
  }

  applyDesignedOutline(): void {
    const chapters = buildAcademicThesisOutline({
      title: 'کتێبی زانستی و لێکۆڵینەوەی ئەکادیمی',
      targetPages: this.targetPages(),
      writingType: 'book',
      includeDedication: true,
      includeTOC: true,
      includeIntro: true,
      includeConclusion: true,
      includeRecommendations: true,
      includeReferences: true
    });

    this.editorService.setChapters(chapters);
    if (chapters.length > 0) {
      this.editorService.activeChapterId.set(chapters[0].id);
    }

    this.toastService.showSuccess(
      'پێڕستی داینامیکی جێگیرکرا',
      `پێڕستی کتێبەکە بە سەرکەوتوویی بەپێی ${this.targetPages()} لاپەڕە و ${this.totalWordsBudget()} وشە ڕێکخرا (${chapters.length} بەش).`
    );
  }
}
