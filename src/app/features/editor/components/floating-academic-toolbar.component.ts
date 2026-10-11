import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export type CitationStyle = 'APA' | 'MLA' | 'HARVARD' | 'CHICAGO' | 'LC_APA';

export interface MarkupOption {
  id: string;
  label: string;
  kurdishLabel: string;
  icon: string;
  category: 'citation' | 'structure' | 'evidence' | 'notation';
  snippet: string;
  description: string;
}

@Component({
  selector: 'app-floating-academic-toolbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside 
      aria-label="Academic Formatting & Citation Toolbar"
      class="floating-academic-toolbar z-40 transition-all duration-300 font-sans text-right"
      [class.opacity-95]="isExpanded()"
      dir="rtl">
      
      <!-- Collapsed Floating Pill Trigger -->
      @if (!isExpanded()) {
        <div class="flex items-center gap-2 bg-stone-900/95 text-stone-100 p-2 pl-3 rounded-full border border-amber-500/40 shadow-2xl backdrop-blur-md hover:border-amber-400 transition-all cursor-pointer select-none"
             (click)="toggleExpanded()"
             title="کردنەوەی شریتی ئامرازی سەرچاوەدانان و مارکئەپی ئەکادیمی">
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-stone-950 flex items-center justify-center font-bold shadow-sm">
            <mat-icon class="!text-sm !w-4 !h-4">menu_book</mat-icon>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-serif font-bold">
            <span class="text-amber-300">ئامرازی ئەکادیمی:</span>
            <span class="bg-stone-800 text-stone-200 px-2 py-0.5 rounded text-[10px] font-mono border border-stone-700">{{ activeStyle() }}</span>
          </div>
          <mat-icon class="!text-sm text-stone-400 mr-1">unfold_more</mat-icon>
        </div>
      } @else {
        <!-- Expanded Floating Toolbar Dock -->
        <div class="bg-stone-900/95 text-stone-100 rounded-2xl border border-stone-700/80 shadow-2xl p-4 backdrop-blur-xl w-full max-w-2xl space-y-3.5 transition-all">
          
          <!-- Header Row -->
          <div class="flex items-center justify-between border-b border-stone-800 pb-2.5 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-extrabold shadow-sm">
                <mat-icon class="!text-sm !w-4 !h-4">format_quote</mat-icon>
              </div>
              <div>
                <h4 class="text-xs font-serif font-bold text-white flex items-center gap-2">
                  شریتی ئەکادیمیی سەرچاوەدانان و مارکئەپ
                  <span class="text-[9.5px] px-2 py-0.2 rounded-full font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                    {{ activeStyle() }} 7th / LC
                  </span>
                </h4>
                <p class="text-[10px] text-stone-400 font-serif">
                  دیاریکردنی شێوازی سەرچاوەدانان و تێخستنی دەستبەجێی کلیلەمیتۆدە زانستییەکان بۆ ناو سەرنووسەر
                </p>
              </div>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center gap-1.5">
              <button 
                type="button"
                (click)="toggleExpanded()"
                class="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                title="داخستن / بچووککردنەوە">
                <mat-icon class="!text-sm">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Citation Style Selector Pills -->
          <!-- Citation Style Selector Dropdown & Quick Buttons -->
          <div class="flex items-center justify-between flex-wrap gap-2 pt-0.5">
            <label for="citation-style-select" class="text-[11px] font-bold text-stone-300 font-serif flex items-center gap-1">
              <mat-icon class="!text-xs !w-3.5 !h-3.5 text-amber-400">tune</mat-icon>
              فۆرماتی فەرمیی سەرچاوەدانان (Citation Format):
            </label>

            <!-- Dropdown Menu for Citation Formats -->
            <div class="relative flex items-center">
              <select
                id="citation-style-select"
                [value]="activeStyle()"
                (change)="onStyleChange($event)"
                class="bg-stone-950 text-amber-300 border-2 border-amber-600/70 hover:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-serif font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer shadow-md pr-8">
                <option value="APA">APA 7th Edition (فۆرماتی ئەی پی ئەی)</option>
                <option value="MLA">MLA 9th Edition (فۆرماتی ئێم ئێڵ ئەی)</option>
                <option value="HARVARD">Harvard Academic (شێوازی هارڤارد)</option>
                <option value="CHICAGO">Chicago Manual of Style 17th (شیکاگۆ)</option>
                <option value="LC_APA">LC. APA (کۆنگرێسی کتێبخانەی ئەمریکی)</option>
              </select>
              <mat-icon class="absolute left-2 text-amber-400 pointer-events-none !text-xs !w-3.5 !h-3.5">arrow_drop_down</mat-icon>
            </div>
          </div>

          <!-- Quick Parameters Input Row for Citation -->
          <form [formGroup]="citationForm" class="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 text-xs">
            <div>
              <label for="cite-author" class="block text-[9.5px] font-serif text-stone-400 mb-0.5">ناوی نووسەر (Author):</label>
              <input 
                id="cite-author"
                type="text"
                formControlName="author"
                placeholder="بۆ نموونە: ئەمین، س."
                class="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-serif">
            </div>

            <div>
              <label for="cite-year" class="block text-[9.5px] font-serif text-stone-400 mb-0.5">ساڵی چاپ (Year):</label>
              <input 
                id="cite-year"
                type="text"
                formControlName="year"
                placeholder="2026"
                class="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono">
            </div>

            <div>
              <label for="cite-page" class="block text-[9.5px] font-serif text-stone-400 mb-0.5">لاپەڕە (Page):</label>
              <input 
                id="cite-page"
                type="text"
                formControlName="page"
                placeholder="45"
                class="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono">
            </div>

            <div>
              <label for="cite-title" class="block text-[9.5px] font-serif text-stone-400 mb-0.5">ناونیشانی کتێب/گۆڤار:</label>
              <input 
                id="cite-title"
                type="text"
                formControlName="title"
                placeholder="ناونیشانی لێکۆڵینەوە..."
                class="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-serif">
            </div>
          </form>

          <!-- Citation Quick Insert Buttons with Live Preview -->
          <div class="flex items-center justify-between flex-wrap gap-2 bg-stone-850/60 p-2.5 rounded-xl border border-stone-800">
            <div class="flex items-center gap-1.5 flex-wrap">
              <button 
                type="button"
                (click)="insertInTextCitation()"
                class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">add_link</mat-icon>
                <span>تێخستنی لەناو دەق (In-Text)</span>
              </button>

              <button 
                type="button"
                (click)="insertBibliographyEntry()"
                class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-stone-700 active:scale-95">
                <mat-icon class="!text-xs !w-3.5 !h-3.5 text-amber-400">library_books</mat-icon>
                <span>تێخستنی سەرچاوەنامە (Bibliography)</span>
              </button>
            </div>

            <!-- Live Sample Preview -->
            <div class="text-[10px] text-amber-300 font-mono bg-stone-950/80 px-2.5 py-1 rounded border border-amber-900/50 truncate max-w-xs"
                 [title]="previewCitationString()">
              پێشبینین: {{ previewCitationString() }}
            </div>
          </div>

          <!-- Research-Specific Markup Quick Actions Grid -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-stone-300 font-serif">
              <span class="flex items-center gap-1">
                <mat-icon class="!text-xs !w-3.5 !h-3.5 text-emerald-400">code</mat-icon>
                تێخستنی مارکئەپی تایبەتی توێژینەوە (Research Markup):
              </span>
              <span class="text-[9.5px] text-stone-400">کرتە بکە بۆ تێخستنی ڕاستەوخۆ</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              @for (item of markupItems; track item.id) {
                <button
                  type="button"
                  (click)="insertMarkup(item.snippet)"
                  [title]="item.description"
                  class="p-2 bg-stone-800/80 hover:bg-stone-750 border border-stone-700/80 hover:border-amber-500/50 rounded-xl text-right transition-all flex items-center gap-2 group cursor-pointer active:scale-95">
                  <div class="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 group-hover:text-amber-300 shrink-0">
                    <mat-icon class="!text-xs !w-3.5 !h-3.5">{{ item.icon }}</mat-icon>
                  </div>
                  <div class="min-w-0">
                    <div class="text-[10.5px] font-bold text-stone-200 group-hover:text-amber-200 truncate">
                      {{ item.kurdishLabel }}
                    </div>
                    <div class="text-[8.5px] text-stone-400 font-mono truncate">
                      {{ item.label }}
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

        </div>
      }
    </aside>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FloatingAcademicToolbarComponent {
  targetTextarea = input<HTMLTextAreaElement | null>(null);
  markupInserted = output<string>();

  isExpanded = signal<boolean>(false);
  activeStyle = signal<CitationStyle>('APA');

  citationForm = new FormGroup({
    author: new FormControl('ئەمین، س.'),
    year: new FormControl('2026'),
    page: new FormControl('45'),
    title: new FormControl('میتۆدۆلۆژیای توێژینەوەی ئەکادیمی')
  });

  previewCitationString = computed(() => {
    const a = this.citationForm.controls.author.value || 'ئەمین';
    const y = this.citationForm.controls.year.value || '2026';
    const p = this.citationForm.controls.page.value || '45';

    switch (this.activeStyle()) {
      case 'MLA':
        return `(${a} ${p})`;
      case 'HARVARD':
        return `(${a}, ${y}: ${p})`;
      case 'CHICAGO':
        return `(${a} ${y}, ${p})`;
      case 'LC_APA':
      case 'APA':
      default:
        return `(${a}، ${y}، ل. ${p})`;
    }
  });

  markupItems: MarkupOption[] = [
    {
      id: 'blockquote',
      label: 'Blockquote',
      kurdishLabel: 'دەقی وەرگیراوی درێژ',
      icon: 'format_quote',
      category: 'citation',
      snippet: `\n> «دەقی وەرگیراوی ڕاستەوخۆ بەپێی ڕێسای ئەکادیمی لە سەرچاوەی سەرەکییەوە...»\n> — (نووسەر، ساڵ، ل. لاپەڕە)\n`,
      description: 'تێخستنی بەستەری دەقی وەرگیراوی ڕاستەوخۆ (زیاتر لە ٤٠ وشە)'
    },
    {
      id: 'footnote',
      label: 'Footnote',
      kurdishLabel: 'پەراوێزی زانستی',
      icon: 'superscript',
      category: 'citation',
      snippet: `[^1]: ڕوونکردنەوەی زاراوە یان پەراوێزی سەرچاوە بەپێی ستاندارد.\n`,
      description: 'تێخستنی پەراوێزی ژمارەیی بۆ شیکردنەوەی بابەت یان زاراوە'
    },
    {
      id: 'hypothesis',
      label: 'Hypothesis (H1)',
      kurdishLabel: 'گریمانەی توێژینەوە',
      icon: 'psychology',
      category: 'structure',
      snippet: `\n**H1 [گریمانەی توێژینەوە]:** پەیوەندییەکی ئاماریی ئەرێنی و مانادار لەنێوان (گۆڕاوی سەربەخۆ) و (گۆڕاوی پاشکۆ)دا هەیە.\n`,
      description: 'تێخستنی فۆرمولەی گریمانەی یەکەم (H1)'
    },
    {
      id: 'research_question',
      label: 'Research Q (RQ)',
      kurdishLabel: 'پرسیاری زانستی',
      icon: 'help_outline',
      category: 'structure',
      snippet: `\n**RQ1 [پرسیاری توێژینەوە]:** ئایا (گۆڕاوی سەربەخۆ) چ کاریگەرییەکی لەسەر (گۆڕاوی پاشکۆ) هەیە لە کۆمەڵگەی لێکۆڵینەوەدا؟\n`,
      description: 'تێخستنی پرسیاری سەرەکیی توێژینەوە'
    },
    {
      id: 'evidence',
      label: 'Empirical Evidence',
      kurdishLabel: 'بەڵگەی مەیدانی',
      icon: 'fact_check',
      category: 'evidence',
      snippet: `\n> 📊 **بەڵگەی مەیدانی (Empirical Evidence):** بەپێی دەرئەنجامی ڕاپرسی مەیدانی [N=250، ئاستی متمانە ٪٩٥، p < 0.05]، دەرکەوت کە...\n`,
      description: 'تێخستنی چوارچێوەی بەڵگەی سەلمێنەری ئاماری یان مەیدانی'
    },
    {
      id: 'table',
      label: 'Data Table',
      kurdishLabel: 'خشتەی داتا و ئەنجام',
      icon: 'table_chart',
      category: 'structure',
      snippet: `\n| گۆڕاو | ژمارە (N) | ڕێژە (٪) | نمرەی ناوەند (Mean) | لادانی پێوەر (SD) |\n| :--- | :---: | :---: | :---: | :---: |\n| ئاستی یەکەم | ٧٥ | ٪٣٠.٠ | ٤.١٢ | ٠.٦٥ |\n| ئاستی دووەم | ١٧٥ | ٪٧٠.٠ | ٤.٤٨ | ٠.٥٢ |\n`,
      description: 'تێخستنی خشتەی ئەکادیمی بە شێوازی Markdown'
    },
    {
      id: 'equation',
      label: 'LaTeX Formula',
      kurdishLabel: 'هاوکێشەی ئاماری',
      icon: 'functions',
      category: 'notation',
      snippet: `\n$$ \\bar{x} = \\frac{1}{n}\\sum_{i=1}^n x_i \\quad \\text{و} \\quad SD = \\sqrt{\\frac{\\sum (x_i - \\bar{x})^2}{n - 1}} $$\n`,
      description: 'تێخستنی هاوکێشەی ماتماتیکی یان ئاماریی تێز'
    },
    {
      id: 'limitation',
      label: 'Limitation',
      kurdishLabel: 'سنووردارێتی توێژینەوە',
      icon: 'warning_amber',
      category: 'structure',
      snippet: `\n> ⚠️ **سنووردارێتی توێژینەوە (Methodological Limitation):** بەهۆی سنوورداری کات و قەبارەی نموونەی لێکۆڵینەوەکەوە، جێبەجێکردنی گشتاندن پێویستی بە تاقیکردنەوەی فراوانترە.\n`,
      description: 'تێخستنی بلۆکی سنووردارێتی میتۆدۆلۆژی'
    }
  ];

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  selectStyle(style: CitationStyle): void {
    this.activeStyle.set(style);
  }

  onStyleChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as CitationStyle;
    if (val) this.selectStyle(val);
  }

  insertInTextCitation(): void {
    const a = this.citationForm.controls.author.value || 'نووسەر';
    const y = this.citationForm.controls.year.value || '2026';
    const p = this.citationForm.controls.page.value || '45';

    let snippet = '';
    switch (this.activeStyle()) {
      case 'MLA':
        snippet = `(${a} ${p})`;
        break;
      case 'HARVARD':
        snippet = `(${a}, ${y}: ${p})`;
        break;
      case 'CHICAGO':
        snippet = `(${a} ${y}, ${p})`;
        break;
      case 'LC_APA':
      case 'APA':
      default:
        snippet = `(${a}، ${y}، ل. ${p})`;
        break;
    }

    this.insertMarkup(snippet);
  }

  insertBibliographyEntry(): void {
    const a = this.citationForm.controls.author.value || 'نووسەر';
    const y = this.citationForm.controls.year.value || '2026';
    const t = this.citationForm.controls.title.value || 'ناونیشانی لێکۆڵینەوە';

    let snippet = '';
    switch (this.activeStyle()) {
      case 'MLA':
        snippet = `\n${a}. *${t}*. دەزگای بڵاوکردنەوە، ${y}.\n`;
        break;
      case 'HARVARD':
        snippet = `\n${a}, ${y}. *${t}*. دەزگای بڵاوکردنەوە، شوێنی چاپ.\n`;
        break;
      case 'CHICAGO':
        snippet = `\n${a}. ${y}. *${t}*. شوێنی چاپ: دەزگای بڵاوکردنەوە.\n`;
        break;
      case 'LC_APA':
        snippet = `\n${a} (${y}). *${t}*. دەزگای چاپ و بڵاوکردنەوە. [LCC: Z695.Z8] [LCSH: Kurdish Studies].\n`;
        break;
      case 'APA':
      default:
        snippet = `\n${a} (${y}). *${t}*. دەزگای چاپ و بڵاوکردنەوە.\n`;
        break;
    }

    this.insertMarkup(snippet);
  }

  insertMarkup(text: string): void {
    const textarea = this.targetTextarea();
    if (textarea) {
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const original = textarea.value;

      textarea.value = original.substring(0, start) + text + original.substring(end);
      textarea.selectionStart = start + text.length;
      textarea.selectionEnd = start + text.length;

      // Dispatch native input event to trigger angular signals and two-way listeners
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
    }

    this.markupInserted.emit(text);
  }
}
