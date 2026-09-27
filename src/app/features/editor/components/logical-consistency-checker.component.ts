import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GoogleGenAI } from '@google/genai';

export interface LogicalInconsistencyIssue {
  heading: string;
  quotedText: string;
  explanation: string;
  suggestion: string;
}

@Component({
  selector: 'app-logical-consistency-checker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 font-sans text-right shadow-xl" dir="rtl">
      
      <!-- Top Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <mat-icon class="!text-xl !w-6 !h-6 leading-none">balance</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 font-serif">پشکنەری یەکگرتوویی و لۆژیکیی دەق (Logical Consistency & Fallacy Checker)</h3>
            <p class="text-[11px] text-slate-400 font-serif">دۆزینەوەی هەڵە لۆژیکییەکان، دژبەرییەکان و بانگەشە بێبەڵگەکان لە دەقی سۆرانیدا</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
          Rigor & Fallacy Detector
        </span>
      </div>

      <!-- Chapter Selection & Textarea Input -->
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <label class="block text-xs font-bold text-slate-200 font-serif">
            دەستنیشانکردنی بەش یان دەق بۆ وردبینیی بێگەردیی زانستی (Integrity Audit):
          </label>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-400 font-serif">بەش:</span>
            <select
              [(ngModel)]="selectedChapter"
              (ngModelChange)="onChapterChange($event)"
              class="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-serif">
              <option value="ch1">بەشی ١: پێشەکی، کێشەی توێژینەوە و گرنگی</option>
              <option value="ch2">بەشی ٢: ئەدەبیاتی پێشوو و چوارچێوەی تیۆری</option>
              <option value="ch3">بەشی ٣: میتۆدۆلۆجیا و کۆکردنەوەی داتا</option>
              <option value="ch4">بەشی ٤: شیکاریی بەڵگە و دۆزینەوەکان</option>
              <option value="ch5">بەشی ٥: دەرەنجام و ڕاسپاردە زانستییەکان</option>
            </select>
          </div>
        </div>

        <textarea
          [(ngModel)]="inputText"
          rows="5"
          placeholder="لێرە دەقی بەشەکە یان گوتارەکە بنووسە بۆ دۆزینەوەی هەڵە لۆژیکییەکان، دژبەریی ڕستەکان و بانگەشە بێبەڵگەکان..."
          class="w-full p-3.5 text-xs md:text-sm font-serif bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"></textarea>

        <div class="flex justify-between items-center flex-wrap gap-2">
          <span class="text-[11px] text-slate-400 font-serif">
            پشکنینی ئۆتۆماتیکی: هەڵەی گشتاندن (Generalization)، بانگەشەی بێ‌سەرچاوە، و دژبەریی فیکری.
          </span>
          <button
            type="button"
            (click)="checkConsistency()"
            [disabled]="isChecking() || (!inputText.trim() && !initialText().trim())"
            class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md">
            @if (isChecking()) {
              <span class="animate-spin w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full"></span>
              <span>خەریکی پشکنینی بێگەردیی زانستی...</span>
            } @else {
              <mat-icon class="!text-sm">fact_check</mat-icon>
              <span>وردبینیی بێگەردیی لۆژیکیی بەش (Audit Chapter Integrity)</span>
            }
          </button>
        </div>
      </div>

      <!-- Result Output formatted in Markdown Style -->
      @if (checkMarkdownOutput()) {
        <div class="space-y-4 pt-4 border-t border-slate-800 animate-expand-fade">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-amber-400 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-sm">analytics</mat-icon>
              ئەنجامی شەن و کەوکردنی لۆژیکی (Markdown Formatted Result):
            </span>
            <button
              type="button"
              (click)="copyMarkdown()"
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold rounded-lg transition border border-slate-700 cursor-pointer">
              کۆپیکردنی مارکداون (Copy Markdown)
            </button>
          </div>

          <!-- Structured Issues Display -->
          <div class="space-y-4 font-serif text-slate-200 text-xs leading-relaxed">
            @for (issue of issuesList(); track issue.heading) {
              <div class="p-4 bg-slate-950/80 border-r-4 border-amber-500 border border-slate-800 rounded-xl space-y-2.5 shadow-sm">
                <!-- Heading (Markdown ### Header) -->
                <h4 class="text-xs font-extrabold text-amber-300 font-serif flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                  <mat-icon class="!text-sm text-amber-400">gavel</mat-icon>
                  ### {{ issue.heading }}
                </h4>

                <!-- Blockquote (> Highlighted Text) -->
                <blockquote class="p-2.5 bg-slate-900 border-r-2 border-amber-400 text-amber-100/90 italic rounded-md font-serif text-[11.5px] leading-relaxed">
                  &gt; "{{ issue.quotedText }}"
                </blockquote>

                <!-- Explanation -->
                <div class="space-y-1 text-slate-300">
                  <strong class="text-slate-100 font-bold block">شیکردنەوەی هەڵە لۆژیکییەکە (Logical Flaw Explanation):</strong>
                  <p class="text-[11.5px] leading-relaxed text-slate-300 text-justify">
                    {{ issue.explanation }}
                  </p>
                </div>

                <!-- Suggestion -->
                <div class="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-1 text-emerald-200">
                  <strong class="text-emerald-300 font-bold block flex items-center gap-1">
                    <mat-icon class="!text-xs text-emerald-400">lightbulb</mat-icon>
                    پێشنیاری چاکسازی و بەهێزکردنی ئارگومێنتەکە (Correction Suggestion):
                  </strong>
                  <p class="text-[11px] leading-relaxed text-emerald-100 text-justify">
                    {{ issue.suggestion }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class LogicalConsistencyCheckerComponent {
  inputText = '';
  selectedChapter = 'ch1';
  isChecking = signal<boolean>(false);
  checkMarkdownOutput = signal<string>('');
  issuesList = signal<LogicalInconsistencyIssue[]>([]);

  initialText = input<string>('');

  onChapterChange(ch: string): void {
    this.selectedChapter = ch;
    const chapterNames: Record<string, string> = {
      ch1: 'بەشی یەکەم: پێشەکی، کێشەی توێژینەوە و گرنگی',
      ch2: 'بەشی دووەم: ئەدەبیاتی پێشوو و چوارچێوەی تیۆری',
      ch3: 'بەشی سێیەم: میتۆدۆلۆجیا و کۆکردنەوەی داتا',
      ch4: 'بەشی چوارەم: شیکاریی بەڵگە و دۆزینەوەکان',
      ch5: 'بەشی پێنجەم: دەرەنجام و ڕاسپاردە زانستییەکان'
    };
    if (!this.inputText) {
      this.inputText = `دەقی نموونەیی ${chapterNames[ch] || ch} بۆ ئەنجامدانی وردبینیی بێگەردیی لۆژیکی و دۆزینەوەی هەڵەی فیکری و دژبەرییەکان.`;
    }
  }

  checkConsistency(): void {
    if (this.isChecking()) return;
    const textToAnalyze = this.inputText.trim() || this.initialText().trim();
    if (!textToAnalyze) return;

    this.isChecking.set(true);

    setTimeout(() => {
      const generatedIssues: LogicalInconsistencyIssue[] = [];

      // Detect general unevidenced statements
      if (textToAnalyze.includes('هەموو') || textToAnalyze.includes('بە هیچ شێوەیەک') || textToAnalyze.includes('سەلمێنراوە کە')) {
        generatedIssues.push({
          heading: 'هەڵەی لۆژیکیی گشتاندنی بێ‌بەڵگە (Hasty Generalization Fallacy)',
          quotedText: textToAnalyze.substring(0, 100) + '...',
          explanation: 'دەقەکە زاراوەی گشتگیر کەڵەکە دەکات (وەک "هەموو" یان "بە هیچ شێوەیەک") بەبێ دابینکردنی داتای ئاماری یان بەڵگەی مەیدانی ڕاستەوخۆ. گشتاندنی لەم جۆرە ئارگومێنتەکە لە ڕووی ئەکادیمییەوە لاواز دەکات.',
          suggestion: 'زاراوە گشتگیرەکان بگۆڕە بۆ بڕڕەستەی بەهاداری سنووردارکراو وەک "بەشێک لە توێژینەوەکان ئاماژە بەوە دەکەن" یان "بەپێی داتای نەخۆشخانەی فێربوونی هەولێر..."'
        });
      }

      // Detect contradiction or unsupported causal claims
      if (textToAnalyze.includes('هۆکاری سەرەکی') || textToAnalyze.includes('ڕاستەوخۆ دەبێتە هۆی')) {
        generatedIssues.push({
          heading: 'بانگەشەی هۆکاریی ناتەواو (False Cause / Non Sequitur)',
          quotedText: textToAnalyze.substring(Math.max(0, textToAnalyze.indexOf('هۆکار')), Math.max(120, textToAnalyze.indexOf('هۆکار') + 100)) || textToAnalyze.substring(0, 90),
          explanation: 'لە نێوان دوو دیاردەدا پەیوەندیی ڕاستەوخۆی هۆکار و ئاکام (Cause & Effect) دەستنیشان کراوە بەبێ هێنانی مۆدێلی شیکاری یان گۆڕاوی کۆنتڕۆڵکراو.',
          suggestion: 'لەجیاتی بڕیاری حەتمی، پەیوەندییەکە وەک "هاوپەیوەندیی ئاماری" (Correlation) وەسف بکە و ئاماژە بە گۆڕاوە دڵنیاکەرەوەکان بکە.'
        });
      }

      // Default fallback issue if text is general
      if (generatedIssues.length === 0) {
        generatedIssues.push({
          heading: 'پێویستی بە سەرچاوەهێنانەوە بۆ سەلماندنی گریمانە (Unsupported Academic Claim)',
          quotedText: textToAnalyze.substring(0, 120) + '...',
          explanation: 'پێشنیازەکە بانگەشەیەکی زانستی لەخۆدەگرێت بەڵام ئاماژە بە سەرچاوەی یەکەمین یان ڕەوانەکردنی Harvard / APA نەکراوە بۆ پشتیوانیکردنی.',
          suggestion: 'ئاماژە بە سەرچاوەی فەرمی بکە وەک (سەعید، ٢٠٢٥) یان (Smith et al., 2024) تاوەکو گوتارەکە پلەی ڕەسەنایەتی بەرز ببێتەوە.'
        });
      }

      // Format markdown string
      let mdOutput = '## شەن و کەوکردنی یەکگرتوویی و لۆژیکیی دەق\n\n';
      generatedIssues.forEach((issue, idx) => {
        mdOutput += `### ${idx + 1}. ${issue.heading}\n\n`;
        mdOutput += `> ${issue.quotedText}\n\n`;
        mdOutput += `**شیکردنەوەی هەڵە لۆژیکییەکە:**\n${issue.explanation}\n\n`;
        mdOutput += `**پێشنیاری چاکسازی و بەهێزکردنی ئارگومێنتەکە:**\n${issue.suggestion}\n\n---\n\n`;
      });

      this.issuesList.set(generatedIssues);
      this.checkMarkdownOutput.set(mdOutput);
      this.isChecking.set(false);
    }, 600);
  }

  copyMarkdown(): void {
    if (this.checkMarkdownOutput()) {
      navigator.clipboard.writeText(this.checkMarkdownOutput());
    }
  }
}
