import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';

export interface StandardChapterTemplate {
  number: number;
  titleKurdish: string;
  titleEnglish: string;
  objective: string;
  requiredSections: string[];
}

const FIVE_CHAPTER_STANDARD: StandardChapterTemplate[] = [
  {
    number: 1,
    titleKurdish: 'بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە',
    titleEnglish: 'Introduction & General Framework',
    objective: 'ناساندنی کێشە، پرسیارەکان، گرنگی، ئامانجەکان، و سنووردارکردنی توێژینەوەکە.',
    requiredSections: [
      'دەستپێک و پێشینەی کێشە',
      'کێشەی توێژینەوە (Problem Statement)',
      'گرنگیی زانستی و پراکتیکی (Significance)',
      'ئامانجە سەرەکی و لقدارەکان (Objectives)',
      'پرسیار و گریمانەکانی توێژینەوە (Questions & Hypotheses)',
      'سنووری کاتی، شوێنی و بابەتی (Scope & Delimitations)',
      'پێناسەکردنی چەمک و زاراوەکان (Definition of Terms)'
    ]
  },
  {
    number: 2,
    titleKurdish: 'بەشی دووەم: چوارچێوەی تیۆری و پێداچوونەوەی ئەدەبیات',
    titleEnglish: 'Theoretical Framework & Literature Review',
    objective: 'شیکردنەوەی بیردۆزە بنەڕەتییەکان و لێکۆڵینەوە پێشووە پەیوەندیدارەکان.',
    requiredSections: [
      'تەوەری یەکەم: بیردۆزە فەلسەفی و زانستییەکان',
      'تەوەری دووەم: گۆڕاوە سەربەخۆ و پەیوەستەکان',
      'توێژینەوە پێشووە ناوخۆیی و نێودەوڵەتییەکان',
      'بۆشایی زانستی و جیاوازیی ئەم لێکۆڵینەوەیە (Research Gap)'
    ]
  },
  {
    number: 3,
    titleKurdish: 'بەشی سێیەم: میتۆدۆلۆژیا و ڕێکارەکانی لێکۆڵینەوە',
    titleEnglish: 'Research Methodology & Procedures',
    objective: 'ڕوونکردنەوەی شێوازی کۆکردنەوە و چارەسەرکردنی داتا و بەڵگەکان.',
    requiredSections: [
      'میتۆدی توێژینەوە (وەسفی، شیکاری، یان تاقیکاری)',
      'کۆمەڵگەی توێژینەوە (Target Population)',
      'نموونە و شێوازی دیاریکردنی (Sample Size & Sampling Technique)',
      'ئامرازەکانی کۆکردنەوەی داتا (پرسیارنامە، چاوپێکەوتن)',
      'ڕەوایی و جێگیریی ئامرازەکان (Validity & Reliability)',
      'شێوازە ئاماری و شیکارییەکان (Statistical Methods)'
    ]
  },
  {
    number: 4,
    titleKurdish: 'بەشی چوارەم: خستنەڕوو و شیکردنەوەی ئەنجامەکان',
    titleEnglish: 'Results & Data Analysis',
    objective: 'پیشاندانی خشتە، گراف و وەڵامدانەوەی پرسیار و گریمانەکان بە بەڵگەوە.',
    requiredSections: [
      'وەسفی دیمۆگرافیی بەشداربووان',
      'وەڵامی پرسیاری یەکەم و تاقیکردنەوەی گریمانەی پەیوەندیدار',
      'وەڵامی پرسیاری دووەم و هاوکۆلکەی پەیوەندی',
      'پوختەی ئەنجامە ئاماری و دەقییەکان'
    ]
  },
  {
    number: 5,
    titleKurdish: 'بەشی پێنجەم: لێکدانەوە، دەرئەنجام، و ڕاسپاردەکان',
    titleEnglish: 'Discussion, Conclusions & Recommendations',
    objective: 'پێکگرتنی ئەنجامەکان لەگەڵ ئەدەبیاتی پێشوو و پێشنیارکردنی هەنگاوی داهاتوو.',
    requiredSections: [
      'لێکدانەوەی ئەنجامەکان لە ژێر ڕۆشنایی بیردۆزدا (Discussion)',
      'دەرئەنجامە سەرەکییەکان (Key Conclusions)',
      'ڕاسپاردە ئەکادیمی و پراکتیکییەکان (Recommendations)',
      'پێشنیار بۆ توێژینەوەکانی داهاتوو (Suggestions for Future Studies)'
    ]
  }
];

