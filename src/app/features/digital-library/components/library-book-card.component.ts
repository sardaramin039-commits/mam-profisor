import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryBook } from '../../../models/digital-library.model';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-book-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group relative bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between">
      
      <!-- Top Badges & Bookmark Action -->
      <div class="relative w-full h-56 overflow-hidden bg-stone-950 flex items-center justify-center">
        <!-- Cover Image with referrerpolicy -->
        <img
          [src]="book().coverImage"
          [alt]="book().title"
          referrerpolicy="no-referrer"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />

        <!-- Dark Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80"></div>

        <!-- Top Right Source Library Badge -->
        <div class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-stone-900/90 backdrop-blur-md border border-stone-700/80 text-[11px] font-medium text-amber-300 flex items-center gap-1 shadow-md max-w-[80%] truncate">
          <mat-icon class="!w-3.5 !h-3.5 text-amber-400">{{ book().verified ? "verified" : "hourglass_empty" }}</mat-icon>
          <span class="truncate">{{ book().sourceName }}</span>
        </div>

        <!-- Top Left Language & Document Type Badge -->
        <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span class="px-2 py-0.5 rounded-md bg-amber-500/90 text-stone-950 font-bold text-[10px] uppercase tracking-wider shadow">
            {{ getLangName(book().language) }}
          </span>
          <span class="px-2 py-0.5 rounded-md bg-stone-800/90 text-stone-300 font-sans text-[10px] border border-stone-700">
            {{ getDocTypeName(book().documentType) }}
          </span>
        </div>

        <!-- Bookmark Floating Button -->
        <button
          (click)="lib.toggleBookmark(book()); $event.stopPropagation()"
          [class]="lib.isBookmarked(book().id) ? 'bg-amber-500 text-stone-950' : 'bg-stone-900/80 text-stone-300 hover:text-amber-400'"
          class="absolute bottom-3 left-3 w-9 h-9 rounded-full backdrop-blur-md border border-stone-700 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
          [title]="lib.isBookmarked(book().id) ? 'پاشەکەوتکراوە' : 'پاشەکەوتکردن'"
        >
          <mat-icon class="!w-5 !h-5">
            {{ lib.isBookmarked(book().id) ? 'bookmark' : 'bookmark_border' }}
          </mat-icon>
        </button>

        <!-- Publication Year Tag -->
        <div class="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-stone-300 text-[11px] font-mono">
          {{ book().year }}
        </div>
      </div>

      <!-- Card Content -->
      <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <!-- Title -->
          <h3 class="font-serif font-bold text-base text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            {{ book().title }}
          </h3>

          <!-- Author -->
          <p class="text-xs text-stone-400 font-medium mt-1 flex items-center gap-1">
            <mat-icon class="!w-3.5 !h-3.5 text-stone-500">person</mat-icon>
            <span>{{ book().author }}</span>
          </p>

          <!-- Short Description -->
          <p class="text-xs text-stone-400/90 line-clamp-2 mt-2 leading-relaxed font-sans">
            {{ book().description }}
          </p>
        </div>

        <!-- Subjects Chips -->
        <div class="flex flex-wrap gap-1 pt-1">
          @for (s of book().subjects.slice(0, 3); track s) {
            <span class="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md border border-stone-700/60 font-sans">
              #{{ s }}
            </span>
          }
        </div>

        <!-- Bottom Action Buttons -->
        <div class="pt-3 border-t border-stone-800/80 flex items-center gap-2">
          
          <!-- Read Online Modal Button -->
          <button
            (click)="lib.openReader(book())"
            class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <mat-icon class="!w-4 !h-4">menu_book</mat-icon>
            <span>{{ lib.t().readOnline }}</span>
          </button>

          <!-- Insert to Thesis / Cite Button -->
          <button
            type="button"
            (click)="lib.insertBookToEditor(book()); $event.stopPropagation()"
            class="py-2 px-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-amber-300 font-sans font-bold text-xs rounded-xl border border-stone-700 transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            title="ئاماژەدان لە دەقی تێزدا و تۆمارکردن لە کۆگای سەرچاوەکان"
          >
            <mat-icon class="!w-4 !h-4 text-amber-400">format_quote</mat-icon>
            <span class="hidden sm:inline">ئاماژەدان</span>
          </button>

          <!-- Download is only offered after authoritative verification. -->
          @if (book().verified && book().downloadUrl) {
            <a
              [href]="book().downloadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 rounded-xl border border-stone-700 transition-colors flex items-center justify-center"
              title="دابەزاندنی PDF ـی پشکنراو"
            >
              <mat-icon class="!w-4 !h-4">download</mat-icon>
            </a>
          }

          <!-- External Source Link -->
          <a
            [href]="book().sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 rounded-xl border border-stone-700 transition-colors flex items-center justify-center"
            title="سەردانی سەرچاوەی پێشنیارکراو"
          >
            <mat-icon class="!w-4 !h-4">open_in_new</mat-icon>
          </a>

        </div>

      </div>

    </div>
  `
})
export class LibraryBookCardComponent {
  public book = input.required<LibraryBook>();
  public lib = inject(DigitalLibraryService);

  public getLangName(code: string): string {
    const map: Record<string, string> = {
      ckb: 'سۆرانی',
      kmr: 'Kurmancî',
      ar: 'العربية',
      en: 'English',
      fa: 'فارسی',
      tr: 'Türkçe'
    };
    return map[code] || code;
  }

  public getDocTypeName(type: string): string {
    const map: Record<string, string> = {
      book: 'کتێب',
      article: 'وتار',
      journal: 'گۆڤار',
      thesis: 'تێز',
      manuscript: 'دەستنووس',
      archive: 'ئەرشیڤ'
    };
    return map[type] || type;
  }
}
