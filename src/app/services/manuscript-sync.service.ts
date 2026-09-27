import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { ManuscriptLargeCacheService, ManuscriptMetadata } from './manuscript-large-cache.service';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { EditorService } from '../features/editor/services/editor';
import { ChapterItemModel as ChapterItem } from '../domain/models';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'migrated' | 'error';

export interface ManuscriptSyncStats {
  totalWords: number;
  totalChapters: number;
  isLargeDraft: boolean;
  storageTarget: 'LocalStorage' | 'IndexedDB' | 'Hybrid';
  lastSynced: string | null;
  migratedBytes: number;
}

@Injectable({
  providedIn: 'root'
})
export class ManuscriptSyncService implements OnDestroy {
  private cacheService = inject(ManuscriptLargeCacheService);
  private indexedDb = inject(IndexedDbStorageService);
  private editorService = inject(EditorService);

  public syncState = signal<SyncState>('idle');
  public lastSyncTime = signal<Date | null>(null);
  public stats = signal<ManuscriptSyncStats>({
    totalWords: 0,
    totalChapters: 0,
    isLargeDraft: false,
    storageTarget: 'Hybrid',
    lastSynced: null,
    migratedBytes: 0
  });

  private syncDebounceTimer: any = null;
  private autoSyncIntervalTimer: any = null;
  private readonly AUTO_SYNC_INTERVAL_MS = 25000; // 25 seconds auto background check

  constructor() {
    this.initAutoSync();
  }

  /**
   * Initializes background automatic synchronization and migration listener.
   */
  private initAutoSync(): void {
    if (typeof window === 'undefined') return;

    // Periodic check to ensure offline sync & large draft migration
    this.autoSyncIntervalTimer = setInterval(() => {
      this.checkAndMigrateLargeDraft();
    }, this.AUTO_SYNC_INTERVAL_MS);
  }

  /**
   * Trigger debounced synchronization when editor state updates.
   */
  public triggerSync(title: string, chapters: ChapterItem[], formValue?: any): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncState.set('syncing');
    this.syncDebounceTimer = setTimeout(async () => {
      await this.executeSync(title, chapters, formValue);
    }, 1500);
  }

  /**
   * Directly executes sync & transparent migration.
   */
  public async executeSync(
    title: string,
    chapters: ChapterItem[],
    formValue?: any
  ): Promise<ManuscriptSyncStats> {
    try {
      this.syncState.set('syncing');
      const result = await this.cacheService.cacheManuscriptDraft(title, chapters, formValue);

      const payloadSize = JSON.stringify(chapters).length;
      const newStats: ManuscriptSyncStats = {
        totalWords: result.wordCount,
        totalChapters: chapters.length,
        isLargeDraft: result.isLarge,
        storageTarget: result.isLarge ? 'IndexedDB' : 'Hybrid',
        lastSynced: new Date().toISOString(),
        migratedBytes: payloadSize
      };

      this.stats.set(newStats);
      this.lastSyncTime.set(new Date());
      this.syncState.set(result.isLarge ? 'migrated' : 'synced');
      return newStats;
    } catch (err) {
      console.warn('[ManuscriptSync] Synchronization error:', err);
      this.syncState.set('error');
      return this.stats();
    }
  }

  /**
   * Transparently checks if old large drafts exist in LocalStorage and migrates them to IndexedDB.
   */
  public async checkAndMigrateLargeDraft(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    try {
      const draftKey = 'kurdish_academic_thesis_draft';
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return false;

      // If already marked as indexedDb, no migration needed
      const parsed = JSON.parse(raw);
      if (parsed && parsed.__indexedDb) return false;

      // Large draft found in localStorage: Migrate to IndexedDB!
      if (parsed && (parsed.chapters || raw.length > 50000)) {
        this.syncState.set('syncing');
        await this.indexedDb.setItem(
          this.indexedDb.STORES.DRAFTS,
          draftKey,
          parsed,
          parsed.chapters ? this.cacheService.calculateTotalWordCount(parsed.chapters) : 0
        );

        // Replace bulky LocalStorage content with lightweight pointer
        window.localStorage.setItem(draftKey, JSON.stringify({
          __indexedDb: true,
          migratedAt: new Date().toISOString(),
          chapterCount: parsed.chapters?.length || 0
        }));

        this.syncState.set('migrated');
        return true;
      }
    } catch (err) {
      console.warn('[ManuscriptSync] Migration check encountered non-fatal issue:', err);
    }
    return false;
  }

  /**
   * Fast startup loader: provides quick metadata immediately, then hydrates full manuscript asynchronously.
   */
  public async loadInitialManuscript(
    onMetadataReady?: (meta: ManuscriptMetadata) => void,
    onFullManuscriptReady?: (draft: any) => void
  ): Promise<any | null> {
    // 1. Fast sync read from LocalStorage metadata
    const meta = this.cacheService.getFastStartupMetadata();
    if (meta && onMetadataReady) {
      onMetadataReady(meta);
    }

    // 2. Full async hydration from IndexedDB
    const fullDraft = await this.cacheService.retrieveFullManuscript();
    if (fullDraft && onFullManuscriptReady) {
      onFullManuscriptReady(fullDraft);
    }
    return fullDraft;
  }

  ngOnDestroy(): void {
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    if (this.autoSyncIntervalTimer) clearInterval(this.autoSyncIntervalTimer);
  }
}
