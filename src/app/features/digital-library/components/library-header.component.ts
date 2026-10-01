import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-900/90 text-stone-100 border-b border-stone-800 shadow-xl transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        <!-- App Logo & Title -->
        <button
          type="button"
          class="flex items-center gap-3 cursor-pointer select-none border-0 bg-transparent p-0 text-right"
          (click)="logoClick.emit()"
          aria-label="گەڕانەوە بۆ سەرەکیی کتێبخانە"
        >
          <div class="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group hover:scale-105 transition-transform">
            <mat-icon class="!w-6 !h-6">auto_stories</mat-icon>
          </div>
          <div>
            <h1 class="font-serif font-extrabold text-lg sm:text-xl text-amber-200 tracking-wide flex items-center gap-2">
              <span>{{ lib.t().appName }}</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{{ lib.sources().length }} Sources</span>
            </h1>
            <p class="text-xs text-stone-400 hidden sm:block font-sans">
              کۆکراوەی سەرچاوە و کتێبخانە دیجیتاڵییەکانی کوردستان و جیهان
            </p>
          </div>
        </button>

        <!-- Quick AI Search Bar (Centered on desktop) -->
        <div class="flex-1 max-w-xl mx-2 hidden md:block relative">
          <div class="relative flex items-center">
            <mat-icon class="absolute right-3.5 text-stone-400 !w-5 !h-5">search</mat-icon>
            <input
              type="text"
              [ngModel]="lib.filters().query"
              (ngModelChange)="lib.updateSearchQuery($event)"
              [placeholder]="lib.t().searchPlaceholder"
              class="w-full pr-11 pl-10 py-2.5 bg-stone-800/90 text-stone-100 text-sm rounded-xl border border-stone-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none placeholder:text-stone-500 font-sans shadow-inner"
            />
            @if (lib.filters().query) {
              <button type="button" (click)="lib.updateSearchQuery('') class="absolute left-3 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer">
                <mat-icon class="!w-4 !h-4">close</mat-icon>
              </button>
            }
          </div>
        </div>

        <!-- Action Controls & Settings -->
        <div class="flex items-center gap-2 sm:gap-3">

          <!-- Language Selector -->
          <div class="relative">
            <select
              [ngModel]="lib.currentLanguage()"
              (ngModelChange)="lib.currentLanguage.set($event)"
              class="bg-stone-800 text-amber-300 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-700 hover:border-amber-500 transition-colors cursor-pointer outline-none shadow-sm"
            >
              <option value="ckb">کوردی (سۆرانی)</option>
              <option value="kmr">Kurdî (Kurmancî)</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fa">فارسی</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>

          <!-- Bookmarks Button -->
          <button
            (click)="openBookmarks.emit()"
            class="relative px-3 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="پاشەکەوتکراوەکان"
          >
            <mat-icon class="!w-4 !h-4 text-amber-400">bookmark</mat-icon>
            <span class="hidden sm:inline">{{ lib.t().myBookmarks }}</span>
            @if (lib.bookmarks().length > 0) {
              <span class="ml-1 px-1.5 py-0.2 bg-amber-500 text-stone-950 font-extrabold text-[10px] rounded-full">
                {{ lib.bookmarks().length }}
              </span>
            }
          </button>

          <!-- Admin Dashboard Button -->
          <button
            (click)="openAdmin.emit()"
            class="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="داشبۆردی بەڕێوەبەرایەتی"
          >
            <mat-icon class="!w-4 !h-4">admin_panel_settings</mat-icon>
            <span class="hidden lg:inline">داشبۆرد</span>
          </button>

          <!-- Dark/Light Theme Toggle -->
          
        </div>
      </div>

      <!-- Mobile Search Bar (under main header) -->
      <div class="px-4 pb-3 md:hidden">
        <div class="relative flex items-center">
          <mat-icon class="absolute right-3.5 text-stone-400 !w-5 !h-5">search</mat-icon>
          <input
            type="text"
            [ngModel]="lib.filters().query"
            (ngModelChange)="lib.updateSearchQuery($event)"
            [placeholder]="lib.t().searchPlaceholder"
            class="w-full pr-11 pl-10 py-2 bg-stone-800 text-stone-100 text-xs rounded-xl border border-stone-700 focus:border-amber-500 outline-none placeholder:text-stone-500"
          />
        </div>
      </div>
    </header>
  `
})
export class LibraryHeaderComponent {
  public lib = inject(DigitalLibraryService);
  public logoClick = output<void>();
  public openBookmarks = output<void>();
  public openAdmin = output<void>();
}
