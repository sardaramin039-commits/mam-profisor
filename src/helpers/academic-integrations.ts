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

type SourceMetadata = {
  sourceType: string;
  citationCount?: number;
  year?: string | number;
  peerReviewed?: boolean;
  title?: string;
  authors?: string[];
};

function validYear(year?: string | number): string {
  const value = String(year ?? '').trim();
  return value && /^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(value) ? value : 'n.d.';
}

function cleanAuthors(authors: unknown): string[] {
  return Array.isArray(authors)
    ? authors.map(author => String(author || '').trim()).filter(Boolean)
    : [];
}

function sourceId(prefix: string, value: string, index: number): string {
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

function buildSource(
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
        peerReviewed: false
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
          peerReviewed: false
        });
      });
  } catch (err) {
    console.warn('DOAJ fetch failed; returning no synthetic records.', err);
    return [];
  }
}

/**
 * OpenAlex is a scholarly discovery index. Its public API provides work metadata
 * and persistent OpenAlex/DOI identifiers; it does not by itself prove peer review
 * or evidence support.
 */
export async function fetchOpenAlex(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url =
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=4&select=id,doi,title,authorships,publication_year,primary_location,cited_by_count`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);

    const data = await res.json() as {
      results?: Array<{
        id?: string;
        doi?: string | null;
        title?: string;
        publication_year?: number;
        authorships?: Array<{ author?: { display_name?: string } }>;
        primary_location?: {
          landing_page_url?: string | null;
          source?: { display_name?: string | null };
        };
        cited_by_count?: number;
      }>;
    };

    return (data.results || [])
      .filter(item => Boolean(item.id && item.title?.trim()))
      .map((item, index) => {
        const doi = String(item.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
        const openAlexId = String(item.id || '').trim();
        const authors = cleanAuthors(
          item.authorships?.map(authorship => authorship.author?.display_name)
        );
        const url = item.primary_location?.landing_page_url || item.id!;
        return buildSource({
          id: sourceId('openalex', openAlexId || doi, index),
          title: item.title!.trim(),
          authors,
          year: validYear(item.publication_year),
          sourceType: 'OpenAlex',
          url,
          snippet: item.primary_location?.source?.display_name || '',
          citationCount: Number.isFinite(item.cited_by_count) ? item.cited_by_count : undefined,
          peerReviewed: false,
          ...(doi ? { doi } : {}),
          openAlexId
        });
      });
  } catch (err) {
    console.warn('OpenAlex fetch failed; returning no synthetic records.', err);
    return [];
  }
}

/**
 * Crossref is an authoritative DOI-registration metadata source for registered works.
 * A Crossref match still does not establish peer review or evidence support.
 */
export async function fetchCrossref(query: string): Promise<AcademicSourceItem[]> {
  try {
    const mailto = String(process.env['CROSSREF_MAILTO'] || '').trim();
    const mailtoParam = mailto ? `&mailto=${encodeURIComponent(mailto)}` : '';
    const url =
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=4&select=DOI,title,author,publisher,published,issued,URL,container-title,is-referenced-by-count${mailtoParam}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);

    const data = await res.json() as {
      message?: {
        items?: Array<{
          DOI?: string;
          title?: string[];
          author?: Array<{ given?: string; family?: string }>;
          publisher?: string;
          published?: { 'date-parts'?: number[][] };
          issued?: { 'date-parts'?: number[][] };
          URL?: string;
          'container-title'?: string[];
          'is-referenced-by-count'?: number;
        }>;
      };
    };

    return (data.message?.items || [])
      .filter(item => Boolean(item.DOI && item.title?.[0]?.trim()))
      .map((item, index) => {
        const doi = String(item.DOI || '').trim();
        const authors = cleanAuthors(
          item.author?.map(author => [author.given, author.family].filter(Boolean).join(' ').trim())
        );
        const publishedYear = item.published?.['date-parts']?.[0]?.[0] ??
          item.issued?.['date-parts']?.[0]?.[0];
        const title = item.title![0].trim();
        const journal = item['container-title']?.[0]?.trim() || '';
        return buildSource({
          id: sourceId('crossref', doi, index),
          title,
          authors,
          year: validYear(publishedYear),
          sourceType: 'Crossref',
          url: item.URL || `https://doi.org/${doi}`,
          snippet: journal,
          citationCount: Number.isFinite(item['is-referenced-by-count'])
            ? item['is-referenced-by-count']
            : undefined,
          peerReviewed: false,
          doi,
          crossrefId: doi,
          publisher: item.publisher?.trim() || undefined
        });
      });
  } catch (err) {
    console.warn('Crossref fetch failed; returning no synthetic records.', err);
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
