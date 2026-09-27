export interface ZoteroItem {
  key: string;
  itemType: string;
  title: string;
  creators: { firstName?: string; lastName?: string; name?: string }[];
  publicationTitle?: string;
  date?: string;
  doi?: string;
  url?: string;
}

export interface MendeleyDocument {
  id: string;
  title: string;
  authors: { first_name?: string; last_name?: string }[];
  year?: number;
  source?: string;
  doi?: string;
}

export interface OrcidProfile {
  orcidId: string;
  creditName: string;
  biography?: string;
  institution?: string;
  publications: {
    title: string;
    journal?: string;
    year?: string;
    doi?: string;
  }[];
}

export interface GoogleScholarMetadata {
  title: string;
  snippet: string;
  link: string;
  authors: string[];
  publicationYear: string;
  citedByCount: number;
  versionsCount: number;
}

export interface DoiResolutionResult {
  doi: string;
  title: string;
  authors: string[];
  publisher: string;
  journal: string;
  publishedYear: string;
  volume?: string;
  issue?: string;
  page?: string;
  url: string;
  citationFormattedAPA: string;
}

export interface IsbnLookupResult {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  publishDate: string;
  pages?: number;
  coverUrl?: string;
  description?: string;
}

export interface IssnLookupResult {
  issn: string;
  journalTitle: string;
  publisher: string;
  country: string;
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  impactFactor: number | null;
  openAccess: boolean | null;
  subjects: string[];
}

export interface ResearchTimelineNode {
  id: string;
  phase: string;
  yearOrDuration: string;
  title: string;
  description: string;
  deliverables: string[];
  status: 'تەواوکراو' | 'لە کاردایە' | 'داهاتوو';
}

export interface MindMapNode {
  id: string;
  label: string;
  details?: string;
  children?: MindMapNode[];
}

export interface ResearchOutline {
  title: string;
  abstractSummary: string;
  chapters: {
    chapterNumber: number;
    chapterTitle: string;
    subsections: string[];
    estimatedWordCount: number;
  }[];
}

export interface AcademicTableData {
  title: string;
  headers: string[];
  rows: string[][];
  markdownTable: string;
  latexTable: string;
}

export interface AcademicFigureData {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'concept_flow';
  svgMarkup: string;
  caption: string;
}

export interface JournalMetricsResult {
  journalName: string;
  issn?: string;
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  impactFactor: number;
  hIndex: number;
  scope: string;
  acceptanceRatePercentage: number;
  averageReviewWeeks: number;
  matchScorePercentage: number;
}

export interface AuthorHIndexResult {
  authorName: string;
  orcid?: string;
  hIndex: number;
  totalCitations: number;
  i10Index: number;
  topPublications: { title: string; year: string; citations: number }[];
}

export interface WritingTemplateItem {
  id: string;
  type: 'proposal' | 'abstract' | 'dissertation' | 'grant' | 'literature_review';
  titleKurdish: string;
  titleEnglish: string;
  structureSections: { heading: string; placeholderGuide: string }[];
}

/**
 * Fetch publication details by DOI via Crossref API
 */
export async function resolveDoi(doi: string): Promise<DoiResolutionResult> {
  const cleanDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as { message?: { title?: string[]; author?: { given?: string; family?: string }[]; publisher?: string; 'container-title'?: string[]; created?: { 'date-parts'?: number[][] }; volume?: string; issue?: string; page?: string; URL?: string } };
      const msg = data.message || {};
      const title = msg.title?.[0] || `Publication (${cleanDoi})`;
      const authors = msg.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || [];
      const year = String(msg.created?.['date-parts']?.[0]?.[0] || 'n.d.');
      const journal = msg['container-title']?.[0] || 'Unknown journal';
      const publisher = msg.publisher || 'Unknown publisher';

      const apa = `${authors.join(', ')} (${year}). ${title}. ${journal}, ${msg.volume || ''}(${msg.issue || ''}), ${msg.page || ''}. https://doi.org/${cleanDoi}`;

      return {
        doi: cleanDoi,
        title,
        authors,
        publisher,
        journal,
        publishedYear: year,
        volume: msg.volume,
        issue: msg.issue,
        page: msg.page,
        url: msg.URL || `https://doi.org/${cleanDoi}`,
        citationFormattedAPA: apa
      };
    }
  } catch (err) {
    console.warn('DOI Resolver error:', err);
  }

  throw new Error(`DOI نەسەلمێنرا یان Crossref بەردەست نەبوو: ${cleanDoi}`);
}

