import { Injectable, signal } from '@angular/core';
import {
  APP_BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  filterBackupEntries,
  validateBackupPayload,
  type AppBackupData
} from './backup-restore-policy';

export type { AppBackupData } from './backup-restore-policy';

@Injectable({
  providedIn: 'root'
})
export class BackupRestoreService {
  public isExporting = signal<boolean>(false);
  public isImporting = signal<boolean>(false);
  public statusMessage = signal<string | null>(null);

  /**
   * Exports only allow-listed application data. Firebase credentials, tokens,
   * arbitrary origin storage and unrelated keys are never included.
   */
  exportFullBackup(): void {
    if (typeof window === 'undefined') return;

    this.isExporting.set(true);
    try {
      const dump: Record<string, string> = Object.create(null) as Record<string, string>;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        const value = window.localStorage.getItem(key);
        if (value !== null) dump[key] = value;
      }

      const localStorageDump = filterBackupEntries(dump);
      if (Object.keys(localStorageDump).length === 0) {
        throw new Error('هیچ داتایەکی ناسەلامەت‌نەبووی ئەپ بۆ پاشەکەوتکردن نەدۆزرایەوە.');
      }

      const backup: AppBackupData = {
        version: APP_BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        localStorageDump
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      if (blob.size > MAX_BACKUP_BYTES) {
        throw new Error('قەبارەی پاشەکەوتسازی لە سنووری ڕێگەپێدراو زیاترە.');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academic_research_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.statusMessage.set('پاشەکەوتسازیی داتای ئەپی پارێزراو بە سەرکەوتوویی ئامادە کرا.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.statusMessage.set(`هەڵە لە پاشەکەوتسازی: ${msg}`);
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Restores only validated, allow-listed application keys and rolls back
   * already-written entries if any storage write fails.
   */
  restoreFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Restore is available only in a browser.'));
        return;
      }

      if (!file || file.size <= 0 || file.size > MAX_BACKUP_BYTES) {
        const error = new Error('قەبارەی فایلی پاشەکەوتسازی نادروستە یان لە سنووری ڕێگەپێدراو زیاترە.');
        this.statusMessage.set(error.message);
        reject(error);
        return;
      }

      this.isImporting.set(true);
      const reader = new FileReader();

      const finish = () => this.isImporting.set(false);

      reader.onload = (event) => {
        try {
          const rawText = typeof event.target?.result === 'string' ? event.target.result : '';
          if (!rawText) throw new Error('ناوەڕۆکی فایلی پاشەکەوتسازی بەتاڵە.');

          const validation = validateBackupPayload(JSON.parse(rawText) as unknown);
          if (!validation.ok) throw new Error(validation.error);

          const entries = Object.entries(validation.data.localStorageDump);
          const previousValues = new Map<string, string | null>();

          try {
            for (const [key, value] of entries) {
              previousValues.set(key, window.localStorage.getItem(key));
              window.localStorage.setItem(key, value);
            }
          } catch (restoreError) {
            for (const [key, previousValue] of Array.from(previousValues.entries()).reverse()) {
              try {
                if (previousValue === null) window.localStorage.removeItem(key);
                else window.localStorage.setItem(key, previousValue);
              } catch {
                // Continue best-effort rollback for the remaining keys.
              }
            }
            throw new Error('نوێکردنەوەی داتا سەرکەوتوو نەبوو؛ هەوڵی گەڕاندنەوەی داتای پێشوو درا.');
          }

          this.statusMessage.set('داتای ئەپی پارێزراو گەڕێنرایەوە. تکایە پەڕەکە نوێ بکەرەوە.');
          resolve(true);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.statusMessage.set(`هەڵە لە گەڕاندنەوەی داتا: ${msg}`);
          reject(err);
        } finally {
          finish();
        }
      };

      reader.onerror = () => {
        const error = new Error('خوێندنەوەی فایلی پاشەکەوتسازی سەرکەوتوو نەبوو.');
        this.statusMessage.set(error.message);
        finish();
        reject(error);
      };

      reader.readAsText(file);
    });
  }
}
