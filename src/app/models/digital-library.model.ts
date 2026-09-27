export type SupportedLanguage = 'ckb' | 'kmr' | 'ar' | 'en' | 'fa' | 'tr';
export type DocumentType = 'book' | 'article' | 'journal' | 'thesis' | 'manuscript' | 'archive';
export type SourceCategory = 'kurdish' | 'academic' | 'global';

export interface LibraryBook {
  id: string;
  title: string;
  titleKurdish?: string;
  author: string;
  year: number;
  language: SupportedLanguage;
  description: string;
  coverImage: string;
  sourceUrl: string;
  sourceName: string;
  sourceId: string;
  sourceCategory: SourceCategory;
  documentType: DocumentType;
  downloadUrl: string;
  isbn?: string;
  pageCount?: number;
  subjects: string[];
  rating?: number;
  reviewCount?: number;
  verified: boolean;
  indexedAt: string;
  ocrText?: string;
  pdfUrl?: string;
}

export interface LibrarySource {
  id: string;
  name: string;
  nameKurdish: string;
  url: string;
  category: SourceCategory;
  totalItems: number;
  lastSync: string;
  status: 'active' | 'syncing' | 'idle' | 'error';
  logo?: string;
  description?: string;
}

export interface SearchFilter {
  query: string;
  language: string; // 'all' or specific
  sourceId: string; // 'all' or specific
  subject: string; // 'all' or specific
  yearMin: number;
  yearMax: number;
  docType: string; // 'all' or specific
  author: string;
  sortBy: 'relevance' | 'year_desc' | 'year_asc' | 'title' | 'rating';
}

export interface BookmarkItem {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  coverImage: string;
  author: string;
  addedAt: string;
  tags?: string[];
}

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  coverImage: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
}

export interface CrawlerSyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'warning' | 'in_progress';
  recordsCrawled: number;
  duplicatesRemoved: number;
  sourcesProcessed: number;
  durationMs: number;
  message: string;
}

export interface AdminStats {
  totalBooks: number;
  totalSources: number;
  activeSources: number;
  totalCrawled24h: number;
  duplicateCount: number;
  ocrQueueSize: number;
  lastSyncTime: string;
  languagesCount: Record<SupportedLanguage, number>;
}
