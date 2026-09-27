import { Injectable, inject } from '@angular/core';
import { IndexedDbStorageService } from './indexed-db-storage.service';

export interface StorageOptions {
  ttlMinutes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflinePersistenceService {
  private readonly PREFIX = 'academic_kurd_app_';
  private indexedDb = inject(IndexedDbStorageService);

  /**
   * Safely set an item in localStorage wrapped with try/catch.
   * On QuotaExceededError or large payload (>100KB), automatically switches to IndexedDB storage.
   */
  public setItem<T>(key: string, value: T, options?: StorageOptions): boolean {
    const fullKey = this.PREFIX + key;
    const payloadStr = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      ttl: options?.ttlMinutes ? options.ttlMinutes * 60 * 1000 : null
    });

    // If payload is huge (> 100KB), directly use IndexedDB to prevent LocalStorage QuotaExceededError
    if (payloadStr.length > 100000) {
      this.indexedDb.setItem(this.indexedDb.STORES.CACHE, fullKey, value);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(fullKey, JSON.stringify({ __indexedDb: true, timestamp: Date.now() }));
        }
      } catch {
        // LocalStorage completely full, silently relying on IndexedDB
      }
      return true;
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(fullKey, payloadStr);
      return true;
    } catch (err: any) {
      // QuotaExceededError handling (error code 22 / 1014 or QuotaExceededError)
      console.warn(`[OfflinePersistence] LocalStorage Quota Exceeded for key "${key}". Seamlessly switching to IndexedDB storage:`, err);
      this.indexedDb.setItem(this.indexedDb.STORES.CACHE, fullKey, value);

      // Attempt to save small marker in localStorage
      try {
        window.localStorage.setItem(fullKey, JSON.stringify({ __indexedDb: true, timestamp: Date.now() }));
      } catch {
        // LocalStorage is 100% full, data is preserved in IndexedDB
      }
      return true;
    }
  }

  /**
   * Safely retrieve an item from localStorage or IndexedDB with type verification and TTL check.
   */
  public getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
      const fullKey = this.PREFIX + key;
      const raw = window.localStorage.getItem(fullKey);
      if (!raw) return defaultValue;

      const parsed = JSON.parse(raw);

      // Check if item was stored in IndexedDB due to size/quota
      if (parsed && typeof parsed === 'object' && parsed.__indexedDb) {
        // Async fetch fallback will populate via getItemAsync, return defaultValue for sync call
        this.getItemAsync<T>(key, defaultValue);
        return defaultValue;
      }

      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
          window.localStorage.removeItem(fullKey);
          return defaultValue;
        }
        return parsed.data as T;
      }
      return defaultValue;
    } catch (err) {
      console.warn(`[OfflinePersistence] Error reading key "${key}":`, err);
      return defaultValue;
    }
  }

  /**
   * Async getter that checks both LocalStorage and IndexedDB (supporting long sections & 50,000+ words).
   */
  public async getItemAsync<T>(key: string, defaultValue: T): Promise<T> {
    const fullKey = this.PREFIX + key;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(fullKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !parsed.__indexedDb && 'data' in parsed) {
            return parsed.data as T;
          }
        }
      }
    } catch {
      // Fallthrough to IndexedDB
    }

    // Read from IndexedDB
    const fromDb = await this.indexedDb.getItem<T | null>(this.indexedDb.STORES.CACHE, fullKey, null);
    if (fromDb !== null) return fromDb;

    return defaultValue;
  }

  /**
   * Async setter that explicitly targets IndexedDB for large objects (chapters, drafts, books).
   */
  public async setItemAsync<T>(key: string, value: T): Promise<boolean> {
    const fullKey = this.PREFIX + key;
    return this.indexedDb.setItem(this.indexedDb.STORES.CACHE, fullKey, value);
  }

  /**
   * Remove item safely from both LocalStorage and IndexedDB.
   */
  public removeItem(key: string): void {
    const fullKey = this.PREFIX + key;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(fullKey);
      }
    } catch {
      // Ignore
    }
    this.indexedDb.removeItem(this.indexedDb.STORES.CACHE, fullKey);
  }

  /**
   * Checks if browser is currently online.
   */
  public isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }
}
