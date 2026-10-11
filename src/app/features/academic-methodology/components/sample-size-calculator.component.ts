import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../../editor/services/editor';
import { AppNotificationsService } from '../../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../../domain/models';

@Component({
  selector: 'app-sample-size-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <mat-icon class="!text-2xl !w-6 !h-6">calculate</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>ژمێرەری قەبارەی نموونەی توێژینەوە (Sample Size Calculator)</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                هاوکێشەی یامانی و کۆکران
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              ئەژمارکردنی زانستیی قەبارەی نموونە ($n$) لەسەر بنەمای کۆمەڵگە ($N$) و داڕشتنی ڕستەی میتۆدۆلۆژی
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-teal-400 font-mono text-xs font-bold rounded-lg">
            نموونەی پێویست: {{ calculatedSample() }} کەس
          </span>
        </div>
      </div>

      <!-- Input Controls Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <!-- 1. Population Size -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">قەبارەی کۆمەڵگە (Population N):</label>
          <input
            type="number"
            min="10"
            max="10000000"
            [ngModel]="populationSize()"
            (ngModelChange)="populationSize.set($event)"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl text-xs text-slate-100 font-mono focus:outline-none"
            placeholder="بۆ نموونە: 1500" />
          <span class="text-[10.5px] text-slate-400 mt-1 block">تەواوی ژمارەی بەشداربووان</span>
        </div>

        <!-- 2. Margin of Error -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">ڕێژەی هەڵە (Margin of Error %):</label>
          <div class="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              [ngModel]="marginOfError()"
              (ngModelChange)="marginOfError.set($event)"
              class="w-full accent-teal-500 cursor-pointer" />
            <span class="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-teal-300 font-bold">
              {{ marginOfError() }}٪
            </span>
          </div>
          <span class="text-[10.5px] text-slate-400 mt-1 block">ستانداردی زانستی: 5٪</span>
        </div>

        <!-- 3. Confidence Level -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">ئاستی متمانە (Confidence Level):</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
            @for (cl of [90, 95, 99]; track cl) {
              <button
                type="button"
                (click)="confidenceLevel.set(cl)"
                [class]="confidenceLevel() === cl ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="py-1 text-xs rounded-lg transition cursor-pointer font-mono">
                {{ cl }}٪
              </button>
            }
          </div>
          <span class="text-[10.5px] text-slate-400 mt-1 block">Z-Value = {{ zScore() }}</span>
        </div>

        <!-- 4. Formula Choice -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">هاوکێشەی زانستی (Formula):</label>
          <div class="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              (click)="selectedFormula.set('yamane')"
              [class]="selectedFormula() === 'yamane' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="py-1 text-xs rounded-lg transition cursor-pointer">
              Yamane (١٩٦٧)
            </button>
            <button
              type="button"
              (click)="selectedFormula.set('cochran')"
              [class]="selectedFormula() === 'cochran' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="py-1 text-xs rounded-lg transition cursor-pointer">
              Cochran (١٩٧٧)
            </button>
          </div>
          <span class="text-[10.5px] text-slate-400 mt-1 block">
            {{ selectedFormula() === 'yamane' ? 'گونجاو بۆ کۆمەڵگەی دیاریکراو' : 'وردبینی بە ئاستی متمانە' }}
          </span>
        </div>
      </div>

      <!-- Result Card & Generated Methodology Text -->
      <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
          <div class="flex items-center gap-2 text-xs font-bold text-teal-300">
            <mat-icon class="!text-base !w-4 !h-4">description</mat-icon>
            <span>دەقی داڕێژراوی میتۆدۆلۆژیا بۆ ناو توێژینەوە (Methodology Text):</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="copyText()"
              class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer">
              <mat-icon class="!text-xs !w-3.5 !h-3.5 text-teal-400">content_copy</mat-icon>
              <span>کۆپیکردن</span>
            </button>

            <button
              type="button"
              (click)="insertIntoActiveChapter()"
              [disabled]="!activeChapter()"
              class="px-3 py-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">add_circle</mat-icon>
              <span>زیادکردن بۆ بەشی چالاک</span>
            </button>
          </div>
        </div>

        <!-- Rendered Text Box -->
        <p class="text-xs leading-relaxed text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 font-serif selection:bg-teal-500 selection:text-white">
          {{ generatedMethodologyParagraph() }}
        </p>

        <!-- Scientific Reference Citation -->
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-serif border-t border-slate-800/50">
          <span>
            📚 سەرچاوەی هاوکێشە:
            <span class="text-slate-300 font-sans">
              {{ selectedFormula() === 'yamane' ? 'Yamane, T. (1967). Statistics: An Introductory Analysis (2nd ed.). Harper and Row.' : 'Cochran, W. G. (1977). Sampling techniques (3rd ed.). John Wiley & Sons.' }}
            </span>
          </span>
          <span class="text-teal-400 font-mono">
            ڕێژەی نوێنەرایەتی: {{ samplingPercentage() }}٪ لە کۆمەڵگە
          </span>
        </div>
      </div>
    </div>
  `
})
export class SampleSizeCalculatorComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  populationSize = signal<number>(1000);
  marginOfError = signal<number>(5);
  confidenceLevel = signal<number>(95);
  selectedFormula = signal<'yamane' | 'cochran'>('yamane');

  zScore = computed(() => {
    const cl = this.confidenceLevel();
    if (cl === 99) return 2.576;
    if (cl === 90) return 1.645;
    return 1.96; // 95% default
  });

  calculatedSample = computed(() => {
    const N = Math.max(10, Number(this.populationSize()) || 100);
    const e = (Number(this.marginOfError()) || 5) / 100;

    if (this.selectedFormula() === 'yamane') {
      // Yamane formula: n = N / (1 + N * e^2)
      const n = N / (1 + N * Math.pow(e, 2));
      return Math.ceil(n);
    } else {
      // Cochran finite population formula:
      // n0 = (Z^2 * p * q) / e^2 (assuming p = 0.5 for maximum variability)
      const z = this.zScore();
      const p = 0.5;
      const q = 0.5;
      const n0 = (Math.pow(z, 2) * p * q) / Math.pow(e, 2);
      const n = n0 / (1 + (n0 - 1) / N);
      return Math.ceil(n);
    }
  });

  samplingPercentage = computed(() => {
    const N = Math.max(1, Number(this.populationSize()) || 1);
    const n = this.calculatedSample();
    return ((n / N) * 100).toFixed(1);
  });

  generatedMethodologyParagraph = computed(() => {
    const N = this.populationSize();
    const n = this.calculatedSample();
    const e = this.marginOfError();
    const cl = this.confidenceLevel();
    const formulaName = this.selectedFormula() === 'yamane' ? 'یامانی (Yamane, 1967)' : 'کۆکران (Cochran, 1977)';

    return `بۆ دیاریکردنی قەبارەی نموونەی توێژینەوە لە کۆمەڵگەی ئاماری بە قەبارەی (${N.toLocaleString()} کەس)، هاوکێشەی زانستیی ${formulaName} بە ئاستی متمانەی ${cl}٪ و ڕێژەی هەڵەی پەسەندکراوی ${e}٪ (e = ${e/100}) بەکارهێنراوە. بەپێی ئەم پێوەرە ئەکادیمییە، قەبارەی نموونەی نوێنەرایەتیکار و پێویست بۆ بەدەستهێنانی ئەنجامی متمانەپێکراو بریتییە لە (${n.toLocaleString()} بەشداربوو)، کە دەکاتە نزیکەی (${this.samplingPercentage()}٪)ی سەرجەم کۆمەڵگەی توێژینەوەکە. ئەم قەبارەیە ڕەوایی و توانای گشتاندنی دەرئەنجامەکان بۆ تەواوی کۆمەڵگەکە مسۆگەر دەکات.`;
  });

  copyText(): void {
    const text = this.generatedMethodologyParagraph();
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.showSuccess('کۆپی کرا', 'دەقی میتۆدۆلۆژیای نموونە خرایە ناو کلیپبۆردەوە.');
    });
  }

  insertIntoActiveChapter(): void {
    const ch = this.activeChapter();
    if (!ch) {
      this.toastService.showWarning('زیادکردن', 'تکایە سەرەتا بەشێک لە سەرنووسەردا هەڵبژێرە.');
      return;
    }

    const current = (ch.content || '').trim();
    const snippet = `\n\n### قەبارەی نموونەی توێژینەوە (Sample Size):\n${this.generatedMethodologyParagraph()}\n`;
    const updated = current ? `${current}${snippet}` : snippet.trim();

    this.editorService.updateChapterContent(ch.id, updated, 'زیادکردنی قەبارەی نموونە');
    this.toastService.showSuccess('سەرکەوتوو بوو', `دەقی میتۆدۆلۆژیا بۆ بەشی «${ch.title}» زیاد کرا.`);
  }
}
