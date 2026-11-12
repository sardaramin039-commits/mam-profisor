import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-bookmarks-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      
      <div class="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        
        <!-- Top Bar -->
        <div class="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-stone-100">
          <div class="flex items-center gap-2">
            <mat-icon class="!w-5 !h-5 text-amber-400">bookmarks</mat-icon>
            <h2 class="font-serif font-bold text-base text-amber-300">
              کتێبخانەی تایبەتیی من
            </h2>
          </div>

          <button (click)="closeDialog.emit()" class="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800">
            <mat-icon class="!w-5 !h-5">close</mat-icon>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-4 bg-stone-950 flex gap-4 border-b border-stone-800">
          <button
            (click)="activeTab.set('bookmarks')"
            [class]="activeTab() === 'bookmarks' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'"
            class="pb-3 border-b-2 text-xs font-serif transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="!w-4 !h-4">bookmark</mat-icon>
            <span>کتێبە پاشەکەوتکراوەکان ({{ lib.bookmarks().length }})</span>
          </button>

          <button
            (click)="activeTab.set('history')"
            [class]="activeTab() === 'history' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'"
            class="pb-3 border-b-2 text-xs font-serif transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="!w-4 !h-4">history</mat-icon>
            <span>مێژووی خوێندنەوە ({{ lib.readingHistory().length }})</span>
          </button>
        </div>

        <!-- Body Content -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 bg-stone-950/60">
          
          <!-- TAB 1: Bookmarks -->
          @if (activeTab() === 'bookmarks') {
            @if (lib.bookmarks().length === 0) {
              <div class="py-12 text-center text-stone-500 space-y-2 font-sans">
                <mat-icon class="!w-12 !h-12 opacity-40 mx-auto">bookmark_border</mat-icon>
                <p class="text-sm">هیچ کتێبێک پاشەکەوت نەکراوە.</p>
                <p class="text-xs">لەگەڵ دۆزینەوەی کتێبی دڵخوازت، دوگمەی نیشانە لێبدە بۆ پاشەکەوتکردن.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (item of lib.bookmarks(); track item.id) {
                  <div class="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center gap-3">
                    <img [src]="item.coverImage" [alt]="item.bookTitle" class="w-12 h-16 object-cover rounded-lg bg-stone-950" />
                    <div class="flex-1 truncate">
                      <h4 class="font-serif font-bold text-xs text-stone-200 truncate">{{ item.bookTitle }}</h4>
                      <p class="text-[11px] text-stone-400 truncate">{{ item.author }}</p>
                      <span class="text-[10px] text-stone-500 font-mono">{{ item.addedAt | date:'shortDate' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- TAB 2: Reading History -->
          @if (activeTab() === 'history') {
            @if (lib.readingHistory().length === 0) {
              <div class="py-12 text-center text-stone-500 space-y-2 font-sans">
                <mat-icon class="!w-12 !h-12 opacity-40 mx-auto">auto_stories</mat-icon>
                <p class="text-sm">هیچ مێژوویەکی خوێندنەوە تۆمار نەکراوە.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (rh of lib.readingHistory(); track rh.id) {
                  <div class="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 truncate">
                      <img [src]="rh.coverImage" [alt]="rh.bookTitle" class="w-10 h-14 object-cover rounded-lg bg-stone-950" />
                      <div class="truncate">
                        <h4 class="font-serif font-bold text-xs text-stone-200 truncate">{{ rh.bookTitle }}</h4>
                        <p class="text-[11px] text-stone-400">لاپەڕە {{ rh.currentPage }} لە {{ rh.totalPages }}</p>
                        
                        <!-- Progress Bar -->
                        <div class="w-32 h-1.5 bg-stone-800 rounded-full overflow-hidden mt-1.5">
                          <div class="h-full bg-amber-500 rounded-full" [style.width.%]="rh.percentage"></div>
                        </div>
                      </div>
                    </div>

                    <span class="font-mono text-xs font-bold text-amber-400 whitespace-nowrap">
                      {{ rh.percentage }}%
                    </span>
                  </div>
                }
              </div>
            }
          }

        </div>

      </div>

    </div>
  `
})
export class LibraryBookmarksHistoryComponent {
  public lib = inject(DigitalLibraryService);
  public closeDialog = output<void>();
  public activeTab = signal<'bookmarks' | 'history'>('bookmarks');
}
