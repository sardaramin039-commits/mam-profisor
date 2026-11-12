import { Injectable, signal, computed, inject } from '@angular/core';
import { AcademicStoreService } from './academic-store.service';
import { Data } from './data';

export type SourceVerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'FAILED';
export type AcademicProvider = 'crossref' | 'openalex' | 'manual';

export interface VerifiedAcademicSource {
  id: string;
  title: string;
  authors: string[];
  year: number | string;
  venue: string; // journal, publisher, or container title
  doi?: string;
  url: string; // canonical URL
  provider: AcademicProvider;
  retrievalTime: string; // ISO string
  status: SourceVerificationStatus;
  userApproved: boolean;
  failureReason?: string;
  claimText?: string;
  evidenceSnippet?: string;
  pageNumber?: string | number;
  sourceType?: string;
  citationCount?: number;
  rawMetadata?: any;
}

export interface VerificationCheckResult {
  eligible: boolean;
  reason?: string;
  source?: VerifiedAcademicSource;
}

const STORAGE_KEY = 'MAM_VERIFIED_ACADEMIC_SOURCES';

@Injectable({
  providedIn: 'root'
})
export class SourceVerificationService {
  private academicStore?: AcademicStoreService;
  private dataService?: Data;

  // List of verified source records persisted in memory & storage
  public readonly sources = signal<VerifiedAcademicSource[]>(this.loadStoredSources());

  // Search filter query
  public readonly searchQuery = signal<string>('');
  public readonly statusFilter = signal<'ALL' | SourceVerificationStatus>('ALL');

