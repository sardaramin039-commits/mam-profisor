import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-4">
      
      <!-- Top Title & Clear Action -->
      <div class="flex items-center justify-between border-b border-stone-800/80 pb-3">
        <div class="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
          <mat-icon class="!w-5 !h-5">tune</mat-icon>
          <span>{{ lib.t().filterTitle }}</span>
          <span class="text-xs text-stone-400 font-sans font-normal">
            ({{ lib.filteredBooks().length }} کتێب دۆزرایەوە)
          </span>
        </div>

        <button
          (click)="lib.resetFilters()"
          class="text-xs text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer font-sans"
        >
          <mat-icon class="!w-4 !h-4">restart_alt</mat-icon>
          <span>{{ lib.t().clearFilters }}</span>
        </button>
      </div>

      <!-- Grid Filter Controls -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

        <!-- 1. Source Library Dropdown (All 40 sources) -->
        <div>
          <label for="filter-source-select" class="block text-[11px] font-semibold text-stone-400 mb-1">سەرچاوەی دیجیتاڵی (٤٠ کتێبخانە)</label>
          <select
            id="filter-source-select"
            [ngModel]="lib.filters().sourceId"
            (ngModelChange)="lib.updateFilter('sourceId', $event)"
            class="w-full bg-stone-800 text-stone-200 text-xs py-2 px-2.5 rounded-xl border border-stone-700/80 hover:border-amber-500/50 outline-none transition-colors cursor-pointer"
          >
            <option value="all">{{ lib.t().allSources }}</option>
            @for (s of lib.sources(); track s.id) {
              <option [value]="s.id">{{ s.nameKurdish || s.name }} ({{ s.totalItems }})</option>
            }
          </select>
        </div>

        <!-- 2. Language Selector -->
        <div>
          <label for="filter-lang-select" class="block text-[11px] font-semibold text-stone-400 mb-1">زمانی بڵاوکراوە</label>
          <select
            id="filter-lang-select"
            [ngModel]="lib.filters().language"
            (ngModelChange)="lib.updateFilter('language', $event)"
            class="w-full bg-stone-800 text-stone-200 text-xs py-2 px-2.5 rounded-xl border border-stone-700/80 hover:border-amber-500/50 outline-none transition-colors cursor-pointer"
          >
            <option value="all">{{ lib.t().allLanguages }}</option>
            <option value="ckb">کوردی (سۆرانی)</option>
            <option value="kmr">کوردی (کورمانجی)</option>
            <option value="ar">العربية (عەرەبی)</option>
            <option value="en">English (ئینگلیزی)</option>
            <option value="fa">فارسی</option>
            <option value="tr">Türkçe (تورکی)</option>
          </select>
        </div>

        <!-- 3. Document Type Filter -->
        <div>
          <label for="filter-doctype-select" class="block text-[11px] font-semibold text-stone-400 mb-1">جۆری بەڵگەنامە</label>
          <select
            id="filter-doctype-select"
            [ngModel]="lib.filters().docType"
            (ngModelChange)="lib.updateFilter('docType', $event)"
            class="w-full bg-stone-800 text-stone-200 text-xs py-2 px-2.5 rounded-xl border border-stone-700/80 hover:border-amber-500/50 outline-none transition-colors cursor-pointer"
          >
            <option value="all">{{ lib.t().allDocTypes }}</option>
            <option value="book">کتێب (Book)</option>
            <option value="article">وتاری زانستی (Article)</option>
            <option value="journal">گۆڤاری زانستی (Journal)</option>
            <option value="thesis">تێزی ئاستی باڵا (Thesis)</option>
            <option value="manuscript">دەستنووسی مێژوویی (Manuscript)</option>
            <option value="archive">بەڵگەنامەی ئەرشیڤی (Archive Document)</option>
          </select>
        </div>

        <!-- 4. Subject Selector -->
        <div>
          <label for="filter-subject-select" class="block text-[11px] font-semibold text-stone-400 mb-1">بوار و بابەت</label>
          <select
            id="filter-subject-select"
            [ngModel]="lib.filters().subject"
            (ngModelChange)="lib.updateFilter('subject', $event)"
            class="w-full bg-stone-800 text-stone-200 text-xs py-2 px-2.5 rounded-xl border border-stone-700/80 hover:border-amber-500/50 outline-none transition-colors cursor-pointer"
          >
            <option value="all">{{ lib.t().allSubjects }}</option>
            @for (subj of lib.availableSubjects(); track subj) {
              <option [value]="subj">{{ subj }}</option>
            }
          </select>
        </div>

        <!-- 5. Sort Option -->
        <div>
          <label for="filter-sort-select" class="block text-[11px] font-semibold text-stone-400 mb-1">{{ lib.t().sortBy }}</label>
          <select
            id="filter-sort-select"
            [ngModel]="lib.filters().sortBy"
            (ngModelChange)="lib.updateFilter('sortBy', $event)"
            class="w-full bg-stone-800 text-amber-300 text-xs py-2 px-2.5 rounded-xl border border-stone-700/80 hover:border-amber-500/50 outline-none transition-colors cursor-pointer font-medium"
          >
            <option value="relevance">نزیكترین و گونجاوترین</option>
            <option value="year_desc">نوێترین ساڵی بڵاوکردنەوە</option>
            <option value="year_asc">کۆنترین ساڵی بڵاوکردنەوە</option>
            <option value="title">ناونیشان (ئەلفوبێ)</option>
            <option value="rating">پلەی بەرز (Rating)</option>
          </select>
        </div>

      </div>

      <!-- Quick Category Filter Chips -->
      <div class="flex items-center gap-2 pt-1 overflow-x-auto pb-1 scrollbar-none">
        <span class="text-xs text-stone-500 font-semibold whitespace-nowrap">پۆلێنە سەرەکییەکان:</span>
        
        <button
          (click)="lib.updateFilter('docType', 'all')"
          [class]="lib.filters().docType === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'"
          class="px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          گشتی
        </button>

        <button
          (click)="lib.updateFilter('docType', 'book')"
          [class]="lib.filters().docType === 'book' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'"
          class="px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          📚 کتێبخانە
        </button>

        <button
          (click)="lib.updateFilter('docType', 'journal')"
          [class]="lib.filters().docType === 'journal' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'"
          class="px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          📜 گۆڤاری زانستی
        </button>

        <button
          (click)="lib.updateFilter('docType', 'thesis')"
          [class]="lib.filters().docType === 'thesis' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'"
          class="px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          🎓 تێز و توێژینەوە
        </button>

        <button
          (click)="lib.updateFilter('docType', 'manuscript')"
          [class]="lib.filters().docType === 'manuscript' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'"
          class="px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          🖋️ دەستنووسی مێژوویی
        </button>
      </div>

    </div>
  `
})
export class LibraryFilterPanelComponent {
  public lib = inject(DigitalLibraryService);
}
