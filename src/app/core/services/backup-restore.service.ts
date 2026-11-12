import { Injectable, inject, signal } from '@angular/core';
import { IndexedDbStorageService } from '../../services/indexed-db-storage.service';

export interface AppBackupData {
  version: string;
  createdAt: string;
  localStorageDump: Record<string, string>;
  indexedDbDump?: {
    drafts?: any[];
    books?: any[];
    cache?: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class BackupRestoreService {
  private indexedDb = inject(IndexedDbStorageService);

  public isExporting = signal<boolean>(false);
  public isImporting = signal<boolean>(false);
  public statusMessage = signal<string | null>(null);

  /**
   * Generates a complete JSON backup file of all local application data (IndexedDB + LocalStorage)
   */
  async exportFullBackup(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.isExporting.set(true);
    try {
      const dump: Record<string, string> = {};
      if (window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            dump[key] = localStorage.getItem(key) || '';
          }
        }
      }

      // Collect IndexedDB stores
      let drafts: any[] = [];
      let books: any[] = [];
      let cache: any[] = [];

      try {
        drafts = await this.indexedDb.getAll(this.indexedDb.STORES.DRAFTS);
        books = await this.indexedDb.getAll(this.indexedDb.STORES.BOOKS);
        cache = await this.indexedDb.getAll(this.indexedDb.STORES.CACHE);
      } catch (idbErr) {
        console.warn('[Backup] IndexedDB fetch warning:', idbErr);
      }

      const backup: AppBackupData = {
        version: '3.0.0',
        createdAt: new Date().toISOString(),
        localStorageDump: dump,
        indexedDbDump: {
          drafts,
          books,
          cache
        }
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `academic_thesis_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.statusMessage.set('پاشەکەوتسازیی تەواوی پڕۆژە (JSON) بە سەرکەوتوویی داگیرا!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.statusMessage.set(`هەڵە لە دروستکردنی یەدەگ: ${msg}`);
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Restores application data from a JSON backup file (IndexedDB + LocalStorage)
   */
  restoreFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.isImporting.set(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data: AppBackupData = JSON.parse(content);

          if (!data || (!data.localStorageDump && !data.indexedDbDump)) {
            throw new Error('فایلی هەڵبژێردراو بنەمای پاشەکەوتسازی تێدا نییە.');
          }

          // Restore localStorage entries
          if (data.localStorageDump) {
            Object.entries(data.localStorageDump).forEach(([key, val]) => {
              try {
                localStorage.setItem(key, val);
              } catch (lsErr) {
                console.warn('LocalStorage restore key error:', key, lsErr);
              }
            });
          }

          // Restore IndexedDB entries
          if (data.indexedDbDump) {
            if (Array.isArray(data.indexedDbDump.drafts)) {
              for (const draft of data.indexedDbDump.drafts) {
                if (draft?.key && draft?.data) {
                  await this.indexedDb.setItem(this.indexedDb.STORES.DRAFTS, draft.key, draft.data, draft.wordCount);
                }
              }
            }
            if (Array.isArray(data.indexedDbDump.books)) {
              for (const book of data.indexedDbDump.books) {
                if (book?.key && book?.data) {
                  await this.indexedDb.setItem(this.indexedDb.STORES.BOOKS, book.key, book.data);
                }
              }
            }
          }

          this.statusMessage.set('داتاکان بە سەرکەوتوویی لە فایلی یەدەگ گەڕێنرانەوە! پەڕەکە دووبارە دەکەینەوە...');
          this.isImporting.set(false);
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 1200);
          resolve(true);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.statusMessage.set(`هەڵە لە گەڕاندنەوەی داتا: ${msg}`);
          this.isImporting.set(false);
          reject(err);
        }
      };

      reader.onerror = () => {
        this.statusMessage.set('خوێندنەوەی فایلی یەدەگ سەرکەوتوو نەبوو.');
        this.isImporting.set(false);
        reject(new Error('File read error'));
      };

      reader.readAsText(file);
    });
  }
}
