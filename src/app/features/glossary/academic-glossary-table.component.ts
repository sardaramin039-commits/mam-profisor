import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ACADEMIC_GLOSSARY, GlossaryEntry } from '../../../prompts/academic-glossary';

@Component({
  selector: 'app-academic-glossary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 font-sans text-right shadow-xl" dir="rtl">
      
      <!-- Top Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <mat-icon class="!text-xl !w-6 !h-6 leading-none">menu_book</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 font-serif">فەرهەنگی زاراوە ئەکادیمی و زانستییەکان (Kurdish Academic Glossary)</h3>
            <p class="text-[11px] text-slate-400 font-serif">زاراوەی کوردی (سۆرانی)، واتای ئینگلیزی لە کەوانەدا و پێناسە/بەکارهێنانی زانستی</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="copyMarkdownTable()"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-serif rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm">
            <mat-icon class="!text-sm">content_copy</mat-icon>
            <span>کۆپیکردنی خشتەی مارکداون (Markdown)</span>
          </button>
          <button
            type="button"
            (click)="showAddModal.set(!showAddModal())"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-serif rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm">
            <mat-icon class="!text-sm">add_circle</mat-icon>
            <span>زیادکردنی زاراوەی نوێ</span>
          </button>
        </div>
      </div>

      <!-- Search Input -->
      <div class="relative">
        <mat-icon class="absolute right-3 top-2.5 text-slate-500 !text-lg">search</mat-icon>
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          placeholder="گەڕان بەدوای زاراوەی کوردی، ئینگلیزی یان پێنساەکاندا..."
          class="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-serif"
        />
      </div>

      <!-- Add New Term Modal / Form -->
      @if (showAddModal()) {
        <div class="p-4 bg-slate-950 border border-emerald-500/50 rounded-xl space-y-3 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 class="text-xs font-bold text-emerald-400 font-serif flex items-center gap-1">
              <mat-icon class="!text-sm">add_box</mat-icon>
              زیادکردنی زاراوەی نوێ بۆ فەرهەنگەکە:
            </h4>
            <button (click)="showAddModal.set(false)" class="text-slate-400 hover:text-white">
              <mat-icon class="!text-sm">close</mat-icon>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-serif">
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">زاراوەی کوردی:</label>
              <input
                type="text"
                [(ngModel)]="newKurdishTerm"
                placeholder="نموونە: زانستیاری"
                class="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">واتا یان زاراوەی ئینگلیزی:</label>
              <input
                type="text"
                [(ngModel)]="newEnglishTerm"
                placeholder="نموونە: Epistemology"
                class="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-[11px] text-slate-300 mb-1 font-serif">پێناسە / بەکارهێنانی زانستی:</label>
            <textarea
              [(ngModel)]="newDefinition"
              rows="2"
              placeholder="نموونە: لێکۆڵینەوە لە سروشت و سنوورەکانی زانین..."
              class="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:border-emerald-500 font-serif"></textarea>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="addNewTerm()"
              [disabled]="!newKurdishTerm.trim() || !newDefinition.trim()"
              class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg font-serif transition">
              پاشەکەوتکردن لە فەرهەنگدا
            </button>
          </div>
        </div>
      }

      <!-- Responsive Table View for Tablet/Desktop & Cards View for Mobile -->
      <!-- Mobile Cards Fallback View (Hidden on MD+) -->
      <div class="space-y-2.5 md:hidden">
        @for (item of filteredTerms(); track item.foreign) {
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs font-serif shadow-sm">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
              <span class="font-bold text-blue-400 text-sm">
                {{ item.translation.split('/')[0].trim() }}
              </span>
              <span class="text-slate-400 font-mono dir-ltr text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ({{ item.foreign }})
              </span>
            </div>
            <p class="text-slate-300 leading-relaxed text-justify text-[11.5px]">
              {{ item.definition }}
            </p>
          </div>
        }
      </div>

      <!-- Markdown Table View for Tablet/Desktop (Hidden on Mobile) -->
      <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 w-full max-w-full">
        <table class="w-full text-right border-collapse text-xs font-serif">
          <thead>
            <tr class="bg-slate-800/80 text-blue-300 border-b border-slate-700/80">
              <th class="p-3 font-bold border-l border-slate-800 min-w-[130px]">زاراوەی کوردی</th>
              <th class="p-3 font-bold border-l border-slate-800 min-w-[140px]">واتا (ئینگلیزی)</th>
              <th class="p-3 font-bold">پێناسە / بەکارهێنان</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-200">
            @for (item of filteredTerms(); track item.foreign) {
              <tr class="hover:bg-slate-900/80 transition-colors">
                <td class="p-3 font-bold text-blue-400 border-l border-slate-800/60">
                  {{ item.translation.split('/')[0].trim() }}
                </td>
                <td class="p-3 text-slate-300 dir-ltr font-mono border-l border-slate-800/60">
                  ({{ item.foreign }})
                </td>
                <td class="p-3 text-slate-300 leading-relaxed text-justify">
                  {{ item.definition }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Quick Notification -->
      @if (copiedNotice()) {
        <div class="p-2 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs text-center rounded-lg font-serif animate-bounce">
          ✓ خشتەی زاراوەکان بە فۆرماتی مارکداون (Markdown Table) کاتێکانە کۆپی کرا!
        </div>
      }

    </div>
  `
})
export class AcademicGlossaryTableComponent {
  searchQuery = signal<string>('');
  showAddModal = signal<boolean>(false);
  copiedNotice = signal<boolean>(false);

  newKurdishTerm = '';
  newEnglishTerm = '';
  newDefinition = '';

  // Initial set of terms
  glossaryList = signal<GlossaryEntry[]>([
    {
      foreign: 'Epistemology',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'زانستیاری / ئێپیستیمۆلۆژی',
      definition: 'لێکۆڵینەوە لە سروشت و سنوورەکانی زانین و مەرجەکانی بڕواپێکراویی دروست.'
    },
    {
      foreign: 'Methodology',
      category: 'گشتی',
      sourceLang: 'ئینگلیزی',
      translation: 'میتۆدۆلۆژیا / ڕێبازی توێژینەوە',
      definition: 'کۆمەڵێک ڕێباز و تەکنیکی زانستی کە لە لێکۆڵینەوەدا بەکاردێن بۆ گەیشتن بە فاکتەکان.'
    },
    {
      foreign: 'Hypothesis',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'گریمانە',
      definition: 'پێشبینییەک یان ڕوونکردنەوەیەکی کاتی کە دەکرێت تاقیبکرێتەوە و لە مەیداندا بەڵگەی سەرەکی بۆ بهێنرێتەوە.'
    },
    {
      foreign: 'Qualitative Analysis',
      category: 'شیکاری',
      sourceLang: 'ئینگلیزی',
      translation: 'شیکاریی چۆنایەتی',
      definition: 'لێکۆڵینەوە لە وەسف، بەها و جۆرایەتیی دیاردەکان بەبێ پشت بەستنی ڕاستەوخۆ بە ڕێژەی ژمارەیی.'
    },
    {
      foreign: 'Quantitative Analysis',
      category: 'شیکاری',
      sourceLang: 'ئینگلیزی',
      translation: 'شیکاریی چەندایەتی',
      definition: 'پێوانەکردن و شیکاریی ئاماریی ژمارەیی بۆ شەن و کەوکردنی پێوەندی نێوان گۆڕاوەکان.'
    },
    {
      foreign: 'Hermeneutics',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'هێرمێنیوتیک / لێکدانەوەی دەق',
      definition: 'تیۆری و ڕێبازی ڕاڤەکردن و لێکدانەوەی قووڵی دەقە مێژوویی و ئەکادیمییەکان.'
    },
    {
      foreign: 'Paradigm',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'پارادیگم / نەخشەی فیکری',
      definition: 'نەخشەی هزری و پێوەری زانستیی دەستنیشانکراو لە سەردەمێکدا بۆ ڕاڤەکردنی جیهان.'
    },
    {
      foreign: 'Ontology',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'ئۆنتۆلۆجی / بوونناسی',
      definition: 'لێکۆڵینەوە لە بڕگەکان، بوون و واقیعی بنەڕەتیی دیاردەکان.'
    },
    {
      foreign: 'Axiology',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'ئەکسۆلۆجی / بەھاناسی',
      definition: 'شیکاریی بەها زانستی، ئەخلاقی و فەلسەفییەکان لە کایەی توێژینەوەدا.'
    },
    {
      foreign: 'Theory',
      category: 'تیۆری',
      sourceLang: 'ئینگلیزی',
      translation: 'تیۆری / بیردۆز',
      definition: 'پێکهاتەیەکی لۆژیکی یەکگرتوو لە چەمک و بنەماکان بۆ شیکردنەوەی دیاردە زانستییەکان.'
    },
    ...ACADEMIC_GLOSSARY.slice(10)
  ]);

  filteredTerms = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.glossaryList();
    return this.glossaryList().filter(item =>
      item.translation.toLowerCase().includes(q) ||
      item.foreign.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q)
    );
  });

  addNewTerm(): void {
    if (!this.newKurdishTerm.trim() || !this.newDefinition.trim()) return;

    const entry: GlossaryEntry = {
      foreign: this.newEnglishTerm.trim() || 'Academic Term',
      category: 'کاستۆم',
      sourceLang: 'ئینگلیزی',
      translation: this.newKurdishTerm.trim(),
      definition: this.newDefinition.trim()
    };

    this.glossaryList.update(list => [entry, ...list]);
    this.newKurdishTerm = '';
    this.newEnglishTerm = '';
    this.newDefinition = '';
    this.showAddModal.set(false);
  }

  copyMarkdownTable(): void {
    let md = '| زاراوەی کوردی | واتا (ئینگلیزی) | پێناسە/بەکارهێنان |\n|---|---|---|\n';
    this.glossaryList().forEach(item => {
      const kurdish = item.translation.split('/')[0].trim();
      const eng = item.foreign ? `(${item.foreign})` : '';
      const def = item.definition.replace(/\n/g, ' ');
      md += `| ${kurdish} | ${eng} | ${def} |\n`;
    });

    navigator.clipboard.writeText(md);
    this.copiedNotice.set(true);
    setTimeout(() => this.copiedNotice.set(false), 2500);
  }
}
