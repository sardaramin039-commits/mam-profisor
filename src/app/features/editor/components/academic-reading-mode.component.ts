import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel } from '../../../domain/models';
import { AutomatedBibliographyService } from '../../../services/automated-bibliography.service';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { toSoraniNumber } from '../../../pipes/sorani-number.pipe';

@Component({
  selector: 'app-academic-reading-mode',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onEscape()'
  },
  template: `
    <div
      class="fixed inset-0 z-[100] flex flex-col transition-colors duration-300 overflow-hidden font-serif"
      [class]="themeClass()"
      dir="rtl"
      id="academic-reading-overlay">

      <!-- Top Floating Minimalist Distraction-Free Header -->
      <header class="shrink-0 px-6 py-3 border-b backdrop-blur-md flex items-center justify-between flex-wrap gap-3 z-20"
        [class]="headerThemeClass()">
        
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-red-900/20 text-red-700 flex items-center justify-center font-bold">
            <mat-icon class="text-lg">auto_stories</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-bold tracking-tight">دۆخی خوێندنەوەی بێ سەرلێشێوان (Academic Reading Mode)</h2>
            <div class="flex items-center gap-2 text-[10px] opacity-75 font-mono">
              <span>{{ thesisTitle() }}</span>
              <span>•</span>
              <span>کۆی وشە: {{ toKurdishNum(totalWords()) }}</span>
              <span>•</span>
              <span>کاتی پێشبینیکراو: نزیکەی {{ toKurdishNum(estimatedReadingMinutes()) }} خولەک</span>
            </div>
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Theme Switcher -->
          <div class="flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl gap-1">
            <button
              type="button"
              (click)="theme.set('harvard')"
              [class.ring-2]="theme() === 'harvard'"
              class="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E8E1D5] transition-all cursor-pointer"
              title="هارفەرد (کاغەزی ئەکادیمی)"></button>
            <button
              type="button"
              (click)="theme.set('sepia')"
              [class.ring-2]="theme() === 'sepia'"
              class="w-6 h-6 rounded-lg bg-[#F4ECD8] border border-[#DFD5BE] transition-all cursor-pointer"
              title="سێپیا (پەرتووکی کۆن)"></button>
            <button
              type="button"
              (click)="theme.set('white')"
              [class.ring-2]="theme() === 'white'"
              class="w-6 h-6 rounded-lg bg-[#FFFFFF] border border-gray-300 transition-all cursor-pointer"
              title="سپی ڕووناک"></button>
            <button
              type="button"
              (click)="theme.set('dark')"
              [class.ring-2]="theme() === 'dark'"
              class="w-6 h-6 rounded-lg bg-[#0F172A] border border-slate-700 transition-all cursor-pointer"
              title="شەوانە (تاریک)"></button>
          </div>

          <!-- Font Size Adjuster -->
          <div class="flex items-center bg-black/10 dark:bg-white/10 px-2 py-1 rounded-xl gap-1.5">
            <button
              type="button"
              (click)="decreaseFontSize()"
              class="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors text-xs font-bold cursor-pointer"
              title="بچووککردنەوەی فۆنت">
              A-
            </button>
            <span class="text-[11px] font-mono font-bold px-1">{{ fontSize() }}px</span>
            <button
              type="button"
              (click)="increaseFontSize()"
              class="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors text-xs font-bold cursor-pointer"
              title="گەورەکردنی فۆنت">
              A+
            </button>
          </div>

          <!-- Line Height Toggle -->
          <button
            type="button"
            (click)="cycleLineHeight()"
            class="px-2.5 py-1 text-xs rounded-xl bg-black/10 hover:bg-black/15 transition-all flex items-center gap-1 cursor-pointer font-sans"
            title="مەودای نێوان دێڕەکان">
            <mat-icon class="text-xs">format_line_spacing</mat-icon>
            <span class="text-[10px]">{{ lineHeightLabel() }}</span>
          </button>

          <!-- Fullscreen Toggle -->
          <button
            type="button"
            (click)="toggleFullscreen()"
            class="p-1.5 rounded-xl bg-black/10 hover:bg-black/15 transition-all cursor-pointer"
            title="شاشەی تەواو">
            <mat-icon class="text-base">{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>

          <!-- Exit Reading Mode -->
          <button
            type="button"
            (click)="close.emit()"
            class="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer ml-1"
            title="داخستن و گەڕانەوە بۆ سەرنووسەر (ESC)">
            <mat-icon class="text-sm">close</mat-icon>
            <span>دەرچوون (ESC)</span>
          </button>
        </div>
      </header>

      <!-- Main Reading Stage -->
      <div class="flex-1 overflow-y-auto px-4 py-8 sm:py-12 scroll-smooth" (scroll)="onScroll($event)" id="reading-scroll-stage">
        <main class="max-w-3xl mx-auto space-y-12 pb-24">
          
          <!-- Monograph Title Page -->
          <div class="text-center space-y-4 py-10 border-b border-current/15">
            <div class="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight leading-relaxed">
              {{ thesisTitle() }}
            </h1>
            @if (thesisAuthor()) {
              <p class="text-sm font-semibold opacity-85">
                توێژەر: {{ thesisAuthor() }}
              </p>
            }
            <p class="text-xs opacity-75 font-mono">
              پێداچوونەوەی ئەکادیمی بە پێوەرە فەرمییەکان • {{ academicDiscipline() }}
            </p>
          </div>

          <!-- Table of Contents Quick Navigation -->
          <nav class="p-5 rounded-2xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              <mat-icon class="text-sm">list</mat-icon>
              <span>پێڕستی بەشەکان (Table of Contents)</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              @for (chap of chapters(); track chap.id; let idx = $index) {
                <a
                  (click)="scrollToChapter(chap.id)"
                  class="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                  <span class="truncate">{{ toKurdishNum(idx + 1) }}. {{ chap.title }}</span>
                  <span class="text-[10px] opacity-60 font-mono">{{ toKurdishNum(chap.wordCount || 0) }} وشە</span>
                </a>
              }
            </div>
          </nav>

          <!-- Chapters Content Stream -->
          <div class="space-y-16">
            @for (chapter of chapters(); track chapter.id; let idx = $index) {
              <article [id]="'chapter-reading-' + chapter.id" class="space-y-4 scroll-mt-20">
                <div class="border-b border-current/15 pb-2">
                  <span class="text-xs text-red-700 dark:text-red-400 font-bold block mb-1">
                    بەشی {{ toKurdishNum(idx + 1) }}
                  </span>
                  <h2 class="text-xl sm:text-2xl font-bold">
                    {{ chapter.title }}
                  </h2>
                </div>

                <!-- Chapter text with formatted paragraphs -->
                <div
                  class="reading-content leading-relaxed transition-all font-serif whitespace-pre-line text-justify"
                  [style.font-size.px]="fontSize()"
                  [style.line-height]="lineHeight()">
                  {{ chapter.content || 'دەقی ئەم بەشە هێشتا نەنووسراوە...' }}
                </div>
              </article>
            }
          </div>

          <!-- Final End-of-Thesis Marker -->
          <div class="text-center pt-12 border-t border-current/15 opacity-70 space-y-2">
            <div class="text-base font-bold">◆ کۆتایی نامەی توێژینەوەی ئەکادیمی ◆</div>
            <p class="text-xs">خوێندنەوەی سەرکەوتووانەی دەقەکان بە دۆخی بێ سەرلێشێوان</p>
          </div>

        </main>
      </div>

      <!-- Bottom Floating Reading Progress Bar -->
      <footer class="shrink-0 px-6 py-2 border-t backdrop-blur-md flex items-center justify-between text-xs opacity-80"
        [class]="headerThemeClass()">
        <div class="flex items-center gap-2">
          <mat-icon class="text-sm">visibility</mat-icon>
          <span class="text-[11px]">پێشکەوتنی خوێندنەوە: {{ toKurdishNum(readingPercentage()) }}%</span>
        </div>
        <div class="w-48 bg-black/20 dark:bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div class="bg-red-800 dark:bg-red-500 h-full transition-all duration-200" [style.width.%]="readingPercentage()"></div>
        </div>
      </footer>

    </div>
  `
})
export class AcademicReadingModeComponent {
  chapters = input<ChapterItemModel[]>([]);
  thesisTitle = input<string>('نامەی توێژینەوەی ئەکادیمی');
  thesisAuthor = input<string>('');
  academicDiscipline = input<string>('زانستە مرۆڤایەتییەکان');
  close = output<void>();

