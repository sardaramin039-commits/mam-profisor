import { Component, ChangeDetectionStrategy, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { EditorService } from '../editor/services/editor';

export interface AcademicSearchResultItem {
  id: string;
  title: string;
  author: string;
  year: number;
  field: string;
  keywords: string[];
  citationsCount: number;
  abstractText: string;
  doi: string;
}

const DEFAULT_ACADEMIC_CORPUS: AcademicSearchResultItem[] = [
  {
    id: 'res-1',
    title: 'مێژووی پەرەسەندنی شێوەزارەکانی زمانی کوردی',
    author: 'پ.د. عەلی زەکی',
    year: 2021,
    field: 'Linguistics / زمانەوانی',
    keywords: ['زاراوەکان', 'مۆرفۆلۆژی', 'سۆرانی'],
    citationsCount: 42,
    abstractText: 'لێکۆڵینەوەیەکی بەراوردکارییە لەسەر فۆنۆلۆژی و سینتاکسی دەقە کۆنەکانی کوردی.',
    doi: '10.1016/j.kurdling.2021.03'
  },
  {
    id: 'res-2',
    title: 'کاریگەریی تۆڕە کۆمەڵایەتییەکان لەسەر گۆڕانی کۆمەڵایەتی لە هەولێر و سلێمانی',
    author: 'د. ڕێبوار کەریم',
    year: 2023,
    field: 'Sociology / کۆمەڵناسی',
    keywords: ['کۆمەڵگە', 'میدیا', 'گەنجان'],
    citationsCount: 19,
    abstractText: 'توێژینەوەیەکی مەیدانییە لەسەر نموونەی ٤٠٠ گەنج لە هەرێمی کوردستان.',
    doi: '10.1080/01419870.2023.18'
  },
  {
    id: 'res-3',
    title: 'بەکارهێنانی مۆدێلە قووڵەکانی هۆشی دەستکرد بۆ ڕێنووسی کوردی',
    author: 'ئاراس ئەحمەد',
    year: 2024,
    field: 'Computer Science / زانستی کۆمپیوتەر',
    keywords: ['NLP', 'Transformers', 'زمانەوانی کۆمپیوتەری'],
    citationsCount: 28,
    abstractText: 'ڕاهێنانی مۆدێلی کوردی بۆ پشکنینی هەڵەی ڕێنووسی بە بەکارهێنانی کۆرپسی گەورە.',
    doi: '10.1145/3543507.2024'
  },
  {
    id: 'res-4',
    title: 'شیکاریی بەراوردکاریی پێکهاتەی ئابووریی عێراق و کوردستان (١٩٩٠-٢٠٢٠)',
    author: 'د. محەمەد فەتاح',
    year: 2020,
    field: 'Economics / ئابووری',
    keywords: ['نەوت', 'بودجە', 'گەشەپێدان'],
    citationsCount: 35,
    abstractText: 'هەڵسەنگاندنی هەمەچەشنکردنی داهات و ئاستەنگە ئابوورییەکان.',
    doi: '10.1002/econ.2020.45'
  },
  {
    id: 'res-5',
    title: 'کوردستان لە بەڵگەنامە نهێنییەکانی بەریتانیا لە سەرەتای سەدەی بیستەمدا',
    author: 'د. کامەران عەزیز',
    year: 2022,
    field: 'History / مێژوو',
    keywords: ['بەڵگەنامە', 'سیڤەر', 'مێژووی هاوچەرخ'],
    citationsCount: 51,
    abstractText: 'خوێندنەوەی ئەرشیفی ئۆفیسی کۆلۆنیالیزمی بەریتانیا دەربارەی پرسی ویلایەتی مووسڵ.',
    doi: '10.1093/histres/2022.09'
  }
];

@Component({
  selector: 'app-advanced-academic-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-right font-sans space-y-6" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <mat-icon class="!text-lg !w-5 !h-5">manage_search</mat-icon>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-100 font-serif">سیستەمی گەڕانی پێشکەوتووی ئەکادیمی (Advanced Academic Search)</h4>
            <p class="text-[11px] text-slate-400">پاڵفتەکردنی ورد بەپێی مەودای ساڵ، نووسەر، بوارە زانستییەکان، و هێماکان لە خشتەی پۆلێنکراودا</p>
          </div>
        </div>
        <span class="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2.5 py-1 rounded-full font-bold">
          Sortable Research Matrix
        </span>
      </div>

      <!-- Advanced Filter Form Panel -->
      <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5 text-xs">
        <!-- Row 1: Search Query & Author -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">وشەی سەرەکی یان ناونیشان:</label>
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="applyFilters()"
                placeholder="بۆ نموونە: زمانی کوردی، هۆشی دەستکرد، گۆڕانی کۆمەڵایەتی..." 
                class="w-full p-2.5 pr-8 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500">
              <mat-icon class="absolute right-2.5 top-2.5 text-slate-500 !text-sm">search</mat-icon>
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">ناوی نووسەر (Author):</label>
            <input 
              type="text" 
              [(ngModel)]="filterAuthor" 
              (ngModelChange)="applyFilters()"
              placeholder="ناوی توێژەر (بۆ نموونە: عەلی، کەریم...)" 
              class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500">
          </div>
        </div>

        <!-- Row 2: Field, Year Range, Tag -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">بواری ئەکادیمی (Field):</label>
            <select 
              [(ngModel)]="filterField" 
              (ngModelChange)="applyFilters()"
              class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500">
              <option value="">هەموو بوارەکان</option>
              <option value="Computer Science">Computer Science / کۆمپیوتەر</option>
              <option value="Sociology">Sociology / کۆمەڵناسی</option>
              <option value="History">History / مێژوو</option>
              <option value="Linguistics">Linguistics / زمانەوانی</option>
              <option value="Economics">Economics / ئابووری</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">لە ساڵی (From Year):</label>
            <input 
              type="number" 
              [(ngModel)]="filterYearFrom" 
              (ngModelChange)="applyFilters()"
              placeholder="2018" 
              class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500 font-mono">
          </div>

          <div>
            <label class="block text-slate-400 mb-1">تا ساڵی (To Year):</label>
            <input 
              type="number" 
              [(ngModel)]="filterYearTo" 
              (ngModelChange)="applyFilters()"
              placeholder="2026" 
              class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500 font-mono">
          </div>

          <div>
            <label class="block text-slate-400 mb-1">تاگ یان هێما (Keyword/Tag):</label>
            <input 
              type="text" 
              [(ngModel)]="filterTag" 
              (ngModelChange)="applyFilters()"
              placeholder="NLP، سۆرانی..." 
              class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500">
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>دەرئەنجامە دۆزراوەکان: <strong class="text-purple-400">{{ filteredResults().length }}</strong> توێژینەوە</span>
          <button 
            type="button" 
            (click)="resetFilters()" 
            class="text-slate-400 hover:text-slate-200 underline cursor-pointer">
            سڕینەوەی هەموو فلتەرەکان
          </button>
        </div>
      </div>

      <!-- Sortable Results Table -->
      <div class="overflow-x-auto border border-slate-800 rounded-xl">
        <table class="w-full text-right text-xs text-slate-300">
          <thead class="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800 select-none">
            <tr>
              <th (click)="sortBy('title')" class="p-3 cursor-pointer hover:text-white">
                <div class="flex items-center gap-1">
                  <span>ناونیشان</span>
                  <mat-icon class="!text-xs">unfold_more</mat-icon>
                </div>
              </th>
              <th (click)="sortBy('author')" class="p-3 cursor-pointer hover:text-white">
                <div class="flex items-center gap-1">
                  <span>نووسەر</span>
                  <mat-icon class="!text-xs">unfold_more</mat-icon>
                </div>
              </th>
              <th (click)="sortBy('year')" class="p-3 cursor-pointer hover:text-white">
                <div class="flex items-center gap-1">
                  <span>ساڵ</span>
                  <mat-icon class="!text-xs">unfold_more</mat-icon>
                </div>
              </th>
              <th (click)="sortBy('field')" class="p-3 cursor-pointer hover:text-white">
                <div class="flex items-center gap-1">
                  <span>بواری زانستی</span>
                  <mat-icon class="!text-xs">unfold_more</mat-icon>
                </div>
              </th>
              <th (click)="sortBy('citationsCount')" class="p-3 cursor-pointer hover:text-white text-center">
                <div class="flex items-center justify-center gap-1">
                  <span>ئاماژەپێدان (Citations)</span>
                  <mat-icon class="!text-xs">unfold_more</mat-icon>
                </div>
              </th>
              <th class="p-3 text-center">کردار</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-950/40">
            @for (row of filteredResults(); track row.id) {
              <tr class="hover:bg-slate-850/50 transition">
                <td class="p-3 max-w-xs">
                  <div class="font-bold text-slate-100 font-serif leading-snug">{{ row.title }}</div>
                  <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{{ row.abstractText }}</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    @for (kw of row.keywords; track kw) {
                      <span class="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">{{ kw }}</span>
                    }
                  </div>
                </td>
                <td class="p-3 font-medium text-slate-200">{{ row.author }}</td>
                <td class="p-3 font-mono text-purple-300 font-bold">{{ row.year }}</td>
                <td class="p-3">
                  <span class="text-[10px] bg-purple-950/40 text-purple-300 border border-purple-900/50 px-2 py-0.5 rounded-full font-bold">
                    {{ row.field }}
                  </span>
                </td>
                <td class="p-3 text-center font-mono font-bold text-emerald-400">
                  {{ row.citationsCount }}
                </td>
                <td class="p-3 text-center">
                  <button 
                    type="button"
                    (click)="insertIntoChapter(row)"
                    class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                    title="ئاماژەدان بەم سەرچاوەیە لە ناو دەقی بەشی چالاک">
                    <mat-icon class="!text-[11px] !w-3 !h-3">bookmark_add</mat-icon>
                    <span>ئاماژەدان</span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-6 text-center text-slate-500">
                  هیچ توێژینەوەیەک نەدۆزرایەوە کە لەگەڵ فلتەرە دیاریکراوەکاندا یەکبگرێتەوە.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdvancedAcademicSearchComponent {
  private editorService = inject(EditorService);

  activeChapter = input<ChapterItem | null>(null);

  searchQuery = '';
  filterAuthor = '';
  filterField = '';
  filterYearFrom: number | null = null;
  filterYearTo: number | null = null;
  filterTag = '';

  sortField: keyof AcademicSearchResultItem = 'year';
  sortAscending = false;

  corpus = signal<AcademicSearchResultItem[]>(DEFAULT_ACADEMIC_CORPUS);
  filteredResults = signal<AcademicSearchResultItem[]>(DEFAULT_ACADEMIC_CORPUS);

  constructor() {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.corpus()];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.abstractText.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q))
      );
    }

    if (this.filterAuthor.trim()) {
      const author = this.filterAuthor.toLowerCase();
      list = list.filter(item => item.author.toLowerCase().includes(author));
    }

    if (this.filterField) {
      list = list.filter(item => item.field.toLowerCase().includes(this.filterField.toLowerCase()));
    }

    if (this.filterYearFrom) {
      list = list.filter(item => item.year >= this.filterYearFrom!);
    }

    if (this.filterYearTo) {
      list = list.filter(item => item.year <= this.filterYearTo!);
    }

    if (this.filterTag.trim()) {
      const tag = this.filterTag.toLowerCase();
      list = list.filter(item => item.keywords.some(k => k.toLowerCase().includes(tag)));
    }

    // Sort
    list.sort((a, b) => {
      const valA = a[this.sortField];
      const valB = b[this.sortField];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      return this.sortAscending ? comparison : -comparison;
    });

    this.filteredResults.set(list);
  }

  sortBy(field: keyof AcademicSearchResultItem): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = false;
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterAuthor = '';
    this.filterField = '';
    this.filterYearFrom = null;
    this.filterYearTo = null;
    this.filterTag = '';
    this.applyFilters();
  }

  insertIntoChapter(item: AcademicSearchResultItem): void {
    const ch = this.activeChapter();
    if (!ch) return;

    const citation = ` (${item.author}، ${item.year})`;
    const updated = (ch.content || '') + citation;
    this.editorService.updateChapterContent(
      ch.id,
      updated,
      `زیادکردنی ئاماژەی گەڕانی پێشکەوتوو: ${item.title}`
    );
  }
}
