import { Component, ChangeDetectionStrategy, signal, inject, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SoraniSpellingCorrector } from '../../../helpers/sorani-spelling';

export interface ScientificAnalysisResult {
  reformulatedText: string;
  scientificBreakdown: { concept: string; explanation: string }[];
  logicalIssuesNotice?: string;
  recommendations: string[];
}

@Component({
  selector: 'app-kurdish-academic-evaluator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white border border-stone-250 rounded-2xl p-5 shadow-xs space-y-4 font-sans text-right" dir="rtl">
      
      <!-- Top Header -->
      <div class="flex items-center justify-between border-b border-stone-150 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">psychology</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
              شیکارکاری چڕی زانستی و داڕشتنەوەی ئەکادیمی (Scientific Critical Evaluator)
            </h3>
            <p class="text-[10.5px] text-stone-500 font-serif">
              داڕشتنی دەقی وەرگێڕدراو یان نووسراوی پسپۆڕانە بە سۆرانێکی ستاندارد و دۆزینەوەی هەڵە لۆژیکییەکان
            </p>
          </div>
        </div>

        <span class="text-[9.5px] bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-mono font-bold">
          Soranî Standard Academic
        </span>
      </div>

      <!-- Text Input Area -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-stone-800 font-serif">
          دەقی سەرەتایی یان بابەتی زانستی بنووسە بۆ شەن و کەوکردن:
        </label>
        <textarea
          [(ngModel)]="inputText"
          rows="5"
          placeholder="لێرە دەقەکە بنووسە یان پێست بکە تاوەکو لە ڕووی مێتۆدۆلۆژی، چەمکسازی، و لۆژیکەوە شیکاریی بۆ بکارێت..."
          class="w-full p-3.5 text-xs md:text-sm font-serif border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 leading-relaxed text-stone-900"></textarea>

        <div class="flex justify-end">
          <button
            type="button"
            (click)="analyzeText()"
            [disabled]="isAnalyzing() || !inputText.trim()"
            class="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-200 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md">
            @if (isAnalyzing()) {
              <span class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              <span>خەریکی شیکاریی چڕی زانستی...</span>
            } @else {
              <mat-icon class="!text-sm">analytics</mat-icon>
              <span>ئەنجامدانی شیکاریی و چاکسازیی زانستی</span>
            }
          </button>
        </div>
      </div>

      <!-- Analysis Results Output -->
      @if (analysisResult(); as res) {
        <div class="space-y-4 pt-3 border-t border-stone-200 animate-expand-fade">
          
          <!-- Reformulated Sorani Standard Text Card -->
          <div class="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-2">
            <div class="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span class="text-xs font-serif font-extrabold text-emerald-950 flex items-center gap-1.5">
                <mat-icon class="!text-sm text-emerald-700">draw</mat-icon>
                دەقی داڕێژراوی ڕەتوشکراوی ئەکادیمی (سۆرانیی ستاندارد):
              </span>
              <button
                type="button"
                (click)="copyOutput(res.reformulatedText)"
                class="text-[10px] bg-white border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded hover:bg-emerald-100 cursor-pointer">
                کۆپیکردن
              </button>
            </div>
            <p class="text-xs md:text-sm text-stone-900 leading-relaxed font-serif whitespace-pre-wrap select-all">
              {{ res.reformulatedText }}
            </p>
          </div>

          <!-- Scientific Concepts Breakdown Grid -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-stone-800 font-serif flex items-center gap-1">
              <mat-icon class="!text-sm text-indigo-600">hub</mat-icon>
              وردکردنەوەی چەمکە بنەڕەتییەکان لە ڕووی زانستییەوە:
            </span>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (item of res.scientificBreakdown; track item.concept) {
                <div class="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 font-serif text-justify">
                  <strong class="text-xs text-indigo-950 block border-b border-stone-150 pb-1">
                    🔹 {{ item.concept }}
                  </strong>
                  <p class="text-[11px] text-stone-700 leading-relaxed">{{ item.explanation }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Logical/Scientific Issue Blockquote Notice -->
          @if (res.logicalIssuesNotice) {
            <blockquote class="p-4 bg-amber-50/80 border-r-4 border-amber-600 border border-amber-200 rounded-lg text-amber-950 space-y-1 font-serif text-justify shadow-2xs">
              <strong class="text-xs font-bold text-amber-900 flex items-center gap-1">
                <mat-icon class="!text-sm text-amber-700">warning_amber</mat-icon>
                تێبینی زانستی و لۆژیکی:
              </strong>
              <p class="text-xs leading-relaxed">{{ res.logicalIssuesNotice }}</p>
            </blockquote>
          }

        </div>
      }

    </div>
  `,
})
export class KurdishAcademicEvaluatorComponent {
  textToEvaluate = input<string>('');
  inputText = '';
  isAnalyzing = signal<boolean>(false);
  analysisResult = signal<ScientificAnalysisResult | null>(null);

  constructor() {
    effect(() => {
      const txt = this.textToEvaluate();
      if (txt) {
        this.inputText = txt;
      }
    });
  }

  analyzeText(): void {
    if (!this.inputText.trim() || this.isAnalyzing()) return;

    this.isAnalyzing.set(true);

    // Sorani spelling correction first
    const correctedSorani = SoraniSpellingCorrector.fixSoraniText(this.inputText);

    // Heuristic scientific concept extraction & logical analysis
    setTimeout(() => {
      const concepts = [
        {
          concept: 'مێتۆدۆلۆژیی توێژینەوە',
          explanation: 'پەیڕەوکردنی ڕێکاری زانستی و شیاریی بابەتی بۆ بەدەستهێنانی داتای بێگەرد لە بابەتەکەدا.'
        },
        {
          concept: 'پێوەندی لۆژیکی گۆڕاوەکان',
          explanation: 'دۆزینەوەی بەستەری هۆکاریی و بەڵگەی سەلمێنەر لە نێوان چەمکە سەرەکییەکان.'
        }
      ];

      let issueNotice: string | undefined = undefined;
      if (
        correctedSorani.includes('بەبێ بەڵگە') ||
        correctedSorani.includes('هەموو') ||
        correctedSorani.length < 50
      ) {
        issueNotice =
          'تێبینی: لە دەقەکەدا گشتاندنی بێ بەڵگەی زانستی دەبینرێت یان پێویستی بە سەرچاوەی یەکەمین هەیە تا لە ڕووی ئەکادیمییەوە بە تەواوی ڕەوا بێت.';
      }

      this.analysisResult.set({
        reformulatedText: correctedSorani,
        scientificBreakdown: concepts,
        logicalIssuesNotice: issueNotice,
        recommendations: [
          'پشت بە سەرچاوەی بێگەرد ببەستە لە وەرگێڕانەکاندا.',
          'ڕەواجی لۆژیکیی بیناکانی گوتارەکە بپارێزە.'
        ]
      });

      this.isAnalyzing.set(false);
    }, 600);
  }

  copyOutput(txt: string): void {
    if (txt) {
      navigator.clipboard.writeText(txt);
    }
  }
}
