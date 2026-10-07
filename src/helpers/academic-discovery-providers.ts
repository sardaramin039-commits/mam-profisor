import {
  AcademicSourceItem,
  buildSource,
  cleanAuthors,
  sourceId,
  validYear
} from './academic-integrations';

export async function fetchOpenAlex(query: string): Promise<AcademicSourceItem[]> {
  try {
    const url =
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=4&select=id,doi,title,authorships,publication_year,primary_location,cited_by_count`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' },
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
        const doi = String(item.doi || '')
          .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
          .trim();
        const openAlexId = String(item.id || '').trim();
        const authors = cleanAuthors(
          item.authorships?.map(authorship => authorship.author?.display_name)
        );
        return buildSource({
          id: sourceId('openalex', openAlexId || doi, index),
          title: item.title!.trim(),
          authors,
          year: validYear(item.publication_year),
          sourceType: 'OpenAlex',
          url: item.primary_location?.landing_page_url || item.id!,
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

export async function fetchCrossref(query: string): Promise<AcademicSourceItem[]> {
  try {
    const mailto = String(process.env['CROSSREF_MAILTO'] || '').trim();
    const mailtoParam = mailto ? `&mailto=${encodeURIComponent(mailto)}` : '';
    const url =
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=4&select=DOI,title,author,publisher,published,issued,URL,container-title,is-referenced-by-count${mailtoParam}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' },
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
