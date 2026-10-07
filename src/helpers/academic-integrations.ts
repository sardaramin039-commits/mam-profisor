import {
  AcademicSourceItem,
  PeerReviewReport,
  PlagiarismAnalysisReport,
  CitationValidationReport,
  OcrExtractionResult,
  FactCheckResult,
  KnowledgeGraphNode,
  KnowledgeGraphLink,
  KnowledgeGraphData,
  MultiAgentResponse
} from './academic-types';

export * from './academic-types';

export type SourceMetadata = {
  sourceType: string;
  citationCount?: number;
  year?: string | number;
  peerReviewed?: boolean;
  title?: string;
  authors?: string[];
  evidenceText?: string;
  evidenceType?: 'abstract' | 'snippet' | 'full-text';
};

export function validYear(year?: string | number): string {
  const value = String(year ?? '').trim();
  return value && /^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(value) ? value : 'n.d.';
}

export function cleanAuthors(authors: unknown): string[] {
  return Array.isArray(authors)
    ? authors.map(author => String(author || '').trim()).filter(Boolean)
    : [];
}

export function sourceId(prefix: string, value: string, index: number): string {
  const raw = value.trim();
  return raw ? `${prefix}-${raw.slice(0, 160)}` : `${prefix}-record-${index + 1}`;
}

/**
 * Heuristic metadata score only. This is NOT identity verification, peer-review proof,
 * or evidence validation; those decisions belong to SourceVerificationService.
 */
export function calculateSourceConfidence(source: SourceMetadata): number {
  let score = 40;
  const year = Number(validYear(source.year));

  if (source.title?.trim()) score += 10;
  if (source.authors?.length) score += 10;
  if (source.peerReviewed === true) score += 15;

  if (Number.isFinite(source.citationCount)) {
    if ((source.citationCount ?? 0) > 100) score += 12;
    else if ((source.citationCount ?? 0) > 20) score += 8;
    else if ((source.citationCount ?? 0) > 5) score += 4;
  }

  if (year >= 2020 && year <= new Date().getUTCFullYear()) score += 8;
  else if (year >= 2015 && year < 2020) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function buildSource(
  input: Omit<AcademicSourceItem, 'confidenceScore' | 'peerReviewed'> & {
    citationCount?: number;
    peerReviewed?: boolean;
  }
): AcademicSourceItem {
  const authors = cleanAuthors(input.authors);
  const confidenceScore = calculateSourceConfidence({
    sourceType: input.sourceType,
    citationCount: input.citationCount,
    year: input.year,
    peerReviewed: input.peerReviewed,
    title: input.title,
    authors
  });

  return {
    ...input,
    authors,
    confidenceScore,
    peerReviewed: input.peerReviewed === true
  };
}

/**
 * Semantic Scholar is a discovery index, not proof that every result is peer reviewed.
 */
export async function fetchSemanticScholar(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=4&fields=paperId,title,authors,year,abstract,citationCount,url`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Semantic Scholar HTTP ${res.status}`);

    const data = await res.json() as {
      data?: Array<{
        paperId?: string;
        title?: string;
        authors?: Array<{ name?: string }>;
        year?: number;
        abstract?: string;
        citationCount?: number;
        url?: string;
      }>;
    };

    return (data.data || [])
      .filter(item => Boolean(item.paperId && item.title?.trim()))
      .map((item, index) => buildSource({
        id: sourceId('sem', item.paperId || '', index),
        title: item.title!.trim(),
        authors: cleanAuthors(item.authors?.map(author => author.name)),
        year: validYear(item.year),
        sourceType: 'SemanticScholar',
        url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
        snippet: item.abstract?.trim() || '',
        citationCount: Number.isFinite(item.citationCount) ? item.citationCount : undefined,
        peerReviewed: false,
        ...(item.abstract?.trim()
          ? { evidenceText: item.abstract.trim(), evidenceType: 'abstract' as const, evidenceUrl: item.url || `https://www.semanticscholar.org/paper/${item.paperId}` }
          : {})
      }));
  } catch (err) {
    console.warn('Semantic Scholar fetch failed; returning no synthetic records.', err);
    return [];
  }
}

/**
 * PubMed search + ESummary. Only returned API metadata is exposed as a source candidate.
 */
export async function fetchPubMed(query: string): Promise<AcademicSourceItem[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=3`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) throw new Error(`PubMed search HTTP ${searchRes.status}`);

    const searchData = await searchRes.json() as { esearchresult?: { idlist?: string[] } };
    const ids = searchData.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(5000) });
    if (!summaryRes.ok) throw new Error(`PubMed summary HTTP ${summaryRes.status}`);

    const summaryData = await summaryRes.json() as {
      result?: Record<string, {
        uid?: string;
        title?: string;
        pubdate?: string;
        authors?: Array<{ name?: string }>;
        fulljournalname?: string;
        elocationid?: string;
      }>;
    };

    const result = summaryData.result || {};
    return ids.flatMap((id, index) => {
      const item = result[id];
      if (!item?.title?.trim()) return [];

      const url = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
      const journal = item.fulljournalname?.trim() || '';
      const location = item.elocationid?.trim() || '';
      return [buildSource({
        id: sourceId('pubmed', id, index),
        title: item.title.trim(),
        authors: cleanAuthors(item.authors?.map(author => author.name)),
        year: validYear(item.pubdate?.match(/\b\d{4}\b/)?.[0]),
        sourceType: 'PubMed',
        url,
        snippet: [journal, location].filter(Boolean).join(' | '),
        peerReviewed: false
      })];
    });
  } catch (err) {
    console.warn('PubMed fetch failed; returning no synthetic records.', err);
    return [];
  }
}

export async function fetchOpenLibrary(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open Library HTTP ${res.status}`);

    const data = await res.json() as {
      docs?: Array<{
        author_name?: string[];
        first_publish_year?: number;
        key?: string;
        title?: string;
      }>;
    };

    return (data.docs || [])
      .filter(doc => Boolean(doc.key && doc.title?.trim()))
      .map((doc, index) => buildSource({
        id: sourceId('openlib', doc.key || '', index),
        title: doc.title!.trim(),
        authors: cleanAuthors(doc.author_name),
        year: validYear(doc.first_publish_year),
        sourceType: 'OpenLibrary',
        url: `https://openlibrary.org${doc.key}`,
        snippet: '',
        peerReviewed: false
      }));
  } catch (err) {
    console.warn('Open Library fetch failed; returning no synthetic records.', err);
    return [];
  }
}

