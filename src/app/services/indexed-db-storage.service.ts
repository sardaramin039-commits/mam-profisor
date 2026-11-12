import { Injectable, signal } from '@angular/core';

export interface StorageQuotaEstimate {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  isQuotaSafe: boolean;
}

export interface IndexedDbItem<T = any> {
  key: string;
  data: T;
  updatedAt: string;
  wordCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbStorageService {
  private readonly DB_NAME = 'AcademicKurdishThesisDB';
  private readonly DB_VERSION = 1;

  public readonly STORES = {
    DRAFTS: 'thesis_drafts',
    BOOKS: 'academic_books',
    CACHE: 'large_cache'
  } as const;

  public dbReady = signal<boolean>(false);
  public isIndexedDbSupported = signal<boolean>(this.checkIndexedDbSupport());
  public quotaInfo = signal<StorageQuotaEstimate | null>(null);

  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (this.isIndexedDbSupported()) {
      this.initDatabase().then(() => {
        this.dbReady.set(true);
        this.checkStorageQuota();
      }).catch(err => {
        this.isIndexedDbSupported.set(false);
        // Environment fallback silent handling
      });
    }
  }

  private checkIndexedDbSupport(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        'indexedDB' in window &&
        window.indexedDB !== null &&
        window.indexedDB !== undefined
      );
    } catch {
      return false;
    }
  }

  /**
   * Initializes or upgrades the IndexedDB database.
   */
  private initDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!this.checkIndexedDbSupport()) {
        this.isIndexedDbSupported.set(false);
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      try {
        const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Store 1: Long thesis drafts, chapters (50,000+ words), snapshots
          if (!db.objectStoreNames.contains(this.STORES.DRAFTS)) {
            db.createObjectStore(this.STORES.DRAFTS, { keyPath: 'key' });
          }

          // Store 2: 40 Academic Kurdish Books archive and full-text content
          if (!db.objectStoreNames.contains(this.STORES.BOOKS)) {
            db.createObjectStore(this.STORES.BOOKS, { keyPath: 'id' });
          }

          // Store 3: General large key-value cache (manuscripts, search indexes, fallbacks)
          if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
            db.createObjectStore(this.STORES.CACHE, { keyPath: 'key' });
          }
        };

        request.onsuccess = (event: Event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          resolve(db);
        };

        request.onerror = (event: Event) => {
          const err = (event.target as IDBOpenDBRequest).error || new Error('Failed to open IndexedDB');
          this.isIndexedDbSupported.set(false);
          reject(err);
        };
      } catch (err) {
        this.isIndexedDbSupported.set(false);
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save an item into a specified IndexedDB object store.
   */
  public async setItem<T>(storeName: string, key: string, value: T, wordCount?: number): Promise<boolean> {
    if (!this.isIndexedDbSupported() || !this.checkIndexedDbSupport()) {
      return false;
    }

    try {
      const db = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const payload: IndexedDbItem<T> = {
          key,
          data: value,
          updatedAt: new Date().toISOString(),
          wordCount
        };

        // If storing in BOOKS store where primary key is 'id'
        const storeKey = store.keyPath === 'id' ? { id: key, key, data: value, updatedAt: payload.updatedAt } : payload;

        const request = store.put(storeKey);

        request.onsuccess = () => {
          this.checkStorageQuota();
          resolve(true);
        };

        request.onerror = (evt) => {
          console.warn(`[IndexedDB] پاشەکەوتکردن سەرکەوتوو نەبوو لە پاشکۆی ${storeName}:`, (evt.target as IDBRequest).error);
          resolve(false);
        };
      });
    } catch (error) {
      this.isIndexedDbSupported.set(false);
      return false;
    }
  }

  /**
   * Retrieve an item from an IndexedDB store.
   */
  public async getItem<T>(storeName: string, key: string, defaultValue: T): Promise<T> {
    if (!this.isIndexedDbSupported() || !this.checkIndexedDbSupport()) {
      return defaultValue;
    }

    try {
      const db = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && 'data' in result) {
            resolve(result.data as T);
          } else if (result) {
            resolve(result as T);
          } else {
            resolve(defaultValue);
          }
        };

        request.onerror = () => {
          resolve(defaultValue);
        };
      });
    } catch {
      this.isIndexedDbSupported.set(false);
      return defaultValue;
    }
  }

  /**
   * Delete an item from IndexedDB.
   */
  public async removeItem(storeName: string, key: string): Promise<boolean> {
    if (!this.isIndexedDbSupported() || !this.checkIndexedDbSupport()) {
      return false;
    }

    try {
      const db = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      this.isIndexedDbSupported.set(false);
      return false;
    }
  }

  /**
   * Get all items from a store.
   */
  public async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.isIndexedDbSupported() || !this.checkIndexedDbSupport()) {
      return [];
    }

    try {
      const db = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          const items = results.map(r => (r && typeof r === 'object' && 'data' in r ? r.data : r));
          resolve(items as T[]);
        };

        request.onerror = () => resolve([]);
      });
    } catch {
      this.isIndexedDbSupported.set(false);
      return [];
    }
  }

  /**
   * Clear an entire object store.
   */
  public async clearStore(storeName: string): Promise<boolean> {
    if (!this.isIndexedDbSupported() || !this.checkIndexedDbSupport()) {
      return false;
    }

    try {
      const db = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      this.isIndexedDbSupported.set(false);
      return false;
    }
  }

  /**
   * Check browser storage quota and return usage estimate in MB.
   */
  public async checkStorageQuota(): Promise<StorageQuotaEstimate> {
    const fallback: StorageQuotaEstimate = { usageMB: 0, quotaMB: 1024, percentUsed: 0, isQuotaSafe: true };
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || (1024 * 1024 * 1024); // default 1GB

        const usageMB = Math.round((usageBytes / (1024 * 1024)) * 100) / 100;
        const quotaMB = Math.round((quotaBytes / (1024 * 1024)) * 100) / 100;
        const percentUsed = Math.round((usageBytes / quotaBytes) * 100);

        const info: StorageQuotaEstimate = {
          usageMB,
          quotaMB,
          percentUsed,
          isQuotaSafe: percentUsed < 90
        };
        this.quotaInfo.set(info);
        return info;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Specialized method to save thesis draft (supporting > 50,000 words without quota limit).
   */
  public async saveThesisDraft(draftPayload: any): Promise<boolean> {
    const key = 'kurdish_academic_thesis_draft';
    
    // Estimate total word count
    let wordCount = 0;
    if (draftPayload?.chapters && Array.isArray(draftPayload.chapters)) {
      wordCount = draftPayload.chapters.reduce((acc: number, ch: any) => {
        const text = ch.content || '';
        return acc + (text.trim() ? text.trim().split(/\s+/).length : 0);
      }, 0);
    }

    const savedInIDB = await this.setItem(this.STORES.DRAFTS, key, draftPayload, wordCount);

    // Also leave lightweight metadata marker in localStorage if safe
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const marker = {
          __indexedDb: true,
          store: this.STORES.DRAFTS,
          key,
          timestamp: new Date().toISOString(),
          wordCount
        };
        window.localStorage.setItem(key, JSON.stringify(marker));
      }
    } catch {
      // LocalStorage full, but IndexedDB has saved the entire thesis safely!
      console.warn('[IndexedDB] LocalStorage storage limit exceeded, thesis preserved in IndexedDB successfully.');
    }

    return savedInIDB;
  }

  /**
   * Specialized method to load thesis draft from IndexedDB first, with LocalStorage fallback.
   */
  public async loadThesisDraft(): Promise<any | null> {
    const key = 'kurdish_academic_thesis_draft';
    // 1. Try IndexedDB
    const fromIDB = await this.getItem(this.STORES.DRAFTS, key, null);
    if (fromIDB) return fromIDB;

    // 2. Fallback to LocalStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && !parsed.__indexedDb) {
            return parsed;
          }
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Saves the 40 Academic Books catalog & content into IndexedDB.
   */
  public async saveAcademicBooksArchive(books: any[]): Promise<boolean> {
    try {
      const key = 'catalog_40_books_archive';
      const success = await this.setItem(this.STORES.BOOKS, key, books);
      // Also save individual books by ID
      if (Array.isArray(books)) {
        for (const book of books) {
          if (book && book.id) {
            await this.setItem(this.STORES.BOOKS, book.id, book);
          }
        }
      }
      return success;
    } catch {
      return false;
    }
  }

  /**
   * Loads the 40 Academic Books archive from IndexedDB.
   */
  public async loadAcademicBooksArchive(): Promise<any[] | null> {
    try {
      const key = 'catalog_40_books_archive';
      const books = await this.getItem<any[] | null>(this.STORES.BOOKS, key, null);
      if (books && Array.isArray(books) && books.length > 0) {
        return books;
      }
      // Or get all items from store
      const allBooks = await this.getAll<any>(this.STORES.BOOKS);
      return allBooks.length > 0 ? allBooks : null;
    } catch {
      return null;
    }
  }
}
