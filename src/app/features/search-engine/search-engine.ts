import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SearchService, DateRangeFilter, ProgressFilter } from '../../services/search';
import { AcademicStoreService } from '../../services/academic-store.service';
import { SearchResultItem } from '../../domain/models';

@Component({
  selector: 'app-search-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <mat-icon class="text-teal-400">travel_explore</mat-icon>
          <h3 class="text-lg font-bold text-slate-100">سیستەمی گەڕانی جیهانی لە مێژووی توێژینەوەکان (Global Research Search)</h3>
        </div>
        <span class="text-xs text-slate-400">گەڕان، فلتەری کات و ئاستی تەواوبوون</span>
      </div>

      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event); onSearch()"
            (keyup.enter)="onSearch()"
            placeholder="گەڕان لە بەشەکان، مێژووی پاشەکەوت، ناونیشان یان زاراوەکان..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
          />
          <mat-icon class="absolute right-2.5 top-2.5 text-slate-500 text-base">search</mat-icon>
        </div>
        <button
          (click)="onSearch()"
          class="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <mat-icon class="text-base">filter_list</mat-icon>
          ئەنجامەکان ڕێکبخە
        </button>
      </div>

      <!-- Filters Section -->
      <div class="p-3 bg-slate-950/90 rounded-lg border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <!-- Date Range Filter -->
        <div class="space-y-1.5">
          <span class="text-slate-400 font-semibold flex items-center gap-1">
            <mat-icon class="text-xs text-teal-400">event</mat-icon>
            کاتی پاشەکەوتکردن (Date Range):
          </span>
          <div class="flex flex-wrap gap-1">
            @for (df of dateFilters; track df.key) {
              <button
                (click)="selectedDateFilter.set(df.key); onSearch()"
                [class]="selectedDateFilter() === df.key ? 'bg-teal-600 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded-md transition-all text-[11px]"
              >
                {{ df.label }}
              </button>
            }
          </div>
        </div>

        <!-- Progress Filter -->
        <div class="space-y-1.5">
          <span class="text-slate-400 font-semibold flex items-center gap-1">
            <mat-icon class="text-xs text-indigo-400">donut_large</mat-icon>
            ئاستی تەواوبوونی بەشەکان (Progress):
          </span>
          <div class="flex flex-wrap gap-1">
            @for (pf of progressFilters; track pf.key) {
              <button
                (click)="selectedProgressFilter.set(pf.key); onSearch()"
                [class]="selectedProgressFilter() === pf.key ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded-md transition-all text-[11px]"
              >
                {{ pf.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Search Results -->
      @if (hasSearched()) {
        <div class="mt-3 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>ژمارەی ئەنجامەکان: <strong class="text-teal-300">{{ results().length }}</strong></span>
            <span>فلتەری چالاک: {{ getActiveFilterLabel() }}</span>
          </div>

          @if (results().length === 0) {
            <div class="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-lg border border-dashed border-slate-800">
              هیچ ئەنجامێک بەپێی ئەم پێوەرانە نەدۆزرایەوە.
            </div>
          } @else {
            <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
              @for (res of results(); track res.id) {
                <div class="p-3 bg-slate-950/90 rounded-lg border border-slate-800/90 hover:border-teal-500/50 transition-all">
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class.bg-teal-950]="res.type === 'history'"
                          [class.text-teal-300]="res.type === 'history'"
                          [class.bg-indigo-950]="res.type === 'chapter'"
                          [class.text-indigo-300]="res.type === 'chapter'"
                          [class.bg-purple-950]="res.type === 'glossary'"
                          [class.text-purple-300]="res.type === 'glossary'">
                      {{ res.typeLabel }}
                    </span>
                    <span class="text-slate-500 text-[11px]">{{ res.subtitle }}</span>
                  </div>
                  <h4 class="font-bold text-slate-200 text-sm flex items-center justify-between">
                    <span>{{ res.title }}</span>
                    @if (res.savedDateStr) {
                      <span class="text-[10px] text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        🗓️ {{ res.savedDateStr }}
                      </span>
                    }
                  </h4>
                  <p class="text-xs text-slate-400 mt-1 line-clamp-2">{{ res.snippet }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SearchEngineComponent {
  private searchService = inject(SearchService);
  private academicStore = inject(AcademicStoreService);

  searchQuery = signal<string>('');
  selectedDateFilter = signal<DateRangeFilter>('all');
  selectedProgressFilter = signal<ProgressFilter>('all');
  hasSearched = signal<boolean>(false);
  results = signal<SearchResultItem[]>([]);

  readonly dateFilters: { key: DateRangeFilter; label: string }[] = [
    { key: 'all', label: 'هەموو کاتێک' },
    { key: 'today', label: 'ئەمڕۆ' },
    { key: 'this_week', label: 'ئەم هەفتەیە' },
    { key: 'this_month', label: 'ئەم مانگە' },
    { key: 'older', label: 'کۆنتر' }
  ];

  readonly progressFilters: { key: ProgressFilter; label: string }[] = [
    { key: 'all', label: 'هەموو ئاستەکان' },
    { key: 'completed', label: 'تەواوکراو (100%)' },
    { key: 'in_progress', label: 'لە جێبەجێکردندا (1-99%)' },
    { key: 'not_started', label: 'دەستپێنەکراو (0%)' }
  ];

  onSearch(): void {
    this.hasSearched.set(true);
    const query = this.searchQuery();
    
    // Search the user's real in-memory academic workspace; never expose demo/mock results.
    const res = this.searchService.executeSearch(
      query,
      this.academicStore.chapters(),
      [],
      [],
      this.selectedDateFilter(),
      this.selectedProgressFilter()
    );

    this.results.set(res);
  }

  getActiveFilterLabel(): string {
    const d = this.dateFilters.find(f => f.key === this.selectedDateFilter())?.label || '';
    const p = this.progressFilters.find(f => f.key === this.selectedProgressFilter())?.label || '';
    return `${d} | ${p}`;
  }
}