export async function fetchInternetArchive(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:texts&fl[]=identifier,title,creator,year&rows=3&page=1&output=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Internet Archive HTTP ${res.status}`);

    const data = await res.json() as {
      response?: {
        docs?: Array<{
          identifier?: string;
          title?: string;
          creator?: string | string[];
          year?: number | string;
        }>;
      };
    };

    return (data.response?.docs || [])
      .filter(doc => Boolean(doc.identifier && doc.title?.trim()))
      .map((doc, index) => buildSource({
        id: sourceId('ia', doc.identifier || '', index),
        title: doc.title!.trim(),
        authors: cleanAuthors(Array.isArray(doc.creator) ? doc.creator : [doc.creator]),
        year: validYear(doc.year),
        sourceType: 'InternetArchive',
        url: `https://archive.org/details/${doc.identifier}`,
        snippet: '',
        peerReviewed: false
      }));
  } catch (err) {
    console.warn('Internet Archive fetch failed; returning no synthetic records.', err);
    return [];
  }
}

export async function fetchDOAJ(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://doaj.org/api/v2/search/articles/${encodeURIComponent(query)}?page=1&pageSize=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`DOAJ HTTP ${res.status}`);

    const data = await res.json() as {
      results?: Array<{
        id?: string;
        bibjson?: {
          title?: string;
          authors?: Array<{ name?: string }>;
          year?: string;
          abstract?: string;
          link?: Array<{ url?: string }>;
        };
      }>;
    };

    return (data.results || [])
      .filter(item => Boolean(item.bibjson?.title?.trim()))
      .map((item, index) => {
        const bib = item.bibjson!;
        const url = bib.link?.map(link => link.url).find(Boolean) || '';
        return buildSource({
          id: sourceId('doaj', item.id || url || bib.title || '', index),
          title: bib.title!.trim(),
          authors: cleanAuthors(bib.authors?.map(author => author.name)),
          year: validYear(bib.year),
          sourceType: 'DOAJ',
          url,
          snippet: '',
          peerReviewed: false,
          ...(bib.abstract?.trim()
            ? { evidenceText: bib.abstract.trim(), evidenceType: 'abstract' as const, evidenceUrl: url || undefined }
            : {})
        });
      });
  } catch (err) {
    console.warn('DOAJ fetch failed; returning no synthetic records.', err);
    return [];
  }
}

/**
 * WorldCat does not have a public metadata endpoint in this adapter.
 * A search URL is not a scholarly record, so it is never emitted as one.
 */
export async function fetchWorldCat(_query: string): Promise<AcademicSourceItem[]> {
  return [];
}

export async function fetchEuropeana(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&rows=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Europeana HTTP ${res.status}`);

    const data = await res.json() as {
      items?: Array<{
        id?: string;
        title?: string[];
        dcCreator?: string[];
        year?: string[];
        guid?: string;
      }>;
    };

    return (data.items || [])
      .filter(item => Boolean(item.id && item.title?.[0]?.trim()))
      .map((item, index) => buildSource({
        id: sourceId('eur', item.id || '', index),
        title: item.title![0].trim(),
        authors: cleanAuthors(item.dcCreator),
        year: validYear(item.year?.[0]),
        sourceType: 'Europeana',
        url: item.guid || `https://www.europeana.eu/en/item${item.id}`,
        snippet: '',
        peerReviewed: false
      }));
  } catch (err) {
    console.warn('Europeana fetch failed; returning no synthetic records.', err);
    return [];
  }
}

export async function fetchLibraryOfCongress(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url = `https://www.loc.gov/books/?q=${encodeURIComponent(query)}&fo=json&c=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Library of Congress HTTP ${res.status}`);

    const data = await res.json() as {
      results?: Array<{
        id?: string;
        title?: string;
        date?: string;
        item?: {
          contributors?: Array<{ name?: string }>;
          date?: string;
        };
        url?: string;
      }>;
    };

    return (data.results || [])
      .filter(item => Boolean(item.id && item.title?.trim()))
      .map((item, index) => buildSource({
        id: sourceId('loc', item.id || '', index),
        title: item.title!.trim(),
        authors: cleanAuthors(item.item?.contributors?.map(contributor => contributor.name)),
        year: validYear(item.item?.date || item.date),
        sourceType: 'LibraryOfCongress',
        url: item.url || `https://www.loc.gov/item/${item.id}/`,
        snippet: '',
        peerReviewed: false
      }));
  } catch (err) {
    console.warn('Library of Congress fetch failed; returning no synthetic records.', err);
    return [];
  }
}

/**
 * OAI-PMH is a harvesting protocol. Without a configured repository endpoint,
 * a generic protocol URL is not a source record and must not become a citation.
 */
export async function fetchOAIPMH(_query: string): Promise<AcademicSourceItem[]> {
  return [];
}
