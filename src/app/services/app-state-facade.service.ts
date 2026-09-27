import { Injectable, signal, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { ChapterItemModel as ChapterItem, SearchResultItem } from '../domain/models';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { ManuscriptLargeCacheService } from './manuscript-large-cache.service';
import { ManuscriptSyncService } from './manuscript-sync.service';

@Injectable({ providedIn: 'root' })
export class AppStateFacadeService {
  private editorService = inject(EditorService);
  private indexedDb = inject(IndexedDbStorageService);
  private largeCache = inject(ManuscriptLargeCacheService);
  private manuscriptSync = inject(ManuscriptSyncService);

  // Global search signals
  globalQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  searchResults = signal<SearchResultItem[]>([]);
  recentSearches = signal<string[]>(['مێتۆدۆلۆژی', 'ڕێنووسی سۆرانی', 'سەرچاوەی هارڤارد']);
  searchFeedbackMessage = signal<string>('');

  // Drag and drop signals
  dragState = signal<{ [key: string]: boolean }>({});

  setSearchQuery(query: string) {
    this.globalQuery.set(query);
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  addRecentSearch(term: string) {
    if (!term.trim()) return;
    const list = [term.trim(), ...this.recentSearches().filter(s => s !== term.trim())].slice(0, 8);
    this.recentSearches.set(list);
  }

  setDragActive(field: string, isActive: boolean) {
    this.dragState.update(s => ({ ...s, [field]: isActive }));
  }

  /**
   * Saves thesis draft using IndexedDB (preventing LocalStorage QuotaExceededError for 50,000+ words).
   */
  async saveDraftToLocalStorage(formValue: any, chapters: ChapterItem[]) {
    const title = formValue?.title || 'تێزی ئەکادیمی';
    // Transparently caches large content in IndexedDB and metadata in LocalStorage
    await this.largeCache.cacheManuscriptDraft(title, chapters, formValue, formValue?.author);
    // Notify sync service
    this.manuscriptSync.triggerSync(title, chapters, formValue);
  }

  /**
   * Loads thesis draft from IndexedDB (with fast metadata & LocalStorage fallback).
   */
  async loadDraftFromLocalStorage(): Promise<{ form: any; chapters: ChapterItem[]; timestamp: string } | null> {
    const fullDraft = await this.largeCache.retrieveFullManuscript();
    if (fullDraft && fullDraft.chapters) {
      return {
        form: fullDraft.formState || { title: fullDraft.title, author: fullDraft.author },
        chapters: fullDraft.chapters,
        timestamp: fullDraft.lastModified
      };
    }

    // Direct fallback to legacy IndexedDB or LocalStorage
    const fromIdb = await this.indexedDb.loadThesisDraft();
    if (fromIdb && fromIdb.chapters) {
      return fromIdb;
    }

    return null;
  }

  async clearLocalDraft() {
    await this.largeCache.clearManuscriptCache();
    await this.indexedDb.removeItem(this.indexedDb.STORES.DRAFTS, 'kurdish_academic_thesis_draft');
    try {
      localStorage.removeItem('kurdish_academic_thesis_draft');
      localStorage.removeItem('academic_manuscript_meta_fast_startup');
    } catch (e) {
      console.warn('Failed to clear local draft:', e);
    }
  }
}
