import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bg-white border-b-2 border-harvard-crimson sticky top-0 z-40 shadow-xs transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <div class="flex items-center gap-3">
          <button (click)="goSplash.emit()" class="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-stone-700" title="بەرەو لاپەڕەی یەکەم">
            <mat-icon class="leading-none flex items-center">arrow_forward</mat-icon>
          </button>
          
          <div class="flex items-center gap-2.5 border-r-2 border-harvard-crimson/15 pr-3">
            <svg class="w-10 h-12 flex-none drop-shadow-sm" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5 C 90 5, 95 30, 95 65 C 95 95, 75 112, 50 118 C 25 112, 5 95, 5 65 C 5 30, 10 5, 50 5 Z" fill="#A51C30" stroke="#C49A45" stroke-width="4" />
              <rect x="20" y="25" width="22" height="16" rx="1" fill="white" />
              <rect x="58" y="25" width="22" height="16" rx="1" fill="white" />
              <rect x="39" y="58" width="22" height="16" rx="1" fill="white" />
              <text x="50" y="102" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="white" font-weight="extrabold">H</text>
            </svg>
            <div>
              <h2 class="text-base sm:text-lg font-serif font-extrabold text-stone-900 flex items-center gap-2">
                <span>سەرنووسەری ئەکادیمیی مام</span>
                <span class="text-[8.5px] font-mono tracking-wider bg-harvard-crimson text-white px-2 py-0.5 rounded font-bold">HARVARD EST. 1636</span>
              </h2>
              <p class="text-[9.5px] text-[#8C8273] font-medium leading-none mt-1">ئامێری سەردەمی نووسینی ڕەسەنی بەشەکانی تێز و کتێب بە پێوەرەکانی زانکۆی هارڤارد</p>
            </div>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 shadow-inner">
          <button
            (click)="selectTab.emit('editor')"
            [class]="mainTab() === 'editor' ? 'bg-harvard-crimson text-white font-extrabold shadow-sm' : 'text-stone-600 hover:text-stone-900 font-medium'"
            class="px-4 py-2 rounded-lg text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="!w-4 !h-4">history_edu</mat-icon>
            <span>سەرنووسەری ئەکادیمیی مام (Harvard)</span>
          </button>

          <button
            (click)="selectTab.emit('suite')"
            [class]="mainTab() === 'suite' ? 'bg-emerald-700 text-white font-extrabold shadow-sm' : 'text-stone-600 hover:text-stone-900 font-medium'"
            class="px-4 py-2 rounded-lg text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="!w-4 !h-4">auto_awesome</mat-icon>
            <span>ئامرازە ئەکادیمییە باڵاکان (Elite Suite)</span>
          </button>

          <button
            (click)="selectTab.emit('advanced_research')"
            [class]="mainTab() === 'advanced_research' ? 'bg-cyan-700 text-white font-extrabold shadow-sm' : 'text-stone-600 hover:text-stone-900 font-medium'"
            class="px-4 py-2 rounded-lg text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="!w-4 !h-4">hub</mat-icon>
            <span>Multi-Agent & APIs Research</span>
          </button>

          <button
            (click)="selectTab.emit('platform')"
            [class]="mainTab() === 'platform' ? 'bg-purple-800 text-white font-extrabold shadow-sm' : 'text-stone-600 hover:text-stone-900 font-medium'"
            class="px-4 py-2 rounded-lg text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="!w-4 !h-4">account_tree</mat-icon>
            <span>پلاتفۆرمی باڵای توێژینەوە (Platform)</span>
          </button>

          <button
            (click)="selectTab.emit('google_drive')"
            [class]="mainTab() === 'google_drive' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-stone-600 hover:text-stone-900 font-medium'"
            class="px-4 py-2 rounded-lg text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="!w-4 !h-4">add_to_drive</mat-icon>
            <span>گووگڵ درایڤ (Google Drive)</span>
          </button>
        </div>

        <div class="flex items-center gap-2.5">
          @if (currentUser()) {
            <div class="flex items-center gap-2 bg-[#F9F6F0] border border-harvard-crimson/20 px-3 py-1.5 rounded-lg shadow-2xs">
              <img [src]="currentUser()?.photoURL" alt="Profile" class="w-6 h-6 rounded-full border border-harvard-crimson/25" referrerpolicy="no-referrer">
              <div class="text-right hidden sm:block">
                <p class="text-[9.5px] font-bold text-stone-950 truncate max-w-[80px]">{{ currentUser()?.displayName }}</p>
                <span class="text-[7.5px] text-harvard-crimson font-extrabold block leading-none">بەستراو بە هەوری فایەربەیس</span>
              </div>
              <button (click)="logout.emit()" title="دەرچوون لە هەور" class="text-stone-500 hover:text-red-700 bg-white border border-[#E5E1DA] p-1 rounded-md transition duration-200">
                <mat-icon class="!text-[10px] !w-3 !h-3 leading-none">logout</mat-icon>
              </button>
            </div>
          } @else {
            <button (click)="loginWithGoogle.emit()" class="text-[10px] font-serif font-extrabold text-white bg-harvard-crimson hover:bg-harvard-dark transition-colors px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs">
              <mat-icon class="!text-xs !w-3.5 !h-3.5 pointer-events-none text-harvard-gold">cloud_queue</mat-icon>
              فایەربەیسی ئەکادیمی
            </button>
          }

          <button (click)="openReadingMode.emit()" title="دۆخی خوێندنەوەی بێ سەرلێشێوان بۆ پێداچوونەوە بە نامەی توێژینەوە" class="text-[10px] font-serif font-bold transition-all border px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs bg-red-900/10 text-red-800 border-red-800/30 hover:bg-red-900/20">
            <mat-icon class="!text-[11px] !w-3.5 !h-3.5 pointer-events-none text-red-700">auto_stories</mat-icon>
            <span>دۆخی خوێندنەوە (Reading Mode)</span>
          </button>

          <button (click)="toggleDarkMode.emit()" class="text-[10px] font-serif font-bold transition-colors border px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  [class.bg-stone-900]="academicDarkMode()" [class.text-stone-100]="academicDarkMode()" [class.border-stone-800]="academicDarkMode()"
                  [class.bg-white]="!academicDarkMode()" [class.text-stone-900]="!academicDarkMode()" [class.border-stone-300]="!academicDarkMode()">
            <mat-icon class="!text-[11px] !w-3.5 !h-3.5 pointer-events-none" [class.text-amber-400]="academicDarkMode()" [class.text-stone-600]="!academicDarkMode()">
              {{ academicDarkMode() ? 'dark_mode' : 'light_mode' }}
            </mat-icon>
            <span>{{ academicDarkMode() ? 'دۆخی تاریکی ئەکادیمی' : 'دۆخی ڕووناکی ئەکادیمی' }}</span>
          </button>

          <button (click)="clearEditor.emit()" class="text-[10px] font-serif font-bold text-stone-900 hover:bg-stone-100 hover:text-black transition-colors border border-stone-300 px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer bg-white shadow-2xs">
            <mat-icon class="!text-[11px] !w-3.5 !h-3.5 pointer-events-none text-harvard-crimson">restart_alt</mat-icon>
            نوێکردنەوەی ژینگە
          </button>
        </div>
      </div>
    </header>
  `
})
export class DashboardHeaderComponent {
  mainTab = input<'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform'>('editor');
  currentUser = input<any>(null);
  academicDarkMode = input<boolean>(false);

  goSplash = output<void>();
  selectTab = output<'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform'>();
  loginWithGoogle = output<void>();
  logout = output<void>();
  openReadingMode = output<void>();
  toggleDarkMode = output<void>();
  clearEditor = output<void>();
}
