import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import {
  LibraryBook,
  LibrarySource,
  SearchFilter,
  BookmarkItem,
  ReadingProgress,
  SupportedLanguage,
  CrawlerSyncLog
} from '../models/digital-library.model';
import { DIGITAL_LIBRARY_SOURCES } from '../../services/digital-library-sources';
import { INITIAL_LIBRARY_BOOKS } from '../../services/kurdish-books-catalog';

import type { UIStrings } from '../models/digital-library-i18n';
import { I18N_DICTIONARY } from '../models/digital-library-i18n';
export type { UIStrings } from '../models/digital-library-i18n';
export { I18N_DICTIONARY } from '../models/digital-library-i18n';

@Injectable({
  providedIn: 'root'
})
export class DigitalLibraryService {
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbStorageService);

  // Core state signals
  public books = signal<LibraryBook[]>([...INITIAL_LIBRARY_BOOKS]);
  public sources = signal<LibrarySource[]>([...DIGITAL_LIBRARY_SOURCES]);
  public currentLanguage = signal<SupportedLanguage>('ckb');
  public isDarkMode = signal<boolean>(false);
  public activeBook = signal<LibraryBook | null>(null);
  public isReaderOpen = signal<boolean>(false);
  public isSyncing = signal<boolean>(false);
  public ocrTextResult = signal<string | null>(null);
  public isOcrProcessing = signal<boolean>(false);

  constructor() {
    this.initIndexedDbArchive();
  }

  /**
   * Initializes IndexedDB storage for the local seed catalog & archive.
   */
  private async initIndexedDbArchive() {
    try {
      // 1. Save the local seed catalog to IndexedDB
      await this.indexedDb.saveAcademicBooksArchive(INITIAL_LIBRARY_BOOKS);

      // 2. Load custom bookmarks & history from IndexedDB if available
      const idbBookmarks = await this.indexedDb.getItem<BookmarkItem[] | null>(this.indexedDb.STORES.CACHE, 'kurdish_library_bookmarks', null);
      if (idbBookmarks && Array.isArray(idbBookmarks) && idbBookmarks.length > 0) {
        this.bookmarks.set(idbBookmarks);
      }

      const idbHistory = await this.indexedDb.getItem<ReadingProgress[] | null>(this.indexedDb.STORES.CACHE, 'kurdish_library_history', null);
      if (idbHistory && Array.isArray(idbHistory) && idbHistory.length > 0) {
        this.readingHistory.set(idbHistory);
      }
    } catch (err) {
      console.warn('[DigitalLibrary] IndexedDB archive initialization fallback:', err);
    }
  }

  // Search filter state
  public filters = signal<SearchFilter>({
    query: '',
    language: 'all',
    sourceId: 'all',
    subject: 'all',
    yearMin: 1500,
    yearMax: 2026,
    docType: 'all',
    author: '',
    sortBy: 'relevance'
  });

  // Saved user personal data signals
  public bookmarks = signal<BookmarkItem[]>(this.loadStoredBookmarks());
  public readingHistory = signal<ReadingProgress[]>(this.loadStoredHistory());

  // Current localized text helper
  public t = computed(() => I18N_DICTIONARY[this.currentLanguage()]);

  // Is current language RTL
  public isRtl = computed(() => {
    const lang = this.currentLanguage();
    return lang === 'ckb' || lang === 'ar' || lang === 'fa';
  });

  // All unique subjects from catalog
  public availableSubjects = computed(() => {
    const set = new Set<string>();
    for (const book of this.books()) {
      book.subjects.forEach(s => set.add(s));
    }
    return Array.from(set).sort();
  });

  // Filtered Books computed state
  public filteredBooks = computed(() => {
    const all = this.books();
    const f = this.filters();
    const q = f.query.trim().toLowerCase();

    return all.filter(book => {
      // Query search matching title, author, description, or subjects
      if (q) {
        const titleMatch = book.title.toLowerCase().includes(q);
        const authorMatch = book.author.toLowerCase().includes(q);
        const descMatch = book.description.toLowerCase().includes(q);
        const subjectMatch = book.subjects.some(s => s.toLowerCase().includes(q));
        if (!titleMatch && !authorMatch && !descMatch && !subjectMatch) {
          return false;
        }
      }

      // Language filter
      if (f.language !== 'all' && book.language !== f.language) {
        return false;
      }

      // Source filter
      if (f.sourceId !== 'all' && book.sourceId !== f.sourceId) {
        return false;
      }

      // Subject filter
      if (f.subject !== 'all' && !book.subjects.includes(f.subject)) {
        return false;
      }

      // Doc type filter
      if (f.docType !== 'all' && book.documentType !== f.docType) {
        return false;
      }

      // Author search
      if (f.author && !book.author.toLowerCase().includes(f.author.toLowerCase())) {
        return false;
      }

      // Year range filter
      if (book.year < f.yearMin || book.year > f.yearMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (f.sortBy === 'year_desc') return b.year - a.year;
      if (f.sortBy === 'year_asc') return a.year - b.year;
      if (f.sortBy === 'title') return a.title.localeCompare(b.title);
      if (f.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // relevance
    });
  });

  // Bookmark actions
  public isBookmarked(bookId: string): boolean {
    return this.bookmarks().some(b => b.bookId === bookId);
  }

  public toggleBookmark(book: LibraryBook): void {
    const list = [...this.bookmarks()];
    const index = list.findIndex(b => b.bookId === book.id);

    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.unshift({
        id: `bm-${Date.now()}`,
        userId: 'local-user',
        bookId: book.id,
        bookTitle: book.title,
        coverImage: book.coverImage,
        author: book.author,
        addedAt: new Date().toISOString()
      });
    }

    this.bookmarks.set(list);
    this.saveStoredBookmarks(list);
  }

  // Reading history logger
  public updateReadingProgress(book: LibraryBook, currentPage: number, totalPages = 100): void {
    const list = [...this.readingHistory()];
    const index = list.findIndex(r => r.bookId === book.id);
    const percentage = Math.round((currentPage / totalPages) * 100);

    const item: ReadingProgress = {
      id: index >= 0 ? list[index].id : `rh-${Date.now()}`,
      userId: 'local-user',
      bookId: book.id,
      bookTitle: book.title,
      coverImage: book.coverImage,
      currentPage,
      totalPages,
      percentage,
      lastReadAt: new Date().toISOString()
    };

    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }

    this.readingHistory.set(list);
    this.saveStoredHistory(list);
  }

  // Reader modal opener
  public openReader(book: LibraryBook): void {
    this.activeBook.set(book);
    this.isReaderOpen.set(true);
    this.updateReadingProgress(book, 1, book.pageCount || 100);
  }

  public closeReader(): void {
    this.isReaderOpen.set(false);
  }

  // Filter setters
  public updateSearchQuery(query: string): void {
    this.filters.update(f => ({ ...f, query }));
  }

  public updateFilter<K extends keyof SearchFilter>(key: K, value: SearchFilter[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  public resetFilters(): void {
    this.filters.set({
      query: '',
      language: 'all',
      sourceId: 'all',
      subject: 'all',
      yearMin: 1500,
      yearMax: 2026,
      docType: 'all',
      author: '',
      sortBy: 'relevance'
    });
  }

  public clearFilters(): void {
    this.resetFilters();
  }

  // OCR Processing using a real uploaded page image.
  public performOcr(imageDataUrl: string): void {
    if (!imageDataUrl.startsWith('data:image/')) {
      this.ocrTextResult.set('تەنها وێنەی لاپەڕە بۆ OCR ڕێگەپێدراوە.');
      return;
    }

    this.isOcrProcessing.set(true);
    this.ocrTextResult.set(null);

    this.http.post<{ text: string }>('/api/library/ocr', { imageDataUrl })
      .subscribe({
        next: (res) => {
          this.ocrTextResult.set(res.text);
          this.isOcrProcessing.set(false);
        },
        error: (err) => {
          console.warn('OCR server request failed:', err);
          this.ocrTextResult.set('OCR سەرکەوتوو نەبوو. تکایە وێنەکە دووبارە هەڵبژێرە یان دواتر هەوڵ بدەرەوە.');
          this.isOcrProcessing.set(false);
        }
      });
  }

  // Manual Crawler Sync Trigger
  public triggerSync(): void {
    this.isSyncing.set(true);
    this.http.post<{ message: string; log: CrawlerSyncLog }>('/api/library/sync', {})
      .subscribe({
        next: () => {
          this.isSyncing.set(false);
          // Add newly indexed book if any
        },
        error: () => {
          setTimeout(() => {
            this.isSyncing.set(false);
          }, 1500);
        }
      });
  }

  // Local storage & IndexedDB helpers
  private loadStoredBookmarks(): BookmarkItem[] {
    try {
      const data = localStorage.getItem('kurdish_library_bookmarks');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredBookmarks(list: BookmarkItem[]): void {
    this.indexedDb.setItem(this.indexedDb.STORES.CACHE, 'kurdish_library_bookmarks', list);
    try {
      localStorage.setItem('kurdish_library_bookmarks', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage unavailable or quota exceeded, bookmarks saved in IndexedDB', e);
    }
  }

  private loadStoredHistory(): ReadingProgress[] {
    try {
      const data = localStorage.getItem('kurdish_library_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredHistory(list: ReadingProgress[]): void {
    this.indexedDb.setItem(this.indexedDb.STORES.CACHE, 'kurdish_library_history', list);
    try {
      localStorage.setItem('kurdish_library_history', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage unavailable or quota exceeded, history saved in IndexedDB', e);
    }
  }
}