@Component({
  selector: 'app-thesis-structure-organizer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ڕێکخەری پێکهاتەی لۆژیکیی تێز و توێژینەوە (Thesis Structure Organizer)</span>
              <span class="text-[10px] bg-violet-950 text-violet-300 border border-violet-800 px-2 py-0.5 rounded font-mono">
                ستانداردی ٥ بەشی زانکۆکان
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              دیاریکردنی ئاراستەی گشتیی نامە، خشتەی لۆژیکیی تەوەرەکان و گەرەنتی نەپەڕاندنی بەشە سەرەکییەکان
            </p>
          </div>
        </div>

        <button (click)="applyStandard5Chapters()"
                class="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer">
          <mat-icon class="!text-sm !w-4 !h-4">auto_fix_high</mat-icon>
          <span>داڕشتنی خۆکاری بەشەکان لە سەرنووسەر</span>
        </button>
      </div>

      <!-- Chapter Completeness Progress -->
      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-300 font-bold">ئاستی تەواوبوونی پێکهاتەی نامە:</span>
          <div class="w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-l from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                 [style.width.%]="completenessScore()"></div>
          </div>
          <span class="text-xs font-mono text-violet-300 font-bold">{{ completenessScore() }}٪</span>
        </div>

        <span class="text-[11px] text-slate-400">
          ژمارەی بەشە چالاکەکانی ئێستا: {{ currentChaptersCount() }} لە ٥ بەش
        </span>
      </div>

      <!-- Five Standard Chapters Cards -->
      <div class="space-y-2.5">
        @for (ch of standardChapters(); track ch.number) {
          <div class="bg-slate-950/70 border border-slate-800/80 hover:border-violet-800/60 rounded-xl p-3.5 space-y-2 transition">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-violet-950 text-violet-300 border border-violet-800/80 flex items-center justify-center text-xs font-bold font-mono">
                  {{ ch.number }}
                </span>
                <span class="text-xs font-bold text-slate-100">{{ ch.titleKurdish }}</span>
                <span class="text-[11px] text-slate-400 font-mono">({{ ch.titleEnglish }})</span>
              </div>

              <span class="text-[10.5px] text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-900/50">
                ئامانج: {{ ch.objective }}
              </span>
            </div>

            <!-- Required Sections Pills -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              @for (sec of ch.requiredSections; track sec) {
                <span class="text-[11px] bg-slate-900 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 font-serif">
                  <mat-icon class="!text-[10px] !w-2.5 !h-2.5 text-violet-400">check</mat-icon>
                  {{ sec }}
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ThesisStructureOrganizerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  standardChapters = signal<StandardChapterTemplate[]>(FIVE_CHAPTER_STANDARD);

  currentChaptersCount = computed(() => {
    return this.editorService.chapters().length;
  });

  completenessScore = computed(() => {
    const count = this.currentChaptersCount();
    return Math.min(100, Math.round((count / 5) * 100));
  });

  applyStandard5Chapters(): void {
    const existing = this.editorService.chapters();
    if (existing.length > 0 && !confirm('ئایا دڵنیایت دەتەوێت چوارچێوەی ستانداردی ٥ بەش دابڕێژیت؟ بەشەکانت نوێ دەکرێنەوە.')) {
      return;
    }

    const newChapters = FIVE_CHAPTER_STANDARD.map((std, idx) => ({
      id: idx + 1,
      title: std.titleKurdish,
      content: `## ${std.titleKurdish}\n\n### ئامانجی ئەم بەشە:\n${std.objective}\n\n### بڕگە سەرەکییەکان:\n${std.requiredSections.map(s => `- ${s}`).join('\n')}\n\n[دەقی ئەکادیمی لێرە بنووسە...]`
    }));

    this.editorService.setChapters(newChapters as any);
    this.toastService.showSuccess('پێکهاتەی نامە ڕێکخرا', 'هەر ٥ بەشە بنەڕەتییەکەی تێز بە خشتە و تەوەرەکانیانەوە دروستکران.');
  }
}
