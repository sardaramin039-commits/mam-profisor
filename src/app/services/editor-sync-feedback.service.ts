import { Injectable, inject, signal } from '@angular/core';
import { AutoSaveManagerService } from './auto-save-manager.service';
import { Data } from './data';
import { ChapterItemModel } from '../domain/models';

export type EditorSyncState = 'idle' | 'saving' | 'synced' | 'error';

@Injectable({
  providedIn: 'root'
})
export class EditorSyncFeedbackService {
  private autoSaveManager = inject(AutoSaveManagerService);
  private dataService = inject(Data);

  readonly isAutoSaving = signal<boolean>(false);
  readonly syncState = signal<EditorSyncState>('idle');
  readonly lastSyncTime = signal<string>('');
  readonly syncMessage = signal<string>('پاشەکەوتکردنی خۆکار چالاکە');

  private debounceTimer: any = null;
  private readonly DEBOUNCE_MS = 1400;

  constructor() {
    this.initStatusWatcher();
  }

  private initStatusWatcher(): void {
    if (typeof window === 'undefined') return;
    const initialTime = new Date().toLocaleTimeString('ckb-IQ', {
      hour: '2-digit',
      minute: '2-digit'
    });
    this.lastSyncTime.set(initialTime);
  }

  /**
   * Triggers a debounced sync whenever chapter content is edited.
   */
  scheduleSync(
    chapters: ChapterItemModel[],
    formState?: any,
    title = 'تێزی ئەکادیمی'
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.isAutoSaving.set(true);
    this.syncState.set('saving');
    this.syncMessage.set('خەریکی پاشەکەوتکردنە لە خەزێنەی بەکئێند...');

    this.debounceTimer = setTimeout(async () => {
      await this.executeSync(chapters, formState, title);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Immediately syncs content with local IndexedDB and cloud storage.
   */
  async forceSyncNow(
    chapters: ChapterItemModel[],
    formState?: any,
    title = 'تێزی ئەکادیمی'
  ): Promise<boolean> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.executeSync(chapters, formState, title);
  }

  private async executeSync(
    chapters: ChapterItemModel[],
    formState?: any,
    title = 'تێزی ئەکادیمی'
  ): Promise<boolean> {
    if (!chapters || chapters.length === 0) {
      this.isAutoSaving.set(false);
      this.syncState.set('idle');
      return false;
    }

    this.isAutoSaving.set(true);
    this.syncState.set('saving');
    this.syncMessage.set('خەریکی پاشەکەوتکردنە لە خەزێنەی بەکئێند...');

    try {
      // 1. Save to local IndexedDB and cache via AutoSaveManager
      await this.autoSaveManager.saveDraft(chapters, formState);

      // 2. Also back up to Cloud/Firebase or local offline cache via Data service
      const discipline = formState?.discipline || 'humanities';
      const academicLevel = formState?.academicLevel || 'bachelor';
      const pages = formState?.size || formState?.targetPages || 10;
      await this.dataService.saveManuscriptToCloud(
        title,
        discipline,
        academicLevel,
        pages,
        chapters
      );

      const timeStr = new Date().toLocaleTimeString('ckb-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      this.lastSyncTime.set(timeStr);
      this.syncState.set('synced');
      this.syncMessage.set(`هاوکاتکراوە لەگەڵ خەزێنەی بەکئێند (${timeStr})`);
      return true;
    } catch (err) {
      console.warn('[EditorSyncFeedback] Sync exception:', err);
      this.syncState.set('error');
      this.syncMessage.set('هەڵە لە پاشەکەوتکردنی بەکئێند');
      return false;
    } finally {
      this.isAutoSaving.set(false);
    }
  }
}
