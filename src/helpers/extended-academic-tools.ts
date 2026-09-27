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
  country?: string;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  impactFactor?: number;
  openAccess?: boolean;
  subjects?: string[];
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
export async function resolveDoi(doi: string): Promise<DoiResolutionResult | null> {
  const cleanDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as { message?: { title?: string[]; author?: { given?: string; family?: string }[]; publisher?: string; 'container-title'?: string[]; created?: { 'date-parts'?: number[][] }; volume?: string; issue?: string; page?: string; URL?: string } };
      const msg = data.message || {};
      const title = msg.title?.[0]?.trim();
      const authors = msg.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || [];
      const year = String(msg.created?.['date-parts']?.[0]?.[0] || '');
      const journal = msg['container-title']?.[0]?.trim() || '';
      const publisher = msg.publisher?.trim() || '';

      const apa = `${authors.join(', ')}${year ? ` (${year})` : ''}. ${title || `DOI ${cleanDoi}`}.${journal ? ` ${journal}.` : ''}${msg.volume ? ` ${msg.volume}` : ''}${msg.issue ? `(${msg.issue})` : ''}${msg.page ? `, ${msg.page}` : ''}. https://doi.org/${cleanDoi}`;

      return {
        doi: cleanDoi,
        title: title || `DOI ${cleanDoi}`,
        authors,
        publisher: publisher || 'نادیار',
        journal: journal || 'نادیار',
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

  return null;
}

/**
 * Fetch book details by ISBN via Open Library API
 */
export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult | null> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
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
          title: item.title || `ISBN ${cleanIsbn}`,
          authors: item.authors?.map(a => a.name || '').filter(Boolean) || [],
          publisher: item.publishers?.[0]?.name || 'نادیار',
          publishDate: item.publish_date || 'نادیار',
          pages: item.number_of_pages,
          coverUrl: item.cover?.medium,
          description: `کتێبی ئەکادیمی تۆمارکراو لە سەرچاوەی ژمارەیی OpenLibrary بۆ ISBN ${cleanIsbn}`
        };
      }
    }
  } catch (err) {
    console.warn('ISBN Lookup error:', err);
  }

  return null;
}

/**
 * Lookup ISSN metrics and journal data
 */
export async function lookupIssn(issn: string): Promise<IssnLookupResult | null> {
  const cleanIssn = issn.trim();

  if (!/^\\d{4}-\\d{3}[\\dX]$/i.test(cleanIssn)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.crossref.org/journals/${encodeURIComponent(cleanIssn)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json() as {
      message?: {
        title?: string;
        publisher?: string;
      };
    };

    const message = data.message;
    if (!message?.title) return null;

    return {
      issn: cleanIssn,
      journalTitle: message.title,
      publisher: message.publisher || 'نادیار'
    };
  } catch (err) {
    console.warn('ISSN Lookup error:', err);
    return null;
  }
}

/**
 * Deduplicate references array
 */
export function removeDuplicateReferences(references: string[]): { uniqueReferences: string[]; duplicatesRemovedCount: number } {
  const seen = new Set<string>();
  const uniqueReferences: string[] = [];
  let duplicatesRemovedCount = 0;

  for (const ref of references) {
    const normalized = ref.toLowerCase().trim().replace(/[^\p{L}\p{N}]/gu, '');
    if (normalized.length > 5 && seen.has(normalized)) {
      duplicatesRemovedCount++;
    } else {
      if (normalized.length > 5) seen.add(normalized);
      uniqueReferences.push(ref.trim());
    }
  }

  return { uniqueReferences, duplicatesRemovedCount };
}
