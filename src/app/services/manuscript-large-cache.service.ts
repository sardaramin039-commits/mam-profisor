import { Injectable, inject, signal } from '@angular/core';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { ChapterItemModel as ChapterItem } from '../domain/models';

export interface LargeManuscriptDraft {
  id: string;
  title: string;
  author?: string;
  abstract?: string;
  chapters: ChapterItem[];
  wordCount: number;
  characterCount: number;
  lastModified: string;
  isLargeDraft: boolean; // true if > 50,000 words or large payload
  formState?: any;
  revisionNumber: number;
}

export interface ManuscriptMetadata {
  id: string;
  title: string;
  author?: string;
  wordCount: number;
  chapterCount: number;
  chapterSummaries: { id: string | number; title: string; wordCount: number }[];
  lastModified: string;
  storedInIndexedDb: boolean;
  revisionNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class ManuscriptLargeCacheService {
  private indexedDb = inject(IndexedDbStorageService);

  private readonly METADATA_STORAGE_KEY = 'academic_manuscript_meta_fast_startup';
  private readonly MAIN_DRAFT_KEY = 'kurdish_academic_thesis_draft';
  private readonly LARGE_THRESHOLD_WORDS = 50000;

  public isSaving = signal<boolean>(false);
  public lastSavedTime = signal<string | null>(null);
  public cachedWordCount = signal<number>(0);
  public isLargeManuscript = signal<boolean>(false);

  /**
   * Calculates total word count across chapters and content.
   */
  public calculateTotalWordCount(chapters: ChapterItem[], extraContent?: string): number {
    let count = 0;
    if (chapters && Array.isArray(chapters)) {
      for (const ch of chapters) {
        if (ch.content) {
          const words = ch.content.trim().split(/\s+/).filter(Boolean);
          count += words.length;
        }
      }
    }
    if (extraContent) {
      count += extraContent.trim().split(/\s+/).filter(Boolean).length;
    }
    return count;
  }

  /**
   * Caches a large manuscript draft safely in IndexedDB, completely preventing LocalStorage QuotaExceededError.
   */
  public async cacheManuscriptDraft(
    title: string,
    chapters: ChapterItem[],
    formState?: any,
    author?: string
  ): Promise<{ success: boolean; isLarge: boolean; wordCount: number }> {
    this.isSaving.set(true);
    try {
      const wordCount = this.calculateTotalWordCount(chapters);
      const isLarge = wordCount >= this.LARGE_THRESHOLD_WORDS;
      this.cachedWordCount.set(wordCount);
      this.isLargeManuscript.set(isLarge);

      const timestamp = new Date().toISOString();
      const draft: LargeManuscriptDraft = {
        id: this.MAIN_DRAFT_KEY,
        title: title || 'تێزی ئەکادیمی',
        author: author || '',
        chapters,
        wordCount,
        characterCount: chapters.reduce((acc, c) => acc + (c.content?.length || 0), 0),
        lastModified: timestamp,
        isLargeDraft: isLarge,
        formState,
        revisionNumber: Date.now()
      };

      // 1. Primary write to IndexedDB (unlimited capacity)
      const idbSuccess = await this.indexedDb.setItem(
        this.indexedDb.STORES.DRAFTS,
        this.MAIN_DRAFT_KEY,
        draft,
        wordCount
      );

      // 2. Save slim metadata in LocalStorage for instant UI startup
      this.saveLightweightMetadata(draft);

      this.lastSavedTime.set(timestamp);
      this.isSaving.set(false);
      return { success: idbSuccess, isLarge, wordCount };
    } catch (err) {
      console.warn('[ManuscriptLargeCache] Error caching large manuscript draft:', err);
      this.isSaving.set(false);
      return { success: false, isLarge: false, wordCount: 0 };
    }
  }

  /**
   * Retrieves the full manuscript draft from IndexedDB (with LocalStorage fallback).
   */
  public async retrieveFullManuscript(): Promise<LargeManuscriptDraft | null> {
    try {
      // 1. Try IndexedDB first
      const draft = await this.indexedDb.getItem<LargeManuscriptDraft | null>(
        this.indexedDb.STORES.DRAFTS,
        this.MAIN_DRAFT_KEY,
        null
      );

      if (draft && draft.chapters) {
        this.cachedWordCount.set(draft.wordCount || this.calculateTotalWordCount(draft.chapters));
        this.isLargeManuscript.set((draft.wordCount || 0) >= this.LARGE_THRESHOLD_WORDS);
        return draft;
      }

      // 2. Fallback to LocalStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.MAIN_DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && !parsed.__indexedDb && parsed.chapters) {
            return {
              id: this.MAIN_DRAFT_KEY,
              title: parsed.form?.title || 'تێزی ئەکادیمی',
              chapters: parsed.chapters,
              wordCount: this.calculateTotalWordCount(parsed.chapters),
              characterCount: 0,
              lastModified: parsed.timestamp || new Date().toISOString(),
              isLargeDraft: false,
              formState: parsed.form,
              revisionNumber: 1
            };
          }
        }
      }
    } catch (err) {
      console.warn('[ManuscriptLargeCache] Failed to retrieve manuscript:', err);
    }
    return null;
  }

  /**
   * Writes small metadata (< 2KB) to LocalStorage for instant boot time.
   */
  private saveLightweightMetadata(draft: LargeManuscriptDraft): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const metadata: ManuscriptMetadata = {
        id: draft.id,
        title: draft.title,
        author: draft.author,
        wordCount: draft.wordCount,
        chapterCount: draft.chapters.length,
        chapterSummaries: draft.chapters.map(c => ({
          id: c.id,
          title: c.title,
          wordCount: (c.content || '').trim().split(/\s+/).filter(Boolean).length
        })),
        lastModified: draft.lastModified,
        storedInIndexedDb: true,
        revisionNumber: draft.revisionNumber
      };

      window.localStorage.setItem(this.METADATA_STORAGE_KEY, JSON.stringify(metadata));
      
      // Also write tiny pointer key for backward compatibility
      window.localStorage.setItem(this.MAIN_DRAFT_KEY, JSON.stringify({
        __indexedDb: true,
        wordCount: draft.wordCount,
        timestamp: draft.lastModified
      }));
    } catch {
      // LocalStorage full, metadata ignored safely
    }
  }

  /**
   * Reads fast startup metadata synchronously from LocalStorage.
   */
  public getFastStartupMetadata(): ManuscriptMetadata | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(this.METADATA_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ManuscriptMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Clears the cached manuscript from IndexedDB and LocalStorage.
   */
  public async clearManuscriptCache(): Promise<boolean> {
    const success = await this.indexedDb.removeItem(this.indexedDb.STORES.DRAFTS, this.MAIN_DRAFT_KEY);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.METADATA_STORAGE_KEY);
        window.localStorage.removeItem(this.MAIN_DRAFT_KEY);
      } catch {
        // Ignore
      }
    }
    this.cachedWordCount.set(0);
    this.isLargeManuscript.set(false);
    return success;
  }
}
