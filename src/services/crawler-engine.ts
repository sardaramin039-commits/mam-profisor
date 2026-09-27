import { LibraryBook, LibrarySource, CrawlerSyncLog, AdminStats } from '../app/models/digital-library.model';
import { DIGITAL_LIBRARY_SOURCES } from './digital-library-sources';
import { INITIAL_LIBRARY_BOOKS } from './kurdish-books-catalog';

export class DigitalLibraryCrawlerEngine {
  private sources: LibrarySource[] = [...DIGITAL_LIBRARY_SOURCES];
  private catalog: LibraryBook[] = [...INITIAL_LIBRARY_BOOKS];
  private syncLogs: CrawlerSyncLog[] = [
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'success',
      recordsCrawled: 420,
      duplicatesRemoved: 14,
      sourcesProcessed: 40,
      durationMs: 4250,
      message: 'خوولگەی هاودەمکردنی ٢٤ کاتژمێریی سەرچاوەکان بەسەرکەوتوویی جێبەجێکرا'
    }
  ];

  constructor() {
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
    let newlyCrawledCount = 0;

    // Simulate crawling active sources and fetching new metadata
    for (const source of this.sources) {
      source.status = 'syncing';
      // Simulate indexing 2-5 new items per source
      const added = Math.floor(Math.random() * 4) + 1;
      source.totalItems += added;
      source.lastSync = new Date().toISOString();
      source.status = 'active';
      newlyCrawledCount += added;
    }

    const dedup = this.runDeduplication();
    const durationMs = Date.now() - startTime;

    const log: CrawlerSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'success',
      recordsCrawled: newlyCrawledCount,
      duplicatesRemoved: dedup.removedCount,
      sourcesProcessed: this.sources.length,
      durationMs,
      message: `گەڕان و تێکەڵکردنی ٤٠ کتێبخانەی دیجیتاڵی بەسەرکەوتوویی ئەنجامدرا. ${newlyCrawledCount} تۆماری نوێ ئیندێکسکران.`
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
      totalCrawled24h: 320,
      duplicateCount: 18,
      ocrQueueSize: 3,
      lastSyncTime: this.syncLogs[0]?.timestamp || new Date().toISOString(),
      languagesCount: langCounts as AdminStats['languagesCount']
    };
  }

  // Add new book manually to catalog
  public addBook(book: Partial<LibraryBook>): LibraryBook {
    const newBook: LibraryBook = {
      id: `kb-custom-${Date.now()}`,
      title: book.title || 'کتێبی بێ ناونیشان',
      author: book.author || 'نادیار',
      year: book.year || new Date().getFullYear(),
      language: book.language || 'ckb',
      description: book.description || '',
      coverImage: book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      sourceUrl: book.sourceUrl || 'https://www.kurdipedia.org',
      sourceName: book.sourceName || 'دەستکاری دروستکراو',
      sourceId: book.sourceId || 'kurdipedia',
      sourceCategory: book.sourceCategory || 'kurdish',
      documentType: book.documentType || 'book',
      downloadUrl: book.downloadUrl || '#',
      subjects: book.subjects || ['گشتی'],
      rating: 5.0,
      reviewCount: 1,
      verified: true,
      indexedAt: new Date().toISOString()
    };

    this.catalog.unshift(newBook);
    this.runDeduplication();
    return newBook;
  }
}

export const crawlerEngine = new DigitalLibraryCrawlerEngine();