  // Filtered source list for UI cards
  public readonly filteredSources = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();
    return this.sources().filter(s => {
      const matchesFilter = filter === 'ALL' || s.status === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const authorMatch = (s.authors || []).some(a => a.toLowerCase().includes(q));
      const doiMatch = (s.doi || '').toLowerCase().includes(q);
      const venueMatch = (s.venue || '').toLowerCase().includes(q);
      const claimMatch = (s.claimText || '').toLowerCase().includes(q);
      return titleMatch || authorMatch || doiMatch || venueMatch || claimMatch;
    });
  });

  // Verification statistics
  public readonly totalCount = computed(() => this.sources().length);
  public readonly verifiedCount = computed(() => this.sources().filter(s => s.status === 'VERIFIED').length);
  public readonly approvedCount = computed(() => this.sources().filter(s => s.status === 'VERIFIED' && s.userApproved).length);
  public readonly needsReviewCount = computed(() => this.sources().filter(s => s.status === 'NEEDS_REVIEW').length);
  public readonly failedCount = computed(() => this.sources().filter(s => s.status === 'FAILED').length);

  constructor() {
    try {
      this.academicStore = inject(AcademicStoreService, { optional: true }) || undefined;
      this.dataService = inject(Data, { optional: true }) || undefined;
    } catch {
      // In isolated test runner environment
    }
    this.syncToExternalStores(this.sources());
  }

  private loadStoredSources(): VerifiedAcademicSource[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse verified sources from storage:', e);
    }
    return [];
  }

  private saveToStorage(items: VerifiedAcademicSource[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save verified sources to storage:', e);
    }
    this.syncToExternalStores(items);
  }

  private syncToExternalStores(items: VerifiedAcademicSource[]): void {
    try {
      // Sync into Data and AcademicStoreService for compatibility
      const mappedForData = items.map(s => ({
        id: s.id,
        userId: 'current_user',
        author: s.authors.join(', ') || 'نووسەری دیارینەکراو',
        authors: s.authors,
        title: s.title,
        year: typeof s.year === 'number' ? s.year : parseInt(String(s.year), 10) || 0,
        publisher: s.venue,
        sourceType: (s.sourceType as any) || 'journal',
        doi: s.doi,
        url: s.url,
        claimText: s.claimText,
        evidenceText: s.evidenceSnippet,
        pageNumber: s.pageNumber,
        identityStatus: s.status === 'VERIFIED' ? 'verified' as const : 'unverified' as const,
        evidenceStatus: s.evidenceSnippet ? 'verified' as const : 'not_available' as const,
        citationEligible: s.status === 'VERIFIED' && s.userApproved,
        isVerified: s.status === 'VERIFIED' && s.userApproved,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      }));
      if (this.dataService?.sourcesList) {
        this.dataService.sourcesList.set(mappedForData);
      }
    } catch (err) {
      console.warn('Sync to dataService failed:', err);
    }
  }

  /**
   * Cleans and validates a DOI string format
   */
  public cleanDoi(doi: string): string {
    return (doi || '')
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .replace(/^doi:/i, '')
      .trim();
  }

  public isValidDoiFormat(doi: string): boolean {
    const clean = this.cleanDoi(doi);
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(clean);
  }

  /**
   * Retrieves and verifies metadata directly from Crossref API
   */
  public async verifyWithCrossref(doiOrTitle: string): Promise<VerifiedAcademicSource> {
    const isDoi = this.isValidDoiFormat(doiOrTitle);
    const clean = isDoi ? this.cleanDoi(doiOrTitle) : doiOrTitle.trim();
    const retrievalTime = new Date().toISOString();

    const url = isDoi
      ? `https://api.crossref.org/works/${encodeURIComponent(clean)}`
      : `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(clean)}&rows=1`;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/2.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        return {
          id: `src_crossref_${Date.now()}`,
          title: clean,
          authors: [],
          year: 'n.d.',
          venue: '',
          doi: isDoi ? clean : undefined,
          url: isDoi ? `https://doi.org/${clean}` : '',
          provider: 'crossref',
          retrievalTime,
          status: 'FAILED',
          userApproved: false,
          failureReason: `سەرچاوەکە لە Crossref نەدۆزرایەوە (کۆدی وەڵام: ${res.status}). تکایە دڵنیابە لە دروستیی DOI یان سەرناوی سەرچاوەکە.`
        };
      }

      const json = await res.json();
      const item = isDoi ? json?.message : json?.message?.items?.[0];

      if (!item || !item.title?.[0]) {
        return {
          id: `src_crossref_${Date.now()}`,
          title: clean,
          authors: [],
          year: 'n.d.',
          venue: '',
          doi: isDoi ? clean : undefined,
          url: isDoi ? `https://doi.org/${clean}` : '',
          provider: 'crossref',
          retrievalTime,
          status: 'FAILED',
          userApproved: false,
          failureReason: 'داتای سەرچاوەکە لە Crossref بەتاڵە یان ناونیشانی فەرمی نییە.'
        };
      }

      const title = String(item.title[0]).trim();
      const authors = (item.author || []).map((a: any) =>
        [a.given, a.family].filter(Boolean).join(' ').trim()
      ).filter(Boolean);
      const rawYear = item.published?.['date-parts']?.[0]?.[0] || item.issued?.['date-parts']?.[0]?.[0];
      const year = rawYear ? Number(rawYear) : 'n.d.';
      const venue = (item['container-title']?.[0] || item.publisher || '').trim();
      const doi = item.DOI ? this.cleanDoi(item.DOI) : (isDoi ? clean : undefined);
      const canonicalUrl = item.URL || (doi ? `https://doi.org/${doi}` : '');

      const isComplete = Boolean(title && authors.length > 0 && year !== 'n.d.');

      return {
        id: `crossref_${doi ? doi.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()}`,
        title,
        authors,
        year,
        venue,
        doi,
        url: canonicalUrl,
        provider: 'crossref',
        retrievalTime,
        status: isComplete ? 'VERIFIED' : 'NEEDS_REVIEW',
        userApproved: false,
        failureReason: isComplete ? undefined : 'هەندێک زانیاریی سەرەکی (وەک ساڵ یان نووسەر) لە داتابەیسی Crossref نادیارە و پێویستی بە پێداچوونەوەیە.',
        citationCount: item['is-referenced-by-count'],
        rawMetadata: item
      };
    } catch (err: any) {
      return {
        id: `src_crossref_err_${Date.now()}`,
        title: clean,
        authors: [],
        year: 'n.d.',
        venue: '',
        doi: isDoi ? clean : undefined,
        url: isDoi ? `https://doi.org/${clean}` : '',
        provider: 'crossref',
        retrievalTime,
        status: 'FAILED',
        userApproved: false,
        failureReason: `پەیوەندیکردن بە Crossref شکستی هێنا: ${err?.message || 'کێشەی تۆڕ'}`
      };
    }
  }

  /**
   * Retrieves and verifies metadata directly from OpenAlex API
   */
  public async verifyWithOpenAlex(doiOrTitle: string): Promise<VerifiedAcademicSource> {
    const isDoi = this.isValidDoiFormat(doiOrTitle);
    const clean = isDoi ? this.cleanDoi(doiOrTitle) : doiOrTitle.trim();
    const retrievalTime = new Date().toISOString();

    const url = isDoi
      ? `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(clean)}`
      : `https://api.openalex.org/works?search=${encodeURIComponent(clean)}&per-page=1`;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/2.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        return {
          id: `src_openalex_${Date.now()}`,
          title: clean,
          authors: [],
          year: 'n.d.',
          venue: '',
          doi: isDoi ? clean : undefined,
          url: isDoi ? `https://doi.org/${clean}` : '',
          provider: 'openalex',
          retrievalTime,
          status: 'FAILED',
          userApproved: false,
          failureReason: `سەرچاوەکە لە OpenAlex نەدۆزرایەوە (کۆدی وەڵام: ${res.status}).`
        };
      }

      const json = await res.json();
      const item = isDoi ? json : json?.results?.[0];

      if (!item || !item.title) {
        return {
          id: `src_openalex_${Date.now()}`,
          title: clean,
          authors: [],
          year: 'n.d.',
          venue: '',
          doi: isDoi ? clean : undefined,
          url: isDoi ? `https://doi.org/${clean}` : '',
          provider: 'openalex',
          retrievalTime,
          status: 'FAILED',
          userApproved: false,
          failureReason: 'سەرچاوەکە لە داتابەیسی OpenAlex تۆمار نەکراوە.'
        };
      }

      const title = String(item.title).trim();
      const authors = (item.authorships || []).map((a: any) =>
        a.author?.display_name?.trim()
      ).filter(Boolean);
      const year = item.publication_year || 'n.d.';
      const venue = (item.primary_location?.source?.display_name || item.host_venue?.display_name || '').trim();
      const doi = item.doi ? this.cleanDoi(item.doi) : (isDoi ? clean : undefined);
      const canonicalUrl = item.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : item.id || '');

      const isComplete = Boolean(title && authors.length > 0 && year !== 'n.d.');

      return {
        id: `openalex_${item.id ? item.id.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()}`,
        title,
        authors,
        year,
        venue,
        doi,
        url: canonicalUrl,
        provider: 'openalex',
        retrievalTime,
        status: isComplete ? 'VERIFIED' : 'NEEDS_REVIEW',
        userApproved: false,
        failureReason: isComplete ? undefined : 'هەندێک زانیاریی سەرەکی لە OpenAlex نادیارە و پێویستی بە پشتڕاستکردنەوەی مرۆیی هەیە.',
        citationCount: item.cited_by_count,
        rawMetadata: item
      };
    } catch (err: any) {
      return {
        id: `src_openalex_err_${Date.now()}`,
        title: clean,
        authors: [],
        year: 'n.d.',
        venue: '',
        doi: isDoi ? clean : undefined,
        url: isDoi ? `https://doi.org/${clean}` : '',
        provider: 'openalex',
        retrievalTime,
        status: 'FAILED',
        userApproved: false,
        failureReason: `پەیوەندیکردن بە OpenAlex شکستی هێنا: ${err?.message || 'کێشەی تۆڕ'}`
      };
    }
  }

  /**
   * Dual verification: Attempts Crossref first, falls back to OpenAlex
   */
  public async verifySource(queryOrDoi: string): Promise<VerifiedAcademicSource> {
    const crossrefResult = await this.verifyWithCrossref(queryOrDoi);
    if (crossrefResult.status === 'VERIFIED') {
      this.addOrUpdateSource(crossrefResult);
      return crossrefResult;
    }

    // Try OpenAlex
    const openAlexResult = await this.verifyWithOpenAlex(queryOrDoi);
    if (openAlexResult.status === 'VERIFIED') {
      this.addOrUpdateSource(openAlexResult);
      return openAlexResult;
    }

    // If both failed or need review, choose the one with more information
    const bestResult = crossrefResult.authors.length >= openAlexResult.authors.length ? crossrefResult : openAlexResult;
    this.addOrUpdateSource(bestResult);
    return bestResult;
  }

  /**
   * Verifies custom user source inputs against real Crossref/OpenAlex APIs
   */
  public async verifyCustomUserSource(input: {
    title: string;
    author?: string;
    authors?: string[];
    year?: number | string;
    venue?: string;
    doi?: string;
    claimText?: string;
    evidenceSnippet?: string;
    pageNumber?: string | number;
  }): Promise<VerifiedAcademicSource> {
    const rawDoi = input.doi?.trim();
    if (rawDoi && this.isValidDoiFormat(rawDoi)) {
      const verified = await this.verifySource(rawDoi);
      if (input.claimText) verified.claimText = input.claimText;
      if (input.evidenceSnippet) verified.evidenceSnippet = input.evidenceSnippet;
      if (input.pageNumber) verified.pageNumber = input.pageNumber;
      this.addOrUpdateSource(verified);
      return verified;
    }

    // If no DOI or invalid DOI, attempt search with title & author
    const searchQuery = `${input.title} ${input.author || input.authors?.[0] || ''}`.trim();
    const verified = await this.verifySource(searchQuery);

    if (input.claimText) verified.claimText = input.claimText;
    if (input.evidenceSnippet) verified.evidenceSnippet = input.evidenceSnippet;
    if (input.pageNumber) verified.pageNumber = input.pageNumber;

    // If still failed or needs review, create record marked as NEEDS_REVIEW with clear explanation
    if (verified.status === 'FAILED') {
      verified.status = 'NEEDS_REVIEW';
      verified.failureReason = 'ئەم سەرچاوەیە نەتوانرا لە ڕێگەی داتابەیسی دەرەکی (Crossref / OpenAlex) پشتڕاست بکرێتەوە. تکایە DOI یان لینکێکی فەرمیی بدەیتێ تا پەسەند بکرێت.';
    }

    this.addOrUpdateSource(verified);
    return verified;
  }

  /**
   * Adds or updates a record in the verified repository
   */
  public addOrUpdateSource(source: VerifiedAcademicSource): void {
    this.sources.update(prev => {
      const idx = prev.findIndex(s => s.id === source.id || (s.doi && source.doi && s.doi === source.doi));
      let next: VerifiedAcademicSource[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...prev[idx], ...source };
      } else {
        next = [source, ...prev];
      }
      this.saveToStorage(next);
      return next;
    });
  }

  /**
   * Approves a verified source for citation insertion
   */
  public approveSource(id: string): { success: boolean; message: string } {
    let success = false;
    let message = '';

    this.sources.update(prev => {
      return prev.map(s => {
        if (s.id === id) {
          if (s.status !== 'VERIFIED') {
            message = 'تەنها سەرچاوەی VERIFIED دەتوانرێت پەسەند بکرێت. تکایە سەرەتا دڵنیابە لە دروستیی زانیارییەکانی سەرچاوەکە.';
            return s;
          }
          success = true;
          message = 'سەرچاوەکە بە سەرکەوتوویی پەسەندکرا و شیاوە بۆ بەکارهێنان لە تێزدا.';
          return { ...s, userApproved: true };
        }
        return s;
      });
    });

    if (success) {
      this.saveToStorage(this.sources());
    }

    return { success, message };
  }

  /**
   * Revokes approval for a source
   */
  public revokeApproval(id: string): void {
    this.sources.update(prev => {
      const next = prev.map(s => s.id === id ? { ...s, userApproved: false } : s);
      this.saveToStorage(next);
      return next;
    });
  }

  /**
   * Removes a source record
   */
  public removeSource(id: string): void {
    this.sources.update(prev => {
      const next = prev.filter(s => s.id !== id);
      this.saveToStorage(next);
      return next;
    });
  }

  /**
   * Links an academic claim to a verified source
   */
  public linkClaimToSource(sourceId: string, claimText: string, evidenceSnippet?: string, pageNumber?: string | number): void {
    this.sources.update(prev => {
      const next = prev.map(s => {
        if (s.id === sourceId) {
          return {
            ...s,
            claimText,
            evidenceSnippet: evidenceSnippet || s.evidenceSnippet,
            pageNumber: pageNumber || s.pageNumber
          };
        }
        return s;
      });
      this.saveToStorage(next);
      return next;
    });
  }

  /**
   * CRITICAL GATE: Only VERIFIED and user-approved sources can be inserted
   */
  public isEligibleForCitation(source: VerifiedAcademicSource | any): VerificationCheckResult {
    if (!source) {
      return { eligible: false, reason: 'هیچ زانیارییەکی سەرچاوە دابین نەکراوە.' };
    }

    // Match in internal repo
    const match = this.sources().find(s =>
      s.id === source.id ||
      (source.doi && s.doi === this.cleanDoi(source.doi)) ||
      (source.title && s.title.toLowerCase() === source.title.toLowerCase())
    );

    const target = match || source;

    if (target.status !== 'VERIFIED') {
      return {
        eligible: false,
        source: target,
        reason: target.failureReason || 'ئەم سەرچاوەیە هێشتا بە تەواوی لەلایەن Crossref یان OpenAlex نەسەلمێندراوە (Status: ' + (target.status || 'UNVERIFIED') + ').'
      };
    }

    if (!target.userApproved) {
      return {
        eligible: false,
        source: target,
        reason: 'ئەم سەرچاوەیە پشتڕاستکراوەتەوە بەڵام هێشتا لە لایەن بەکارهێنەرەوە پەسەند (Approved) نەکراوە.'
      };
    }

    if (!target.title?.trim() || !target.authors?.length) {
      return {
        eligible: false,
        source: target,
        reason: 'سەرچاوەکە ناونیشان یان نووسەری فەرمیی کەمە.'
      };
    }

    return { eligible: true, source: target };
  }

  /**
   * Formats a clean, uninvented APA citation
   */
  public formatCitation(source: VerifiedAcademicSource, mode: 'inline' | 'footnote' | 'bibliography' = 'inline'): string {
    const authorsStr = (source.authors || []).join('، ') || 'نووسەری فەرمی';
    const firstAuthor = source.authors?.[0]?.split(' ').pop() || source.authors?.[0] || 'نووسەر';
    const yearStr = source.year ? String(source.year) : 'n.d.';
    const pageStr = source.pageNumber ? `: ${source.pageNumber}` : '';

    if (mode === 'inline') {
      return `(${firstAuthor}، ${yearStr}${pageStr})`;
    } else if (mode === 'footnote') {
      const pageSuffix = source.pageNumber ? `، ل. ${source.pageNumber}` : '';
      return `[^١]: ${authorsStr}، «${source.title}» (${yearStr})${source.venue ? `، ${source.venue}` : ''}${pageSuffix}${source.doi ? `، DOI: ${source.doi}` : ''}.`;
    } else {
      const doiPart = source.doi ? ` https://doi.org/${source.doi}` : (source.url ? ` ${source.url}` : '');
      return `${authorsStr} (${yearStr}). *${source.title}*. ${source.venue ? `${source.venue}.` : ''}${doiPart}`.trim();
    }
  }

  /**
   * Audit check on manuscript export
   */
  public validateForExport(chapters: Array<{ title: string; content: string }>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const unapprovedSources = this.sources().filter(s => s.status !== 'VERIFIED' || !s.userApproved);
    
    // Check if body references unapproved or fake sources
    const contentAll = chapters.map(c => c.content).join('\n\n');
    for (const unapproved of unapprovedSources) {
      const author = unapproved.authors?.[0] || unapproved.title;
      if (author && author.length > 3 && contentAll.includes(author)) {
        errors.push(`سەرچاوەی ناپەسەندکراو یان نەسەلمێندراو «${author}» لە دەقی تێزدا هاتووە. پێویستە لە Crossref/OpenAlex پشتڕاست بکرێتەوە.`);
      }
    }

    // Require at least 1 verified and approved source for academic integrity
    const approved = this.sources().filter(s => s.status === 'VERIFIED' && s.userApproved);
    if (approved.length === 0 && contentAll.includes('(')) {
      errors.push('هیچ سەرچاوەیەکی سەلـمێندراوی پەسەندکراو (VERIFIED & Approved) لە سیستەمدا نییە بۆ پشتڕاستکردنەوەی ژێدەرەکان.');
    }

    return { valid: errors.length === 0, errors };
  }
}
