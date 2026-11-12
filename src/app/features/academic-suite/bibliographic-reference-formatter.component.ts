import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import {
  parseRawBibliographicText,
  formatBibliographicStandards,
  FormattedReferenceResult
} from '../../helpers/raw-bibliographic-parser';

@Component({
  selector: 'app-bibliographic-reference-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">menu_book</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>داڕێژەری ئۆتۆماتیکی سەرچاوەکان (Auto Reference Formatter)</span>
              <span class="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded font-mono">
                Harvard & APA 7th
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              نووسین یان لکاندنی دەقی خاوی سەرچاوە و گۆڕینی ڕاستەوخۆ بۆ ستانداردە فەرمییە ئەکادیمییەکان
            </p>
          </div>
        </div>

        <!-- Format Selector Tabs -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          @for (style of ['apa7', 'harvard', 'chicago', 'mla9']; track style) {
            <button
              type="button"
              (click)="selectedStandard.set(style)"
              [class]="selectedStandard() === style ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer font-mono uppercase">
              {{ style === 'apa7' ? 'APA 7th' : (style === 'mla9' ? 'MLA 9th' : style) }}
            </button>
          }
        </div>
      </div>

      <!-- Raw Text Input Area -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-300">
          دەقی خاوی سەرچاوەکە لێرە بنووسە یان بیلکێنە (Paste Raw Citation Text):
        </label>
        <div class="relative">
          <textarea
            [(ngModel)]="rawInputText"
            (ngModelChange)="onRawInputChange($event)"
            rows="3"
            placeholder="نموونەی کوردی: د. ئازاد کەریم (٢٠٢٢) مێژووی کورد لە بەڵگەنامە عوسمانییەکاندا، زانکۆی سەلاحەدین، ل ٤٥-٦٠&#10;نموونەی بیانی: Smith, J., 2021, AI Ethics in Research, Oxford University Press, pp. 110-125"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-serif leading-relaxed"></textarea>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>کۆما، کەوانە، یان خاڵبەندی بە شێوەی خۆکار لە دەقەکە جیادەکرێتەوە.</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="loadSampleKurdish()"
              class="text-teal-400 hover:underline cursor-pointer">
              نموونەی کوردی
            </button>
            <span>•</span>
            <button
              type="button"
              (click)="loadSampleEnglish()"
              class="text-cyan-400 hover:underline cursor-pointer">
              نموونەی ئینگلیزی
            </button>
          </div>
        </div>
      </div>

      <!-- Formatted Output & Extracted Fields Preview -->
      @if (currentResult(); as res) {
        <div class="bg-slate-950 border border-teal-900/60 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-teal-300">سەرچاوەی دارێژراو بە ستانداردی:</span>
              <span class="px-2 py-0.5 bg-teal-950 text-teal-300 rounded font-mono text-xs border border-teal-800 uppercase">
                {{ selectedStandard() }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="copyFormattedText(res)"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">content_copy</mat-icon>
                <span>کۆپیکردن</span>
              </button>

              <button
                type="button"
                (click)="insertInTextCitation(res)"
                [disabled]="!activeChapter()"
                class="px-2.5 py-1 bg-slate-800 hover:bg-teal-900/40 text-teal-300 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">add_comment</mat-icon>
                <span>دانانی ئاماژەی دەق</span>
              </button>

              <button
                type="button"
                (click)="appendToBibliography(res)"
                [disabled]="!activeChapter()"
                class="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">playlist_add</mat-icon>
                <span>زیادکردن بۆ سەرچاوەکان</span>
              </button>
            </div>
          </div>

          <!-- Primary Formatted Reference Text -->
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-100 font-serif leading-relaxed" dir="ltr">
            {{ getFormattedText(res) }}
          </div>

          <!-- In-Text Citation Formats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 space-y-1">
              <span class="text-[10px] text-slate-400 block font-mono">ئاماژەی ناو دەق (In-text Harvard / APA):</span>
              <code class="text-teal-300 font-mono text-xs block" dir="ltr">
                {{ selectedStandard() === 'harvard' ? res.inTextHarvard : res.inTextApa }}
              </code>
            </div>

            <div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 space-y-1">
              <span class="text-[10px] text-slate-400 block font-mono">شێوازی ئاماژەی کوردی:</span>
              <code class="text-emerald-300 font-serif text-xs block" dir="rtl">
                {{ res.inTextKurdish }}
              </code>
            </div>
          </div>

          <!-- Extracted Breakdown Badge Matrix -->
          <div class="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
            <span class="font-bold text-slate-300">توخمە دەرهێنراوەکان:</span>
            <span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">نووسەر: {{ res.parsed.authors.join('، ') }}</span>
            <span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">ساڵ: {{ res.parsed.year }}</span>
            <span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">جۆر: {{ res.parsed.sourceType }}</span>
            @if (res.parsed.pages) {
              <span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">لاپەڕە: {{ res.parsed.pages }}</span>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class BibliographicReferenceFormatterComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  rawInputText = '';
  selectedStandard = signal<string>('apa7');
  currentResult = signal<FormattedReferenceResult | null>(null);

  onRawInputChange(text: string): void {
    if (!text.trim()) {
      this.currentResult.set(null);
      return;
    }
    const parsed = parseRawBibliographicText(text);
    const formatted = formatBibliographicStandards(parsed);
    this.currentResult.set(formatted);
  }

  loadSampleKurdish(): void {
    this.rawInputText = 'د. ئازاد کەریم (٢٠٢٢) مێژووی کورد لە بەڵگەنامە عوسمانییەکاندا، زانکۆی سەلاحەدین، هەولێر، ل ٤٥-٦٠';
    this.onRawInputChange(this.rawInputText);
  }

  loadSampleEnglish(): void {
    this.rawInputText = 'Smith, J. and Johnson, R. (2021). Artificial Intelligence in Higher Education. Cambridge University Press, London, pp. 110-125.';
    this.onRawInputChange(this.rawInputText);
  }

  getFormattedText(res: FormattedReferenceResult): string {
    const std = this.selectedStandard();
    if (std === 'harvard') return res.harvard;
    if (std === 'chicago') return res.chicago;
    if (std === 'mla9') return res.mla9;
    return res.apa7;
  }

  copyFormattedText(res: FormattedReferenceResult): void {
    const text = this.getFormattedText(res);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.toastService.showSuccess('کۆپی کرا', 'سەرچاوە دارێژراوەکە لە کلیپبۆرد کۆپی کرا.');
    }
  }

  insertInTextCitation(res: FormattedReferenceResult): void {
    const ch = this.activeChapter();
    if (!ch) return;
    const current = (ch.content || '').trim();
    const inText = res.parsed.language === 'kurdish' ? res.inTextKurdish : (this.selectedStandard() === 'harvard' ? res.inTextHarvard : res.inTextApa);
    const updated = current ? `${current} ${inText}` : inText;
    this.editorService.updateChapterContent(ch.id, updated, 'دانانی ئاماژەی سەرچاوە');
    this.toastService.showSuccess('ئاماژە دانرا', `ئاماژەی «${inText}» لەناو دەقی بەشەکە دانرا.`);
  }

  appendToBibliography(res: FormattedReferenceResult): void {
    const ch = this.activeChapter();
    if (!ch) return;
    const current = (ch.content || '').trim();
    const entry = this.getFormattedText(res);
    const updated = current ? `${current}\n\n- ${entry}` : `- ${entry}`;
    this.editorService.updateChapterContent(ch.id, updated, 'زیادکردنی سەرچاوە');
    this.toastService.showSuccess('سەرچاوە زیادکرا', 'سەرچاوەکە بە فۆرماتی ستاندارد بۆ کۆتایی بەشەکە زیاد کرا.');
  }
}
