import { LibraryBook, LibrarySource, CrawlerSyncLog, AdminStats } from '../app/models/digital-library.model';
import { DIGITAL_LIBRARY_SOURCES } from './digital-library-sources';
import { INITIAL_LIBRARY_BOOKS } from './kurdish-books-catalog';

export class DigitalLibraryCrawlerEngine {
  private sources: LibrarySource[] = [...DIGITAL_LIBRARY_SOURCES];
  private catalog: LibraryBook[] = [...INITIAL_LIBRARY_BOOKS];
  private syncLogs: CrawlerSyncLog[] = [];

  constructor() {
    // The source catalog is configuration metadata only. Do not present
    // hard-coded counts or timestamps as live crawl results.
    this.sources = this.sources.map(source => ({
      ...source,
      totalItems: 0,
      lastSync: '',
      status: 'idle'
    }));

    // Seed catalog entries are retrieval candidates, not independently verified sources.
    this.catalog = this.catalog.map(book => ({
      ...book,
      verified: false,
      rating: undefined,
      reviewCount: undefined
    }));

    this.runDeduplication();
  }

  public getSources(): LibrarySource[] {
    return this.sources;
  }

  public getCatalog(): LibraryBook[] {
    return this.catalog;
  }

  public getSyncLogs(): CrawlerSyncLog[] {
    return this.syncLogs;
  }

  // Deduplication logic: normalizes titles and authors, removes exact or near duplicates
  public runDeduplication(): { totalBefore: number; totalAfter: number; removedCount: number } {
    const totalBefore = this.catalog.length;
    const seenMap = new Map<string, LibraryBook>();

    for (const book of this.catalog) {
      const normalizedTitle = this.normalizeText(book.title);
      const normalizedAuthor = this.normalizeText(book.author);
      const key = `${normalizedTitle}::${normalizedAuthor}`;

      if (!seenMap.has(key)) {
        seenMap.set(key, book);
      } else {
        // Merge extra metadata if available
        const existing = seenMap.get(key)!;
        if (!existing.downloadUrl && book.downloadUrl) {
          existing.downloadUrl = book.downloadUrl;
        }
        if (!existing.coverImage && book.coverImage) {
          existing.coverImage = book.coverImage;
        }
      }
    }

    this.catalog = Array.from(seenMap.values());
    const totalAfter = this.catalog.length;
    const removedCount = totalBefore - totalAfter;

    return { totalBefore, totalAfter, removedCount };
  }

  private normalizeText(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[،,.\-/\\_(){}[:\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Auto Crawl & Sync trigger for all 40 digital libraries
  public async triggerSync(): Promise<CrawlerSyncLog> {
    const startTime = Date.now();

    // Live crawling requires a source-specific adapter and authoritative response parsing.
    // Until such adapters are connected, never fabricate crawl counts or sync success.
    const durationMs = Date.now() - startTime;
    const log: CrawlerSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'warning',
      recordsCrawled: 0,
      duplicatesRemoved: 0,
      sourcesProcessed: 0,
      durationMs,
      message: 'هیچ source-adapter ـێکی ڕاستەقینە بۆ crawl لە ئەم build ـەدا پەیوەست نییە؛ هیچ تۆماری ساختە زیاد نەکرا.'
    };

    this.syncLogs.unshift(log);
    return log;
  }

  // Admin stats calculator
  public getAdminStats(): AdminStats {
    const langCounts: Record<string, number> = {
      ckb: 0, kmr: 0, ar: 0, en: 0, fa: 0, tr: 0
    };

    for (const b of this.catalog) {
      if (langCounts[b.language] !== undefined) {
        langCounts[b.language]++;
      }
    }

    return {
      totalBooks: this.catalog.length,
      totalSources: this.sources.length,
      activeSources: this.sources.filter(s => s.status === 'active').length,
      totalCrawled24h: 0,
      duplicateCount: 0,
      ocrQueueSize: 0,
      lastSyncTime: this.syncLogs[0]?.timestamp || '',
      languagesCount: langCounts as AdminStats['languagesCount']
    };
  }

  // Add new book manually to catalog
  public addBook(book: Partial<LibraryBook>): LibraryBook {
    const newBook: LibraryBook = {
      id: `kb-custom-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`,
      title: book.title || 'کتێبی بێ ناونیشان',
      author: book.author || 'نادیار',
      year: book.year ?? 0,
      language: book.language || 'ckb',
      description: book.description || '',
      coverImage: book.coverImage || '',
      sourceUrl: book.sourceUrl || '',
      sourceName: book.sourceName || 'بەکارهێنەر',
      sourceId: book.sourceId || 'user-supplied',
      sourceCategory: book.sourceCategory || 'kurdish',
      documentType: book.documentType || 'book',
      downloadUrl: book.downloadUrl || '',
      subjects: book.subjects || [],
      verified: false,
      indexedAt: new Date().toISOString()
    };

    this.catalog.unshift(newBook);
    this.runDeduplication();
    return newBook;
  }
}

export const crawlerEngine = new DigitalLibraryCrawlerEngine();
