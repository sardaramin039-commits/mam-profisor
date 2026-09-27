import { Injectable, inject, signal } from '@angular/core';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { ManuscriptLargeCacheService } from './manuscript-large-cache.service';
import { CacheService } from '../core/services/cache.service';

export interface StorageDetailedMetrics {
  localStorageBytes: number;
  localStorageKB: number;
  localStorageFormatted: string;
  indexedDbBytes: number;
  indexedDbKB: number;
  indexedDbFormatted: string;
  totalUsedBytes: number;
  totalUsedFormatted: string;
  quotaBytes: number;
  quotaMB: number;
  percentUsed: number;
  localStorageSplitPercent: number;
  indexedDbSplitPercent: number;
  isQuotaSafe: boolean;
  draftsCount: number;
  booksCount: number;
  cacheItemsCount: number;
  totalWordsCached: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageManagerService {
  private indexedDb = inject(IndexedDbStorageService);
  private largeCacheService = inject(ManuscriptLargeCacheService);
  private generalCacheService = inject(CacheService);

  public isRefreshing = signal<boolean>(false);
  public metrics = signal<StorageDetailedMetrics>({
    localStorageBytes: 0,
    localStorageKB: 0,
    localStorageFormatted: '0 KB',
    indexedDbBytes: 0,
    indexedDbKB: 0,
    indexedDbFormatted: '0 MB',
    totalUsedBytes: 0,
    totalUsedFormatted: '0 KB',
    quotaBytes: 1024 * 1024 * 1024,
    quotaMB: 1024,
    percentUsed: 0,
    localStorageSplitPercent: 0,
    indexedDbSplitPercent: 0,
    isQuotaSafe: true,
    draftsCount: 0,
    booksCount: 0,
    cacheItemsCount: 0,
    totalWordsCached: 0
  });

  constructor() {
    this.refreshMetrics();
  }

  /**
   * Refreshes all storage usage statistics across LocalStorage and IndexedDB.
   */
  public async refreshMetrics(): Promise<StorageDetailedMetrics> {
    this.isRefreshing.set(true);
    try {
      // 1. Calculate LocalStorage size
      let lsBytes = 0;
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            const val = window.localStorage.getItem(key) || '';
            lsBytes += (key.length + val.length) * 2; // UTF-16 approximate bytes
          }
        }
      }

      // 2. Query Browser Storage Quota & IndexedDB Estimate
      let idbBytes = 0;
      let quotaBytes = 1024 * 1024 * 1024; // 1 GB fallback
      let totalUsage = lsBytes;

      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const browserUsage = estimate.usage || 0;
        quotaBytes = estimate.quota || (1024 * 1024 * 1024);
        
        // IndexedDB is the major portion of browser navigator.storage.estimate minus localStorage
        idbBytes = Math.max(0, browserUsage - lsBytes);
        totalUsage = browserUsage || (lsBytes + idbBytes);
      }

      // 3. Count IndexedDB stores
      const drafts = await this.indexedDb.getAll(this.indexedDb.STORES.DRAFTS);
      const books = await this.indexedDb.getAll(this.indexedDb.STORES.BOOKS);
      const caches = await this.indexedDb.getAll(this.indexedDb.STORES.CACHE);

      const totalWords = drafts.reduce((acc: number, d: any) => acc + (d?.wordCount || 0), 0);

      // 4. Calculate Split Percentages
      const combined = Math.max(1, lsBytes + idbBytes);
      const lsSplit = Math.round((lsBytes / combined) * 100);
      const idbSplit = Math.max(0, 100 - lsSplit);

      const percentOfQuota = quotaBytes > 0 ? Math.round((totalUsage / quotaBytes) * 100) : 0;

      const newMetrics: StorageDetailedMetrics = {
        localStorageBytes: lsBytes,
        localStorageKB: Math.round(lsBytes / 1024),
        localStorageFormatted: this.formatBytes(lsBytes),
        indexedDbBytes: idbBytes,
        indexedDbKB: Math.round(idbBytes / 1024),
        indexedDbFormatted: this.formatBytes(idbBytes),
        totalUsedBytes: totalUsage,
        totalUsedFormatted: this.formatBytes(totalUsage),
        quotaBytes,
        quotaMB: Math.round(quotaBytes / (1024 * 1024)),
        percentUsed: percentOfQuota,
        localStorageSplitPercent: lsSplit,
        indexedDbSplitPercent: idbSplit,
        isQuotaSafe: percentOfQuota < 85,
        draftsCount: drafts.length,
        booksCount: books.length,
        cacheItemsCount: caches.length,
        totalWordsCached: totalWords
      };

      this.metrics.set(newMetrics);
      this.isRefreshing.set(false);
      return newMetrics;
    } catch (err) {
      console.warn('[StorageManager] Error calculating storage metrics:', err);
      this.isRefreshing.set(false);
      return this.metrics();
    }
  }

  /**
   * Clears transient LocalStorage caches without deleting essential user sessions or thesis markers.
   */
  public clearLocalStorageCache(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      this.generalCacheService.clear();
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('app_cache_') || key.startsWith('temp_search_') || key.startsWith('preview_temp_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
      this.refreshMetrics();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears large transient cache object store in IndexedDB while preserving drafts and book archives.
   */
  public async clearIndexedDbCache(): Promise<boolean> {
    const success = await this.indexedDb.clearStore(this.indexedDb.STORES.CACHE);
    await this.refreshMetrics();
    return success;
  }

  /**
   * Clears all temporary caches in both LocalStorage and IndexedDB.
   */
  public async clearAllCaches(): Promise<void> {
    this.clearLocalStorageCache();
    await this.clearIndexedDbCache();
    await this.refreshMetrics();
  }

  /**
   * Formats bytes into human-readable Kurdish/Academic units (B, KB, MB, GB).
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${formatted} ${sizes[i] || 'KB'}`;
  }
}
