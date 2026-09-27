import { Injectable, inject, signal } from '@angular/core';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { AppStateFacadeService } from './app-state-facade.service';
import { EditorService } from '../features/editor/services/editor';
import { ChapterItemModel } from '../domain/models';

export interface ThesisAutoSavePayload {
  chapters: ChapterItemModel[];
  formState?: any;
  timestamp: string;
  wordCount: number;
  activeChapterId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AutoSaveManagerService {
  private indexedDb = inject(IndexedDbStorageService);
  private appStateFacade = inject(AppStateFacadeService);
  private editorService = inject(EditorService);

  readonly hasLocalDraft = signal<boolean>(false);
  readonly lastAutoSaveTime = signal<string>('');
  readonly isAutoSaving = signal<boolean>(false);
  readonly saveStatusMessage = signal<string>('ئامادەی پاشەکەوتکردنی خۆکارە');
  readonly draftWordCount = signal<number>(0);

  private autoSaveTimerId: any = null;
  private lastSavedContentHash = '';

  /**
   * Initializes periodic auto-save checking and checks if an existing draft is available in IndexedDB.
   */
  async checkAndDetectDraftOnStartup(): Promise<boolean> {
    try {
      // 1. First check IndexedDB
      const draft = await this.indexedDb.loadThesisDraft();
      if (draft && draft.chapters && Array.isArray(draft.chapters) && draft.chapters.length > 0) {
        const hasContent = draft.chapters.some((c: ChapterItemModel) => (c.content || '').trim().length > 0);
        if (hasContent) {
          this.hasLocalDraft.set(true);
          const timeStr = draft.timestamp 
            ? new Date(draft.timestamp).toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' });
          this.lastAutoSaveTime.set(timeStr);
          this.draftWordCount.set(draft.wordCount || 0);
          return true;
        }
      }

      // 2. Secondary check via AppStateFacade
      const facadeDraft = await this.appStateFacade.loadDraftFromLocalStorage();
      if (facadeDraft && facadeDraft.chapters && facadeDraft.chapters.length > 0) {
        this.hasLocalDraft.set(true);
        const timeStr = facadeDraft.timestamp 
          ? new Date(facadeDraft.timestamp).toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' });
        this.lastAutoSaveTime.set(timeStr);
        return true;
      }
    } catch (err) {
      console.warn('AutoSaveManager startup check exception:', err);
    }
    this.hasLocalDraft.set(false);
    return false;
  }

  /**
   * Starts periodic timer to persist chapter drafts into IndexedDB every 30 seconds.
   */
  startPeriodicAutoSave(
    getChapters: () => ChapterItemModel[],
    getFormState?: () => any,
    intervalMs = 30000
  ): void {
    this.stopPeriodicAutoSave();

    this.autoSaveTimerId = setInterval(async () => {
      const currentChapters = getChapters();
      if (!currentChapters || currentChapters.length === 0) return;

      // Only save if there's text in at least one chapter
      const totalWords = currentChapters.reduce((sum, ch) => {
        const text = ch.content || '';
        return sum + (text.trim() ? text.trim().split(/\s+/).length : 0);
      }, 0);

      if (totalWords === 0) return;

      // Check if content actually changed
      const currentHash = JSON.stringify(currentChapters.map(c => ({ id: c.id, len: c.content?.length || 0, wc: c.wordCount })));
      if (currentHash === this.lastSavedContentHash) {
        return; // No modifications detected, avoid redundant IndexedDB writes
      }

      await this.saveDraft(currentChapters, getFormState ? getFormState() : undefined);
      this.lastSavedContentHash = currentHash;
    }, intervalMs);
  }

  /**
   * Immediately saves the current thesis draft to IndexedDB.
   */
  async saveDraft(chapters: ChapterItemModel[], formState?: any): Promise<boolean> {
    if (!chapters || chapters.length === 0) return false;

    this.isAutoSaving.set(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let wordCount = 0;
      chapters.forEach(ch => {
        const text = ch.content || '';
        if (text.trim()) {
          wordCount += text.trim().split(/\s+/).length;
        }
      });

      const payload: ThesisAutoSavePayload = {
        chapters,
        formState,
        timestamp: now.toISOString(),
        wordCount,
        activeChapterId: this.editorService.activeChapterId()
      };

      // 1. Save directly to IndexedDB
      const success = await this.indexedDb.saveThesisDraft(payload);

      // 2. Also cache through AppStateFacade for redundancy
      await this.appStateFacade.saveDraftToLocalStorage(formState, chapters);

      if (success) {
        this.lastAutoSaveTime.set(timeStr);
        this.hasLocalDraft.set(true);
        this.draftWordCount.set(wordCount);
        this.saveStatusMessage.set(`پاشەکەوتکرا لە کاتژمێر ${timeStr}`);
      }
      return success;
    } catch (e) {
      console.warn('AutoSaveManager saveDraft error:', e);
      this.saveStatusMessage.set('کێشە لە پاشەکەوتکردنی کاتی');
      return false;
    } finally {
      this.isAutoSaving.set(false);
    }
  }

  /**
   * Restores draft from IndexedDB and returns chapters and form state.
   */
  async restoreDraft(): Promise<ThesisAutoSavePayload | null> {
    try {
      // 1. Try IndexedDB first
      const draft = await this.indexedDb.loadThesisDraft();
      if (draft && draft.chapters && Array.isArray(draft.chapters) && draft.chapters.length > 0) {
        this.editorService.setChapters(draft.chapters);
        if (draft.activeChapterId) {
          this.editorService.activeChapterId.set(draft.activeChapterId);
        }
        return draft;
      }

      // 2. Fallback to AppStateFacade
      const facadeDraft = await this.appStateFacade.loadDraftFromLocalStorage();
      if (facadeDraft && facadeDraft.chapters && facadeDraft.chapters.length > 0) {
        this.editorService.setChapters(facadeDraft.chapters);
        return {
          chapters: facadeDraft.chapters,
          formState: facadeDraft.form,
          timestamp: facadeDraft.timestamp || new Date().toISOString(),
          wordCount: 0
        };
      }
    } catch (err) {
      console.warn('AutoSaveManager restoreDraft error:', err);
    }
    return null;
  }

  /**
   * Discards the local draft in IndexedDB.
   */
  async discardDraft(): Promise<void> {
    try {
      await this.indexedDb.removeItem(this.indexedDb.STORES.DRAFTS, 'kurdish_academic_thesis_draft');
      await this.appStateFacade.clearLocalDraft();
      this.hasLocalDraft.set(false);
      this.lastAutoSaveTime.set('');
      this.saveStatusMessage.set('ڕەشنووس سڕایەوە');
    } catch (e) {
      console.warn('AutoSaveManager discardDraft error:', e);
    }
  }

  /**
   * Alias for discardDraft
   */
  async clearDraft(): Promise<void> {
    return this.discardDraft();
  }

  /**
   * Accessor for last auto-save timestamp string
   */
  lastSavedTime(): string {
    return this.lastAutoSaveTime();
  }

  stopPeriodicAutoSave(): void {
    if (this.autoSaveTimerId) {
      clearInterval(this.autoSaveTimerId);
      this.autoSaveTimerId = null;
    }
  }
}
