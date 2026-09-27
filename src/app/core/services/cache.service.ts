import { Injectable, signal } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  public cacheHits = signal<number>(0);
  public cacheMisses = signal<number>(0);

  /**
   * Get cached item if valid (not expired)
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      // Check localStorage fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = localStorage.getItem(`app_cache_${key}`);
          if (raw) {
            const parsed: CacheEntry<T> = JSON.parse(raw);
            if (Date.now() - parsed.timestamp < parsed.ttlMs) {
              this.memoryCache.set(key, parsed);
              this.cacheHits.update(n => n + 1);
              return parsed.data;
            } else {
              localStorage.removeItem(`app_cache_${key}`);
            }
          }
        } catch {
          // Ignore storage errors
        }
      }
      this.cacheMisses.update(n => n + 1);
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined' && window.localStorage) {
        try { 
          localStorage.removeItem(`app_cache_${key}`); 
        } catch {
          // Ignore storage error
        }
      }
      this.cacheMisses.update(n => n + 1);
      return null;
    }

    this.cacheHits.update(n => n + 1);
    return entry.data as T;
  }

  /**
   * Set cached item with TTL in milliseconds (default 10 mins)
   */
  set<T>(key: string, data: T, ttlMs = 600000, persistToStorage = true): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs
    };
    this.memoryCache.set(key, entry);

    if (persistToStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
      } catch {
        // Quota exceeded or private browsing
      }
    }
  }

  /**
   * Clear specific or all cache entries
   */
  clear(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined' && window.localStorage) {
        try { 
          localStorage.removeItem(`app_cache_${key}`); 
        } catch {
          // Ignore storage error
        }
      }
    } else {
      this.memoryCache.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          Object.keys(localStorage)
            .filter(k => k.startsWith('app_cache_'))
            .forEach(k => localStorage.removeItem(k));
        } catch {
          // Ignore storage error
        }
      }
    }
  }
}