  theme = signal<'harvard' | 'sepia' | 'white' | 'dark'>('harvard');
  fontSize = signal<number>(18);
  lineHeightLevel = signal<number>(2); // 1 = compact, 2 = normal, 3 = relaxed
  isFullscreen = signal<boolean>(false);
  readingPercentage = signal<number>(0);

  totalWords = computed(() => {
    return this.chapters().reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  });

  estimatedReadingMinutes = computed(() => {
    return Math.max(1, Math.ceil(this.totalWords() / 200));
  });

  themeClass = computed(() => {
    switch (this.theme()) {
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#3E2723] border-[#DFD5BE]';
      case 'white':
        return 'bg-white text-gray-900 border-gray-200';
      case 'dark':
        return 'bg-[#0F172A] text-slate-100 border-slate-800';
      case 'harvard':
      default:
        return 'bg-[#FAF7F2] text-[#2C1B18] border-[#E8E1D5]';
    }
  });

  headerThemeClass = computed(() => {
    switch (this.theme()) {
      case 'sepia':
        return 'bg-[#EFE5CE]/90 border-[#DFD5BE] text-[#3E2723]';
      case 'white':
        return 'bg-white/90 border-gray-200 text-gray-900';
      case 'dark':
        return 'bg-[#0F172A]/90 border-slate-800 text-slate-100';
      case 'harvard':
      default:
        return 'bg-[#F5F0E6]/90 border-[#E8E1D5] text-[#2C1B18]';
    }
  });

  lineHeight = computed(() => {
    switch (this.lineHeightLevel()) {
      case 1:
        return 1.6;
      case 3:
        return 2.2;
      case 2:
      default:
        return 1.9;
    }
  });

  lineHeightLabel = computed(() => {
    switch (this.lineHeightLevel()) {
      case 1:
        return 'دێڕی چڕ';
      case 3:
        return 'دێڕی فراوان';
      case 2:
      default:
        return 'دێڕی ئاسایی';
    }
  });

  onEscape(): void {
    this.close.emit();
  }

  increaseFontSize(): void {
    this.fontSize.update((s) => Math.min(32, s + 2));
  }

  decreaseFontSize(): void {
    this.fontSize.update((s) => Math.max(13, s - 2));
  }

  cycleLineHeight(): void {
    this.lineHeightLevel.update((l) => (l % 3) + 1);
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => this.isFullscreen.set(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => this.isFullscreen.set(false)).catch(() => {});
    }
  }

  scrollToChapter(chapId: number): void {
    const el = document.getElementById(`chapter-reading-${chapId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    if (scrollHeight > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
      this.readingPercentage.set(pct);
    }
  }

  toKurdishNum(val: number | string): string {
    return toSoraniNumber(val);
  }
}
