import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  public isOnline = signal<boolean>(typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true);
  public lastSyncTime = signal<string | null>(
    typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('app_last_sync_time') : null
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.performSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });
    }
  }

  performSync(): void {
    if (!this.isOnline()) return;
    const now = new Date().toISOString();
    this.lastSyncTime.set(now);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('app_last_sync_time', now);
      } catch {
        // Ignore error
      }
    }
  }
}