/**
 * Fetch book details by ISBN via Open Library API
 */
export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
  if (![10, 13].includes(cleanIsbn.length) || !/^\d{9}[\dX]$|^\d{13}$/.test(cleanIsbn)) {
    throw new Error(`ISBN شێوەی دروستی نییە: ${cleanIsbn}`);
  }
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as Record<string, { title?: string; authors?: { name?: string }[]; publishers?: { name?: string }[]; publish_date?: string; number_of_pages?: number; cover?: { medium?: string } }>;
      const key = `ISBN:${cleanIsbn}`;
      if (data[key]) {
        const item = data[key];
        return {
          isbn: cleanIsbn,
          title: item.title || `Book (ISBN: ${cleanIsbn})`,
          authors: item.authors?.map(a => a.name || '').filter(Boolean) || [],
          publisher: item.publishers?.[0]?.name || 'Unknown publisher',
          publishDate: item.publish_date || 'n.d.',
          pages: item.number_of_pages,
          coverUrl: item.cover?.medium,
          description: `کتێبی ئەکادیمی تۆمارکراو لە سەرچاوەی ژمارەیی OpenLibrary بۆ ISBN ${cleanIsbn}`
        };
      }
    }
  } catch (err) {
    console.warn('ISBN Lookup error:', err);
  }

  throw new Error(`ISBN نەدۆزرایەوە یان Open Library بەردەست نەبوو: ${cleanIsbn}`);
}

/**
 * Lookup ISSN metrics and journal data
 */
export async function lookupIssn(issn: string): Promise<IssnLookupResult> {
  const cleanIssn = issn.trim();
  const compact = cleanIssn.replace(/-/g, '').toUpperCase();
  if (!/^\d{7}[\dX]$/.test(compact)) {
    throw new Error(`ISSN شێوەی دروستی نییە: ${cleanIssn}`);
  }

  const checksum = compact
    .slice(0, 7)
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (8 - index), 0);
  const remainder = checksum % 11;
  const expected = remainder === 0 ? '0' : remainder === 1 ? 'X' : String(11 - remainder);
  if (compact[7] !== expected) {
    throw new Error(`ISSN check digit دروست نییە: ${cleanIssn}`);
  }

  const normalizedIssn = `${compact.slice(0, 4)}-${compact.slice(4)}`;
  const res = await fetch(`https://api.crossref.org/journals/${encodeURIComponent(normalizedIssn)}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'AcademicKurdishPlatform/1.0' },
    signal: AbortSignal.timeout(5000)
  });

  if (!res.ok) {
    throw new Error(`ISSN لە Crossref نەدۆزرایەوە: ${normalizedIssn}`);
  }

  const data = await res.json() as {
    message?: {
      title?: string;
      publisher?: string;
    };
  };
  const message = data.message;
  if (!message?.title && !message?.publisher) {
    throw new Error(`Crossref تۆماری تەواوی ISSN نەگەڕاندەوە: ${normalizedIssn}`);
  }

  return {
    issn: normalizedIssn,
    journalTitle: message.title || 'Unknown journal',
    publisher: message.publisher || 'Unknown publisher',
    country: 'Unknown',
    quartile: null,
    impactFactor: null,
    openAccess: null,
    subjects: []
  };
}

/**
 * Deduplicate references array
 */
export function removeDuplicateReferences(references: string[]): { uniqueReferences: string[]; duplicatesRemovedCount: number } {
  const seen = new Set<string>();
  const uniqueReferences: string[] = [];
  let duplicatesRemovedCount = 0;

  for (const ref of references) {
    const normalized = ref.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (normalized.length > 5 && seen.has(normalized)) {
      duplicatesRemovedCount++;
    } else {
      if (normalized.length > 5) seen.add(normalized);
      uniqueReferences.push(ref.trim());
    }
  }

  return { uniqueReferences, duplicatesRemovedCount };
}
