import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../services/digital-library.service';
import { LibraryHeaderComponent } from './components/library-header.component';
import { LibraryFilterPanelComponent } from './components/library-filter-panel.component';
import { LibraryBookCardComponent } from './components/library-book-card.component';
import { LibraryBookmarksHistoryComponent } from './components/library-bookmarks-history.component';
import { LibraryAdminDashboardComponent } from './components/library-admin-dashboard.component';
import { LibraryReaderModalComponent } from './components/library-reader-modal.component';

@Component({
  selector: 'app-library-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LibraryHeaderComponent,
    LibraryFilterPanelComponent,
    LibraryBookCardComponent,
    LibraryBookmarksHistoryComponent,
    LibraryAdminDashboardComponent,
    LibraryReaderModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[calc(100vh-72px)] bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
      <app-library-header
        (logoClick)="scrollToTop()"
        (openBookmarks)="bookmarksOpen.set(true)"
        (openAdmin)="adminOpen.set(true)">
      </app-library-header>

      <main class="p-4 sm:p-6 lg:p-8 space-y-6">
        <section class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-5 items-stretch">
          <div class="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-6 flex flex-col justify-between">
            <div>
              <span class="text-[10px] tracking-[.16em] font-mono font-bold text-amber-400 uppercase">Digital Research Library</span>
              <h1 class="mt-2 text-2xl sm:text-3xl font-serif font-extrabold text-stone-100 leading-tight">
                کتێبخانەی دیجیتاڵی توێژینەوە
              </h1>
              <p class="mt-3 max-w-2xl text-xs sm:text-sm leading-7 text-stone-400">
                گەڕان لە کتێب، وتار، تێز و بەڵگەنامەکان، پاشەکەوتکردن، خوێندنەوە و هێنانی سەرچاوە بۆ پرۆژەکە.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-6">
              <div class="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                <span class="block text-[10px] text-stone-500">کۆی تۆمارەکان</span>
                <strong class="block mt-1 text-lg text-amber-300 font-mono">{{ lib.books().length }}</strong>
              </div>
              <div class="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                <span class="block text-[10px] text-stone-500">سەرچاوەی پشکنراو</span>
                <strong class="block mt-1 text-lg text-emerald-300 font-mono">{{ verifiedBooks().length }}</strong>
              </div>
              <div class="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                <span class="block text-[10px] text-stone-500">دۆزراوە</span>
                <strong class="block mt-1 text-lg text-sky-300 font-mono">{{ lib.filteredBooks().length }}</strong>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-stone-800 bg-stone-900 p-5">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 grid place-items-center">
                <mat-icon>fact_check</mat-icon>
              </div>
              <div>
                <h2 class="text-sm font-bold text-stone-100">جریانێکی ڕوون بۆ سەرچاوە</h2>
                <p class="text-[10px] text-stone-500">Search، verify، read، then cite.</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div class="flex items-start gap-3 rounded-xl bg-stone-950/70 border border-stone-800 p-3">
                <span class="w-6 h-6 shrink-0 rounded-full bg-amber-500 text-stone-950 grid place-items-center text-[10px] font-black">١</span>
                <p class="text-[11px] text-stone-300 leading-6">سەرچاوەکە بدۆزەوە بە گەڕان و فلتەر.</p>
              </div>
              <div class="flex items-start gap-3 rounded-xl bg-stone-950/70 border border-stone-800 p-3">
                <span class="w-6 h-6 shrink-0 rounded-full bg-emerald-500 text-stone-950 grid place-items-center text-[10px] font-black">٢</span>
                <p class="text-[11px] text-stone-300 leading-6">خوێندنەوە بکە یان سەردانی سەرچاوەی ڕاستەقینە بکە.</p>
              </div>
              <div class="flex items-start gap-3 rounded-xl bg-stone-950/70 border border-stone-800 p-3">
                <span class="w-6 h-6 shrink-0 rounded-full bg-sky-500 text-stone-950 grid place-items-center text-[10px] font-black">٣</span>
                <p class="text-[11px] text-stone-300 leading-6">بە دوگمەی «ئاماژەدان» ڕاستەوخۆ بیخە نێو تێز و کۆگای سەرچاوە ڕاستەقینەکان.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="max-w-7xl mx-auto">
          <app-library-filter-panel></app-library-filter-panel>
        </section>

        <section class="max-w-7xl mx-auto">
          @if (lib.filteredBooks().length === 0) {
            <div class="rounded-2xl border border-stone-800 bg-stone-900 p-12 text-center">
              <mat-icon class="!w-12 !h-12 text-stone-600">search_off</mat-icon>
              <h2 class="mt-3 text-sm font-bold text-stone-200">هیچ سەرچاوەیەک نەدۆزرایەوە</h2>
              <p class="mt-1 text-[11px] text-stone-500">فلتەرەکان کەم بکەرەوە یان وشەی گەڕان بگۆڕە.</p>
              <button
                type="button"
                (click)="lib.resetFilters()"
                class="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold">
                پاککردنەوەی فلتەرەکان
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (book of lib.filteredBooks(); track book.id) {
                <app-library-book-card [book]="book"></app-library-book-card>
              }
            </div>
          }
        </section>
      </main>

      <footer class="px-6 py-5 border-t border-stone-800 bg-stone-950/80 text-center">
        <span class="text-[10px] text-stone-500">مام پڕۆفیسۆر، کتێبخانەی دیجیتاڵ بۆ کاری توێژینەوە.</span>
      </footer>
    </div>

    @if (bookmarksOpen()) {
      <app-library-bookmarks-history (closeDialog)="bookmarksOpen.set(false)"></app-library-bookmarks-history>
    }

    @if (adminOpen()) {
      <app-library-admin-dashboard (closeDialog)="adminOpen.set(false)"></app-library-admin-dashboard>
    }

    @if (lib.isReaderOpen()) {
      <app-library-reader-modal></app-library-reader-modal>
    }
  `
})
export class LibraryWorkspaceComponent {
  public lib = inject(DigitalLibraryService);
  public bookmarksOpen = signal(false);
  public adminOpen = signal(false);
  public verifiedBooks = computed(() => this.lib.books().filter(book => book.verified));

  public scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
