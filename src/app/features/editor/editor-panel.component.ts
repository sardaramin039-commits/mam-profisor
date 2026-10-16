import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel } from '../../domain/models';
import { CitationBuilder } from '../../helpers/citation-builder';
import { SoraniSpellingCorrector } from '../../helpers/sorani-spelling';
import { detectAcademicClichesAndFlaws, executeDeepProfessorialRewrite } from '../../helpers/kurdish-academic-text-analysis';

@Component({
  selector: 'app-editor-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full">
      <!-- Chapters Sidebar / Drawer -->
      <div class="w-full lg:w-80 flex flex-col border-b lg:border-b-0 lg:border-l border-slate-800 bg-slate-950/60 shrink-0">
        <!-- Sidebar Header -->
        <div class="flex items-center justify-between p-3.5 bg-slate-800/80 border-b border-slate-750 backdrop-blur-md">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <mat-icon class="text-lg">menu_book</mat-icon>
            </div>
            <div>
              <h3 class="text-xs font-bold text-slate-100 font-serif">بەشەکانی نامەی ماستەر</h3>
              <p class="text-[10px] text-slate-400 font-mono">{{ chapters().length }} بەش تۆمارکراوە</p>
            </div>
          </div>

          <!-- Mobile / Tablet Drawer Accordion Toggle Button (< 1024px) -->
          <button 
            type="button"
            (click)="toggleChapterDrawer()"
            class="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
            title="کردنەوە یان داخستنی لیستی بەشەکان">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">{{ isDrawerOpenMobile() ? 'expand_less' : 'list_alt' }}</mat-icon>
            <span>لیستی بەشەکان و تەوەرەکان</span>
          </button>
        </div>

        <!-- Chapters List Body -->
        <div [class.hidden]="!isDrawerOpenMobile()" class="lg:!block flex-1 overflow-y-auto p-3 space-y-1.5 max-h-72 lg:max-h-none">
          @for (chapter of chapters(); track chapter.id) {
            <div 
              tabindex="0"
              role="button"
              (click)="selectChapter(chapter.id)"
              (keyup.enter)="selectChapter(chapter.id)"
              [class]="selectedChapterId() === chapter.id 
                ? 'p-3 bg-emerald-950/50 border-2 border-emerald-500/80 rounded-xl cursor-pointer transition-all shadow-sm'
                : 'p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl cursor-pointer hover:border-slate-600 transition-all'">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-slate-200 font-serif truncate">{{ chapter.title }}</span>
                <span class="text-[10px] text-emerald-400 font-mono shrink-0">{{ chapter.wordCount || 0 }} وشە</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Main Manuscript Editor (Takes 100% full width on mobile & desktop) -->
      <div class="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden w-full">
        @if (activeChapter(); as ch) {
          <!-- Manuscript Toolbar (Horizontally scrollable without clipping) -->
          <div class="flex items-center justify-between p-2.5 bg-slate-850 border-b border-slate-800 gap-2 overflow-x-auto whitespace-nowrap mam-toolbar-scroll select-none">
            <div class="flex items-center gap-1.5 font-serif text-xs shrink-0">
              <span class="text-slate-400 font-bold ml-1 text-[11px]">دەستنووس:</span>
              <button type="button" (click)="insertFormatting('**', '**')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-extrabold cursor-pointer text-xs" title="تۆخ (Bold)">B</button>
              <button type="button" (click)="insertFormatting('*', '*')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded italic cursor-pointer text-xs" title="لار (Italic)">I</button>
              <button type="button" (click)="insertHeading(1)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-bold cursor-pointer text-xs" title="سەردێڕی سەرەکی (H1)">H1</button>
              <button type="button" (click)="insertHeading(2)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-bold cursor-pointer text-xs" title="سەردێڕی دووەم (H2)">H2</button>
              <button type="button" (click)="insertHeading(3)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-bold cursor-pointer text-xs" title="سەردێڕی سێیەم (H3)">H3</button>
              <button type="button" (click)="insertTable()" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded cursor-pointer text-xs flex items-center gap-1" title="خشتەی ئاماری زانستی">
                <mat-icon class="!text-xs !w-3.5 !h-3.5 text-amber-400">table_chart</mat-icon>
                <span>خشتە</span>
              </button>

              <div class="h-4 w-px bg-slate-700 mx-1"></div>

              <!-- Dual Citation System Tools -->
              <span class="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">format_quote</mat-icon>
                ژێدەر:
              </span>

              <!-- Footnote Button -->
              <button 
                type="button" 
                (click)="insertFootnote()" 
                class="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="دانانی پەراوێزی خوارەوەی لاپەڕە بە ژمارەی کوردی [١]">
                <span class="font-bold font-mono">[١]</span>
                <span>پەراوێز</span>
              </button>

              <!-- Explanatory Footnote Button -->
              <button 
                type="button" 
                (click)="insertExplanatoryNote()" 
                class="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="دانانی پەراوێزی ڕوونکردنەوە و ساغکردنەوە">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">info</mat-icon>
                <span>ساغکردنەوە</span>
              </button>

              <!-- In-Text APA Citation Button -->
              <button 
                type="button" 
                (click)="insertInTextCitation()" 
                class="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="دانانی سەرچاوەی ناو دەق (نازناو، ساڵ: لاپەڕە)">
                <span class="font-mono text-[10.5px]">(نووسەر، ساڵ: ل)</span>
              </button>

              <div class="h-4 w-px bg-slate-700 mx-1"></div>

              <!-- University Quotation Modes -->
              <span class="text-purple-400 font-bold text-[11px] flex items-center gap-1">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">receipt_long</mat-icon>
                وەرگرتن:
              </span>
              <button 
                type="button" 
                (click)="insertShortQuote()" 
                class="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="وەرگرتنی دەقاودەقی کورت (< ٤٠ وشە) بە کەوانەی «...» و ژمارەی لاپەڕە">
                <span>«کورت»</span>
              </button>
              <button 
                type="button" 
                (click)="insertBlockQuote()" 
                class="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="وەرگرتنی دەقاودەقی درێژ (> ٤٠ وشە) بە شێوازی Blockquote بێ کەوانە">
                <span>بلۆک</span>
              </button>
              <button 
                type="button" 
                (click)="insertParaphrase()" 
                class="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded cursor-pointer text-xs flex items-center gap-1"
                title="داڕشتنەوەی زانستی بە زمانی توێژەر لەگەڵ ساغکردنەوەی لاپەڕە">
                <span>داڕشتنەوە</span>
              </button>

              <div class="h-4 w-px bg-slate-700 mx-1"></div>

              <!-- 1-Click Deep Professorial Rewrite Button -->
              <button 
                type="button" 
                (click)="deepProfessorialRewrite()" 
                class="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-lg cursor-pointer text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                title="داڕشتنەوەی ئەکادیمیی قووڵ: پاککردنەوە لە دەستپێکی ڕۆژنامەوانی، کڵیشە، گشتاندنی بێ بەڵگە و هەڵەی ڕێنووسی سۆرانی">
                <mat-icon class="!text-xs !w-3.5 !h-3.5 text-stone-950">auto_fix_high</mat-icon>
                <span>داڕشتنەوەی ئەکادیمیی قووڵ</span>
              </button>
            </div>

            <div class="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
              <span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-emerald-400 font-bold">{{ ch.wordCount || 0 }} وشە</span>
            </div>
          </div>

          <!-- Real-Time Anti-Cliché & Orthography Alert Banner -->
          @if (clicheReport().hasCliche || orthographyIssues().length > 0) {
            <div class="bg-amber-950/40 border-b border-amber-900/60 px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-serif text-amber-200">
              <div class="flex items-center gap-2 flex-wrap">
                <mat-icon class="!text-sm !w-4 !h-4 text-amber-400">warning</mat-icon>
                <span><strong>پشکنینی گوتاری ئەکادیمی:</strong></span>
                @if (clicheReport().clichesCount > 0) {
                  <span class="bg-rose-950/80 border border-rose-800/80 text-rose-300 px-2 py-0.5 rounded-full text-[11px]">
                    {{ clicheReport().clichesCount }} دەستپێکی وتاری/کڵیشە
                  </span>
                }
                @if (clicheReport().generalizationsCount > 0) {
                  <span class="bg-amber-950/80 border border-amber-800/80 text-amber-300 px-2 py-0.5 rounded-full text-[11px]">
                    {{ clicheReport().generalizationsCount }} گشتاندنی بێ بەڵگە
                  </span>
                }
                @if (orthographyIssues().length > 0) {
                  <span class="bg-blue-950/80 border border-blue-800/80 text-blue-300 px-2 py-0.5 rounded-full text-[11px]">
                    {{ orthographyIssues().length }} هەڵەی ڕێنووس
                  </span>
                }
              </div>
              <button 
                type="button" 
                (click)="deepProfessorialRewrite()" 
                class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold rounded cursor-pointer transition">
                چاکسازیی ڕاستەوخۆ
              </button>
            </div>
          }

          <!-- Editor Textarea Area (100% full width with comfortable reading padding) -->
          <div class="flex-1 p-4 md:p-6 overflow-y-auto w-full">
            <textarea
              #manuscriptArea
              [value]="ch.content || ''"
              (input)="onContentInput(ch.id, manuscriptArea.value)"
              placeholder="دەقی ئەم بەشەی نامەی ماستەر لێرە بنووسە یان دەستکاری بکە..."
              class="w-full h-full min-h-[420px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 md:p-6 text-slate-100 font-serif text-sm md:text-base leading-[2.2] focus:outline-none focus:border-emerald-500 shadow-inner resize-y"
            ></textarea>
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center flex-1 p-8 text-center text-slate-500 space-y-2">
            <mat-icon class="!text-4xl !w-10 !h-10 text-slate-600">edit_note</mat-icon>
            <p class="text-xs font-serif">بەشێک لە لیستەکەوە دیاری بکە بۆ دەستکاریکردن و نووسینی دەستنووس.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class EditorFeatureComponent {
  chapters = input<ChapterItemModel[]>([]);
  selectedChapterId = input<number | null>(null);
  selectChapterRequested = output<number>();
  contentChanged = output<{ id: number; content: string }>();

  readonly isDrawerOpenMobile = signal(false);

  readonly activeChapter = computed(() => {
    const list = this.chapters();
    const id = this.selectedChapterId();
    if (id !== null) {
      const found = list.find(c => c.id === id);
      if (found) return found;
    }
    return list[0] || null;
  });

  toggleChapterDrawer() {
    this.isDrawerOpenMobile.update(open => !open);
  }

  selectChapter(id: number) {
    this.selectChapterRequested.emit(id);
    this.isDrawerOpenMobile.set(false);
  }

  onContentInput(id: number, content: string) {
    this.contentChanged.emit({ id, content });
  }

  insertFormatting(prefix: string, suffix: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const text = textarea.value;
    const selected = text.substring(start, end) || 'دەقی نموونە';
    textarea.value = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = start + prefix.length + selected.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  insertHeading(level: number) {
    const prefix = '\n' + '#'.repeat(level) + ' ';
    this.insertFormatting(prefix, '\n');
  }

  insertTable() {
    const tableSnippet = `\n| پێوەر | ژمارە (N) | ڕێژە (٪) | ناوەند (Mean) | لادان (SD) |\n| :--- | :---: | :---: | :---: | :---: |\n| نموونەی ١ | ٥٠ | ٪٥٠.٠ | ٤.٢٥ | ٠.٦٥ |\n| نموونەی ٢ | ٥٠ | ٪٥٠.٠ | ٤.٥٠ | ٠.٤٥ |\n`;
    this.insertRawTextAtCursor(tableSnippet);
  }

  insertFootnote() {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const text = textarea.value || '';
    const nextNum = this.getNextFootnoteNumber(text);
    const kurdishNum = this.toKurdishNumeral(nextNum);
    const marker = `[${kurdishNum}]`;

    // Insert marker at cursor
    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const footnoteEntry = `\n[${kurdishNum}] ناوی نووسەر، ناونیشانی سەرچاوە، شوێنی چاپ: خانەی چاپ، ٢٠٢٤، ل. ١٥.`;
    const updatedContent = this.appendFootnoteToBottom(before + marker + after, footnoteEntry);
    textarea.value = updatedContent;
    textarea.selectionStart = start + marker.length;
    textarea.selectionEnd = start + marker.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  insertExplanatoryNote() {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const text = textarea.value || '';
    const nextNum = this.getNextFootnoteNumber(text);
    const kurdishNum = this.toKurdishNumeral(nextNum);
    const marker = `[${kurdishNum}]`;

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const noteEntry = `\n[${kurdishNum}] تێبینیی ڕوونکردنەوە و ساغکردنەوە: لێرەدا دەستەواژەکە بە واتا زانستییە هاوچەرخەکەی بەکارهاتووە بۆ ڕوونکردنەوەی زیاتر.`;
    const updatedContent = this.appendFootnoteToBottom(before + marker + after, noteEntry);
    textarea.value = updatedContent;
    textarea.selectionStart = start + marker.length;
    textarea.selectionEnd = start + marker.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  insertInTextCitation() {
    const snippet = ' (نازناوی نووسەر، ٢٠٢٤: ٤٥) ';
    this.insertRawTextAtCursor(snippet);
  }

  private insertRawTextAtCursor(snippet: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    textarea.value = textarea.value.substring(0, start) + snippet + textarea.value.substring(start);
    textarea.selectionStart = start + snippet.length;
    textarea.selectionEnd = start + snippet.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  private getNextFootnoteNumber(content: string): number {
    const matches = content.match(/\[([\u0660-\u0669\d]+)\]/g) || [];
    if (matches.length === 0) return 1;
    let max = 0;
    for (const m of matches) {
      const raw = m.replace(/[\[\]]/g, '').trim();
      const western = raw.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
      const num = parseInt(western, 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return max + 1;
  }

  private toKurdishNumeral(num: number): string {
    const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/\d/g, d => digits[parseInt(d, 10)]);
  }

  readonly clicheReport = computed(() => detectAcademicClichesAndFlaws(this.activeChapter()?.content || ''));
  readonly orthographyIssues = computed(() => SoraniSpellingCorrector.detectOrthographyIssues(this.activeChapter()?.content || ''));

  insertShortQuote() {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const selected = textarea ? textarea.value.substring(textarea.selectionStart || 0, textarea.selectionEnd || 0) : '';
    const quoteText = selected.trim() || 'دەقی وەرگیراوی دەقاودەقی کورت';
    const snippet = ` ${CitationBuilder.formatShortDirectQuote(quoteText, 'نازناو', 2024, 34)} `;
    this.insertRawTextAtCursor(snippet);
  }

  insertBlockQuote() {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const selected = textarea ? textarea.value.substring(textarea.selectionStart || 0, textarea.selectionEnd || 0) : '';
    const quoteText = selected.trim() || 'دەقی وەرگرتنی درێژ کە قەبارەکەی زیاترە لە ٤٠ وشە یان ٣ دێڕ، بە بلۆککوۆت دەردەکەوێت.';
    const snippet = CitationBuilder.formatBlockQuote(quoteText, 'نازناو', 2024, 88);
    this.insertRawTextAtCursor(snippet);
  }

  insertParaphrase() {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const selected = textarea ? textarea.value.substring(textarea.selectionStart || 0, textarea.selectionEnd || 0) : '';
    const paraText = selected.trim() || 'دەقی داڕێژراوەی بەمانا بە پێگەی ڕەخنەیی توێژەر';
    const snippet = ` ${CitationBuilder.formatParaphrase(paraText, 'نازناو', 2024, 115)} `;
    this.insertRawTextAtCursor(snippet);
  }

  deepProfessorialRewrite() {
    const active = this.activeChapter();
    if (!active) return;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const hasSelection = end > start;

    if (hasSelection) {
      const selectedText = textarea.value.substring(start, end);
      const academicRewritten = executeDeepProfessorialRewrite(selectedText);
      const spelledCorrectly = SoraniSpellingCorrector.fixSoraniText(academicRewritten);

      const updated = textarea.value.substring(0, start) + spelledCorrectly + textarea.value.substring(end);
      textarea.value = updated;
      textarea.selectionStart = start;
      textarea.selectionEnd = start + spelledCorrectly.length;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      this.contentChanged.emit({ id: active.id, content: updated });
    } else {
      const currentContent = active.content || textarea.value || '';
      const academicRewritten = executeDeepProfessorialRewrite(currentContent);
      const spelledCorrectly = SoraniSpellingCorrector.fixSoraniText(academicRewritten);

      textarea.value = spelledCorrectly;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      this.contentChanged.emit({ id: active.id, content: spelledCorrectly });
    }
  }

  private appendFootnoteToBottom(content: string, footnoteLine: string): string {
    if (content.includes('--- پەراوێزەکان ---')) {
      return content + '\n' + footnoteLine.trim();
    }
    return content.trimEnd() + '\n\n--- پەراوێزەکان ---\n' + footnoteLine.trim();
  }
}

