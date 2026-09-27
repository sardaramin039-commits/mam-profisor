import { Injectable, signal } from '@angular/core';

export interface AppBackupData {
  version: string;
  createdAt: string;
  localStorageDump: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class BackupRestoreService {
  public isExporting = signal<boolean>(false);
  public isImporting = signal<boolean>(false);
  public statusMessage = signal<string | null>(null);

  /**
   * Generates a complete JSON backup file of all local application data
   */
  exportFullBackup(): void {
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

      this.statusMessage.set('پاشەکەوتسازی (Backup) بە سەرکەوتوویی دابەزێنرا!');
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
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data: AppBackupData = JSON.parse(content);

          if (!data || !data.localStorageDump) {
            throw new Error('فایلی هەڵبژێردراو بنەمای پاشەکەوتسازی تێدا نییە.');
          }

          // Restore localStorage entries
          Object.entries(data.localStorageDump).forEach(([key, val]) => {
            localStorage.setItem(key, val);
          });

          this.statusMessage.set('داتاکان بە سەرکەوتوویی لە فایلی Backup گەڕێنرانەوە! تکایە پەڕەکە نوێ بکەرەوە.');
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
