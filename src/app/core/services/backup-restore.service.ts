import { Injectable, signal } from '@angular/core';

export interface AppBackupData {
  version: string;
  createdAt: string;
  localStorageDump: Record<string, string>;
}

const MAX_BACKUP_FILE_BYTES = 25 * 1024 * 1024;
const MAX_BACKUP_ENTRIES = 500;
const MAX_BACKUP_STORAGE_CHARS = 5_000_000;
const MAX_BACKUP_VALUE_CHARS = 1_000_000;
const SENSITIVE_STORAGE_KEY = /(auth|token|secret|password|credential|session|firebase|supabase)/i;

function isBackupableKey(key: string): boolean {
  return key.length > 0 && key.length <= 256 && !SENSITIVE_STORAGE_KEY.test(key);
}

@Injectable({
  providedIn: 'root'
})
export class BackupRestoreService {
  public isExporting = signal<boolean>(false);
  public isImporting = signal<boolean>(false);
  public statusMessage = signal<string | null>(null);

  /**
   * Exports a bounded, unencrypted localStorage backup; server data and IndexedDB are not included.
   */
  exportFullBackup(): void {
    if (typeof window === 'undefined') return;
    this.isExporting.set(true);
    try {
      const dump: Record<string, string> = {};
      let totalChars = 0;
      if (window.localStorage) {
        for (let i = 0; i < localStorage.length && Object.keys(dump).length < MAX_BACKUP_ENTRIES; i++) {
          const key = localStorage.key(i);
          if (!key || !isBackupableKey(key)) continue;
          const value = localStorage.getItem(key);
          if (value === null || value.length > MAX_BACKUP_VALUE_CHARS) continue;
          const entryChars = key.length + value.length;
          if (totalChars + entryChars > MAX_BACKUP_STORAGE_CHARS) continue;
          dump[key] = value;
          totalChars += entryChars;
        }
      }

      const backup: AppBackupData = {
        version: '2.5.0',
        createdAt: new Date().toISOString(),
        localStorageDump: dump
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `academic_research_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.statusMessage.set('Backup ـی localStorage دابەزێنرا؛ داتای سێرڤەر و IndexedDB ناگرێتەوە. کلیلی auth/token/secret لێی لابراوە. فایلەکە encrypted نییە، بە پارێزەوە هەڵیبگرە.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.statusMessage.set(`هەڵە لە پاشەکەوتسازی: ${msg}`);
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Restores application data from a JSON backup file
   */
  restoreFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.isImporting.set(true);
      if (file.size > MAX_BACKUP_FILE_BYTES) {
        const error = new Error('Backup file exceeds the 25 MiB safety limit.');
        this.statusMessage.set('فایلی Backup زۆر گەورەیە؛ سنووری ٢٥ MiB تێپەڕاندووە.');
        this.isImporting.set(false);
        reject(error);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed: unknown = JSON.parse(content);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('فایلی Backup پێکهاتەی JSON ـی دروستی نییە.');
          }

          const candidate = parsed as Partial<AppBackupData>;
          if (
            typeof candidate.version !== 'string' ||
            !/^2\.\d+\.\d+$/.test(candidate.version) ||
            typeof candidate.createdAt !== 'string' ||
            !Number.isFinite(Date.parse(candidate.createdAt)) ||
            !candidate.localStorageDump ||
            typeof candidate.localStorageDump !== 'object' ||
            Array.isArray(candidate.localStorageDump)
          ) {
            throw new Error('وەشان یان پێکهاتەی فایلی Backup پشتڕاست نەکرایەوە.');
          }

          const entries = Object.entries(candidate.localStorageDump as Record<string, unknown>);
          if (entries.length > MAX_BACKUP_ENTRIES) {
            throw new Error('Backup contains too many storage entries.');
          }

          let totalChars = 0;
          const safeEntries: Array<[string, string]> = [];
          for (const [key, value] of entries) {
            if (typeof value !== 'string' || !isBackupableKey(key) || value.length > MAX_BACKUP_VALUE_CHARS) {
              if (typeof value !== 'string' || key.length > 256 || value.length > MAX_BACKUP_VALUE_CHARS) {
                throw new Error('Backup contains an invalid key or value.');
              }
              continue;
            }
            totalChars += key.length + value.length;
            if (totalChars > MAX_BACKUP_STORAGE_CHARS) {
              throw new Error('Backup exceeds the storage payload safety limit.');
            }
            safeEntries.push([key, value]);
          }

          // Validate the whole file first, then write only allowlisted, non-sensitive keys.
          for (const [key, value] of safeEntries) {
            localStorage.setItem(key, value);
          }

          this.statusMessage.set('داتای پشکنراو گەڕێنرایەوە؛ کلیلی auth/token/secret نەنوسرایەوە. تکایە پەڕەکە نوێ بکەرەوە.');
          this.isImporting.set(false);
          resolve(true);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.statusMessage.set(`هەڵە لە هێنانی داتا: ${msg}`);
          this.isImporting.set(false);
          reject(err);
        }
      };

      reader.onerror = () => {
        this.statusMessage.set('خوێندنەوەی فایل سەرکەوتوو نەبوو.');
        this.isImporting.set(false);
        reject(new Error('File read error'));
      };

      reader.readAsText(file);
    });
  }
}
