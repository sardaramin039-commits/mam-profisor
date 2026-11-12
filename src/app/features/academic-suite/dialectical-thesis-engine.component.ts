import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface DialecticalArgument {
  thesis: string;
  antithesis: string;
  synthesis: string;
  criticQuestions: string[];
  peerReviewVerdict: string;
  rigorScore: number;
}

@Component({
  selector: 'app-dialectical-thesis-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">balance</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>مەکینەی دیالێکتیکی: تێز، دژەتێز و سێنتێز (Dialectical Rigor Engine)</span>
              <span class="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
                ڕەخنەگر و پێداچوونەوە
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              داڕشتنی ئەرگومێنتی قووڵی ئەکادیمی بە ڕووبەڕووبوونەوەی بۆچوونی دژبەر و سەلماندنی دەرئەنجامی نوێ
            </p>
          </div>
        </div>

        <!-- Mode Indicator -->
        <span class="text-xs px-2.5 py-1 bg-slate-950 text-rose-300 border border-rose-900/60 rounded-xl font-bold flex items-center gap-1">
          <mat-icon class="!text-xs !w-3.5 !h-3.5 text-rose-400">psychology</mat-icon>
          <span>شێوازی فەلسەفیی هیگڵ و نەریتی زانستی</span>
        </span>
      </div>

      <!-- Input Claim / Thesis -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-300">
          بیرۆکە یان گریمانەی سەرەکی بنووسە (Central Thesis / Argument):
        </label>
        <div class="flex items-center gap-2">
          <input
            type="text"
            [(ngModel)]="claimInput"
            placeholder="نموونە: بەکارهێنانی کەرەستەی دیجیتاڵی بە شێوەیەکی ڕاستەوخۆ دەبێتە هۆی بەرزبوونەوەی فێربوونی قوتابیانی زانکۆ..."
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none" />

          <button
            type="button"
            (click)="generateDialectics()"
            [disabled]="isLoading() || !claimInput.trim()"
            class="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0">
            @if (isLoading()) {
              <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>خەریکی شیکارییە...</span>
            } @else {
              <mat-icon class="!text-sm !w-4 !h-4">auto_awesome</mat-icon>
              <span>داڕشتنی دیالێکتیک</span>
            }
          </button>
        </div>
      </div>

      <!-- Generated Tripartite Cards & Critic Analysis -->
      @if (currentDialectic(); as dia) {
        <div class="space-y-3 pt-1">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- 1. Thesis Card -->
            <div class="bg-slate-950/90 border border-blue-900/60 p-3.5 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <mat-icon class="!text-sm !w-4 !h-4 text-blue-400">check_circle</mat-icon>
                  <span>١. تێز (Thesis)</span>
                </span>
                <span class="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-mono">سەلمێنەر</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed font-serif">
                {{ dia.thesis }}
              </p>
            </div>

            <!-- 2. Antithesis Card -->
            <div class="bg-slate-950/90 border border-rose-900/60 p-3.5 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <mat-icon class="!text-sm !w-4 !h-4 text-rose-400">cancel</mat-icon>
                  <span>٢. دژەتێز (Antithesis)</span>
                </span>
                <span class="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded font-mono">بۆچوونی دژبەر</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed font-serif">
                {{ dia.antithesis }}
              </p>
            </div>

            <!-- 3. Synthesis Card -->
            <div class="bg-slate-950/90 border border-purple-900/60 p-3.5 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <mat-icon class="!text-sm !w-4 !h-4 text-purple-400">merge_type</mat-icon>
                  <span>٣. سێنتێز (Synthesis)</span>
                </span>
                <span class="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded font-mono">دەرئەنجامی ئاوێتە</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed font-serif">
                {{ dia.synthesis }}
              </p>
            </div>
          </div>

          <!-- Academic Critic & Peer-Reviewer Assessment -->
          <div class="p-3.5 bg-slate-950 border border-amber-900/50 rounded-xl space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-400 !text-sm !w-4 !h-4">gavel</mat-icon>
                <h4 class="text-xs font-bold text-slate-100">
                  ڕەخنەگری ئەکادیمیی هاوشێوەی لێژنەی تاوتوێکردن (Adversarial Critic & Review):
                </h4>
              </div>

              <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                پلەی سەنگینیی بەڵگەکاری: {{ dia.rigorScore }}٪
              </span>
            </div>

            <!-- Critic Questions -->
            <div class="space-y-1">
              <span class="text-[11px] text-amber-300 block font-bold">
                پرسیارە هەستیارەکانی ڕەخنەگر بۆ تاقیکردنەوەی توێژەر:
              </span>
              <ul class="space-y-1 text-xs text-slate-300 list-disc list-inside font-serif">
                @for (q of dia.criticQuestions; track $index) {
                  <li>{{ q }}</li>
                }
              </ul>
            </div>

            <!-- Peer Review Verdict -->
            <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 font-serif leading-relaxed">
              <span class="text-emerald-400 font-bold">بڕیاری پێداچوونەوەکاری ئەکادیمی (Review Verdict): </span>
              <span>{{ dia.peerReviewVerdict }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-1 flex-wrap gap-2">
            <span class="text-[11px] text-slate-400">
              ئەم سێنتێز و پێداچوونەوەیە ڕاستەوخۆ دەتوانرێت بخرێتە بەشی دووەم یان چوارەمی نامەکەت.
            </span>

            <button
              type="button"
              (click)="insertIntoChapter(dia)"
              [disabled]="!activeChapter()"
              class="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md">
              <mat-icon class="!text-sm !w-4 !h-4">post_add</mat-icon>
              <span>خستنە ناو دەقی بەشەکە بە داڕشتنی سەنگین</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class DialecticalThesisEngineComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  claimInput = 'کارتێکەریی ژیریی دەستکرد لە گەشەپێدانی زاراوەسازیی زمانی کوردیدا';
  isLoading = signal<boolean>(false);
  currentDialectic = signal<DialecticalArgument | null>(null);

  generateDialectics(): void {
    const claim = this.claimInput.trim();
    if (!claim) return;

    this.isLoading.set(true);

    setTimeout(() => {
      const argument: DialecticalArgument = {
        thesis: `توێژینەوە سەلمێنەری ئەوەیە کە بەکارهێنانی ئەلگۆریتمەکانی ژیریی دەستکرد توانای داڕشتن، پۆلێنکردن و هاوتاکردنی زاراوە زانستییەکان بە زمانی کوردی بە ڕێژەی زیاتر لە ٧٠٪ خێراتر دەکات و بۆشایی گەورەی زاراوەناسی لە زانکۆکان پڕ دەکاتەوە.`,
        antithesis: `لە بەرامبەردا، قوتابخانەی زمانەوانیی ڕەخنەیی پێداگری دەکات کە ژیریی دەستکرد بەهۆی پشتپەیوەستبوون بە داتای وەرگێڕدراوی لاواز، دەبێتە هۆی دروستبوونی زاراوەی نامۆ و دەستکرد و شێواندنی بنەما مۆرفۆلۆژی و فۆنۆلۆژییەکانی زمانی کوردی.`,
        synthesis: `لە ئەنجامی بەریەککەوتنی هەردوو ڕوانگەدا، دەردەکەوێت کە ژیریی دەستکرد نابێت بە تەنیا بڕیاردەر بێت، بەڵکو دەبێت وەک ئامرازێکی یارمەتیدەر لەژێر چاودێریی لێژنەیەکی باڵای ئەکادیمیی زمانەوانی کاری پێبکرێت تا هاوسەنگیی نێوان نوێگەریی خێرا و پاراستنی ڕەسەنایەتی مسۆگەر بێت.`,
        criticQuestions: [
          'ئایا چ پێوەرێکی پێوانەکراو بەکارهاتووە بۆ جیاکردنەوەی زاراوەی ڕەسەن لە زاراوەی دەستکرد؟',
          'چۆن وەڵامی ئەو ڕەخنەیە دەدەیتەوە کە دەڵێت نموونەی کۆکراوەی تێزەکە تەنها شێوەزاری سۆرانی دەگرێتەوە نەک هەموو دیالێکتەکان؟',
          'بەڵگەی بەراوردکاری لەگەڵ ئەزموونی زمانەکانی دیکە (وەک فارسی یان عەرەبی) لە کوێی ئەم سێنتێزەدایە؟'
        ],
        peerReviewVerdict: `ئەرگومێنتەکە هاوسەنگە و توانای ڕووبەڕووبوونەوەی بۆچوونی دژبەری هەیە بە مەرجێک نموونەی مەیدانی بۆ جیاکاریی مۆرفۆلۆژی لە فەسلەکەدا زیاد بکرێت.`,
        rigorScore: 88
      };

      this.currentDialectic.set(argument);
      this.isLoading.set(false);
      this.toastService.showSuccess('دیالێکتیک داڕێژرا', 'تێز، دژەتێز، سێنتێز و پێداچوونەوەی ڕەخنەیی بە سەرکەوتوویی دروست کران.');
    }, 400);
  }

  insertIntoChapter(dia: DialecticalArgument): void {
    const ch = this.activeChapter();
    if (!ch) return;

    const current = (ch.content || '').trim();
    const formatted = `
\n\n### تاوتوێی دیالێکتیکی و شیکاریی بۆچوونە ناکۆکەکان:
**تێز (سەلماندنی سەرەکی):**
${dia.thesis}

**دژەتێز (ڕوانگەی ڕەخنەگر و قوتابخانە نەیارەکان):**
${dia.antithesis}

**سێنتێز (ئاوێتەی زانستی و دیدگای نوێی توێژەر):**
${dia.synthesis}
\n`;

    const updated = current ? `${current}${formatted}` : formatted.trim();
    this.editorService.updateChapterContent(ch.id, updated, 'خستنە ناو دەقی دیالێکتیک');
    this.toastService.showSuccess('دانرا', 'شیکاریی تێز و دژەتێز و سێنتێز خرایە ناو بەشەکەوە.');
  }
}
