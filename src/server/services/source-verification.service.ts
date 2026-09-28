import { GoogleGenAI } from '@google/genai';
import { lookupIsbn, lookupIssn, resolveDoi } from '../../helpers/extended-academic-tools';

export type TrustLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SourceVerificationReport {
  sourceId: string;
  sourceTitle: string;
  author: string;
  year?: string;
  publisher: string;
  doiOrIsbn?: string;
  integrityScore: number;
  trustLevel: TrustLevel;
  existenceVerified: boolean;
  metadataAccuracy: number;
  peerReviewed: boolean;
  rejectedAsFabricated: boolean;
  rejectionReasonKurdish?: string;
  kurdishVerificationDetails: string;
}

type InputSource = {
  id?: string;
  sourceId?: string;
  title: string;
  author?: string;
  year?: string | number;
  doi?: string;
  isbn?: string;
  issn?: string;
  publisher?: string;
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(value: string): Set<string> {
  return new Set(normalizeTitle(value).split(' ').filter(token => token.length > 2));
}

function authorOverlap(inputAuthor: string | undefined, externalAuthors: string[]): number {
  const inputTokens = new Set(
    normalize(inputAuthor || '')
      .split(' ')
      .filter(token => token.length > 2)
  );
  const externalTokens = new Set(
    normalize(externalAuthors.join(' '))
      .split(' ')
      .filter(token => token.length > 2)
  );
  if (inputTokens.size === 0 || externalTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of inputTokens) {
    if (externalTokens.has(token)) overlap++;
  }
  return overlap / inputTokens.size;
}

function titleSimilarity(a: string, b: string): number {
  const left = titleTokens(a);
  const right = titleTokens(b);
  if (left.size === 0 || right.size === 0) return 0;

  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap++;
  }

  return overlap / Math.max(left.size, right.size);
}

function normalizeDoi(value?: string): string {
  return (value || '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .toLowerCase();
}

type CrossrefCandidate = {
  title: string;
  authors: string[];
  publisher: string;
  year: string;
  doi: string;
};

async function searchCrossrefByMetadata(source: InputSource): Promise<CrossrefCandidate | undefined> {
  const query = [source.title, source.author, source.publisher].filter(Boolean).join(' ').trim();
  if (!query) return undefined;

  try {
    const response = await fetch(
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mam-Professor-Academic-Platform/1.0'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) return undefined;

    const data = await response.json() as {
      message?: {
        items?: Array<{
          title?: string[];
          author?: Array<{ given?: string; family?: string }>;
          publisher?: string;
          DOI?: string;
          published?: { 'date-parts'?: number[][] };
          issued?: { 'date-parts'?: number[][] };
        }>
      }
    };

    const items = Array.isArray(data.message?.items) ? data.message.items : [];
    let best: { candidate: CrossrefCandidate; score: number; authorScore: number; yearMatch: boolean } | undefined;

    for (const item of items) {
      const title = item.title?.[0]?.trim() || '';
      if (!title) continue;

      const authors = (item.author || [])
        .map(author => [author.given, author.family].filter(Boolean).join(' ').trim())
        .filter(Boolean);

      const score = titleSimilarity(source.title, title);
      const authorScore = source.author
        ? authorOverlap(source.author, authors)
        : 1;
      const sourceYear = Number(source.year);
      const itemYear = Number(
        item.published?.['date-parts']?.[0]?.[0] ??
        item.issued?.['date-parts']?.[0]?.[0] ??
        0
      );
      const yearMatch = !Number.isFinite(sourceYear) || !sourceYear || !itemYear
        ? true
        : Math.abs(sourceYear - itemYear) <= 1;

      if (!best || score + authorScore * 0.1 > best.score + best.authorScore * 0.1) {
        best = {
          candidate: {
            title,
            authors,
            publisher: item.publisher || '',
            year: itemYear ? String(itemYear) : '',
            doi: item.DOI || ''
          },
          score,
          authorScore,
          yearMatch
        };
      }
    }

    if (!best || best.score < 0.82 || best.authorScore < 0.5 || !best.yearMatch) {
      return undefined;
    }

    return best.candidate;
  } catch {
    return undefined;
  }
}

export class SourceVerificationService {
  /**
   * Citation eligibility is established from authoritative metadata, not from an LLM claim.
   * DOI resolution through Crossref can establish existence and metadata consistency.
   * Absence of an authoritative resolution leaves the source explicitly unverified.
   */
  public async verifySources(
    sources: InputSource[],
    _getGeminiClient: () => GoogleGenAI
  ): Promise<{
    verifiedSources: SourceVerificationReport[];
    rejectedSources: SourceVerificationReport[];
    unverifiedSources: SourceVerificationReport[];
    allReports: SourceVerificationReport[];
    rejectedSourcesCount: number;
  }> {
    const uniqueSources = sources.filter(source => source && typeof source.title === 'string');

    const externallyResolved = new Map<string, Awaited<ReturnType<typeof resolveDoi>>>();
    const isbnResolved = new Map<string, Awaited<ReturnType<typeof lookupIsbn>>>();
    const issnResolved = new Map<string, Awaited<ReturnType<typeof lookupIssn>>>();
    await Promise.all([
      ...uniqueSources
        .filter(source => Boolean(source.doi?.trim()))
        .slice(0, 20)
        .map(async source => {
          const doi = normalizeDoi(source.doi);
          try { externallyResolved.set(doi, await resolveDoi(doi)); } catch {}
        }),
      ...uniqueSources
        .filter(source => Boolean(source.isbn?.trim()))
        .slice(0, 20)
        .map(async source => {
          const isbn = String(source.isbn).replace(/[^0-9X]/gi, '').toUpperCase();
          try { isbnResolved.set(isbn, await lookupIsbn(isbn)); } catch {}
        }),
      ...uniqueSources
        .filter(source => Boolean(source.issn?.trim()))
        .slice(0, 20)
        .map(async source => {
          const issn = String(source.issn).trim();
          try { issnResolved.set(issn.replace(/-/g, '').toUpperCase(), await lookupIssn(issn)); } catch {}
        })
    ]);
    // DOI/ISBN/ISSN lookups are authoritative metadata checks. Provider
    // absence leaves the source unverified rather than inventing metadata.

    const metadataResolved: Array<CrossrefCandidate | undefined> = await Promise.all(uniqueSources.map(source =>
      !source.doi && !source.isbn && !source.issn ? searchCrossrefByMetadata(source) : Promise.resolve(undefined)
    ));

    const reports = uniqueSources.map((source, index): SourceVerificationReport => {
      const inputDoi = normalizeDoi(source.doi);
      const inputIsbn = String(source.isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
      const inputIssn = String(source.issn || '').replace(/-/g, '').toUpperCase();
      const external = inputDoi ? externallyResolved.get(inputDoi) : undefined;
      const isbnExternal = inputIsbn ? isbnResolved.get(inputIsbn) : undefined;
      const issnExternal = inputIssn ? issnResolved.get(inputIssn) : undefined;

      const sourceId = String(source.id || source.sourceId || source.doi || source.title).trim();

      if (external) {
        const titleMatch = titleSimilarity(source.title, external.title) >= 0.72;
        const inputAuthor = (source.author || '').trim();
        const authorMatch = !inputAuthor || external.authors.length === 0
          ? true
          : authorOverlap(inputAuthor, external.authors) >= 0.5;
        const inputYear = Number(source.year);
        const externalYear = Number(external.publishedYear);
        const yearMatch = !Number.isFinite(inputYear) || !Number.isFinite(externalYear) || inputYear === 0
          ? true
          : Math.abs(inputYear - externalYear) <= 1;
        const matches = titleMatch && authorMatch && yearMatch;
        if (!matches) {
          return {
            sourceId,
            sourceTitle: source.title,
            author: source.author || 'نادیار',
            year: String(source.year || ''),
            publisher: source.publisher || 'نادیار',
            doiOrIsbn: source.doi || '',
            integrityScore: 0,
            trustLevel: 'F',
            existenceVerified: true,
            metadataAccuracy: Math.round((Number(titleMatch) + Number(authorMatch) + Number(yearMatch)) / 3 * 100),
            peerReviewed: false,
            rejectedAsFabricated: true,
            rejectionReasonKurdish: 'metadata ـی سەرچاوە لەگەڵ تۆماری DOI لە Crossref بە تەواوی هاوتا نییە؛ تۆمارەکە بۆ Citation ڕەتکرایەوە.',
            kurdishVerificationDetails: 'DOI بە شێوەی دەرەکی دۆزرایەوە، بەڵام ناسنامەی سەرچاوەکە لەگەڵ metadata ـی Crossref ناگونجێت.'
          };
        }

        return {
          sourceId,
          sourceTitle: external.title,
          author: external.authors.join(', ') || source.author || 'نادیار',
          year: external.publishedYear || String(source.year || ''),
          publisher: external.publisher || source.publisher || 'نادیار',
          doiOrIsbn: external.doi,
          integrityScore: 80,
          trustLevel: 'C',
          existenceVerified: true,
          metadataAccuracy: 100,
          peerReviewed: false,
          rejectedAsFabricated: false,
          kurdishVerificationDetails: 'بونی سەرچاوە و metadata ـی سەرەکی بە DOI/Crossref پشتڕاستکرایەوە. ئەمە بە تەنها پشتڕاستکردنەوەی Peer Review نییە.'
        };
      }

      if (isbnExternal) {
        const titleMatch = titleSimilarity(source.title, isbnExternal.title) >= 0.65;
        const authorMatch = !source.author || isbnExternal.authors.length === 0
          ? true
          : authorOverlap(source.author, isbnExternal.authors) >= 0.5;
        const matched = titleMatch && authorMatch;
        return {
          sourceId,
          sourceTitle: isbnExternal.title,
          author: isbnExternal.authors.join(', ') || source.author || 'نادیار',
          year: isbnExternal.publishDate || String(source.year || ''),
          publisher: isbnExternal.publisher || source.publisher || 'نادیار',
          doiOrIsbn: isbnExternal.isbn,
          integrityScore: matched ? 82 : 0,
          trustLevel: matched ? 'C' : 'F',
          existenceVerified: true,
          metadataAccuracy: Math.round((Number(titleMatch) + Number(authorMatch)) / 2 * 100),
          peerReviewed: false,
          rejectedAsFabricated: !matched,
          rejectionReasonKurdish: matched ? undefined : 'ناونیشان یان نووسەر لەگەڵ تۆماری ISBN ناگونجێت.',
          kurdishVerificationDetails: 'ISBN بە Open Library پشتڕاستکرایەوە؛ ئەمە بە تەنها Peer Review ـی سەرچاوەکە پشتڕاست ناکات.'
        };
      }

      if (metadataResolved[index]) {
        const candidate = metadataResolved[index]!;
        return {
          sourceId,
          sourceTitle: candidate.title,
          author: candidate.authors.join(', ') || source.author || 'نادیار',
          year: candidate.year || String(source.year || ''),
          publisher: candidate.publisher || source.publisher || 'نادیار',
          doiOrIsbn: candidate.doi,
          integrityScore: 78,
          trustLevel: 'C',
          existenceVerified: true,
          metadataAccuracy: 100,
          peerReviewed: false,
          rejectedAsFabricated: false,
          kurdishVerificationDetails: 'سەرچاوەکە بە گەڕانی metadata ـی Crossref (title/author/year) دۆزرایەوە و metadata ـەکان هاوتا بوون. ئەمە بە تەنها peer-review یان full-text verification نییە.'
        };
      }

      if (issnExternal) {
        const titleMatch = !issnExternal.journalTitle || titleSimilarity(source.title, issnExternal.journalTitle) >= 0.65;
        const publisherMatch = !source.publisher || !issnExternal.publisher ||
          normalize(source.publisher) === normalize(issnExternal.publisher);
        const matched = titleMatch && publisherMatch;
        return {
          sourceId,
          sourceTitle: issnExternal.journalTitle || source.title,
          author: source.author || 'نادیار',
          year: String(source.year || ''),
          publisher: issnExternal.publisher || source.publisher || 'نادیار',
          doiOrIsbn: issnExternal.issn,
          integrityScore: matched ? 75 : 0,
          trustLevel: matched ? 'C' : 'F',
          existenceVerified: true,
          metadataAccuracy: Math.round((Number(titleMatch) + Number(publisherMatch)) / 2 * 100),
          peerReviewed: false,
          rejectedAsFabricated: !matched,
          rejectionReasonKurdish: matched ? undefined : 'تۆماری ISSN لەگەڵ ناونیشان/دەرکەرەوەی پێدراو ناگونجێت.',
          kurdishVerificationDetails: 'ISSN بە Crossref پشتڕاستکرایەوە؛ ئەمە بە تەنها peer-review بوونی وتارێک پشتڕاست ناکات.'
        };
      }

      return {
        sourceId,
        sourceTitle: source.title,
        author: source.author || 'نادیار',
        publisher: source.publisher || 'نادیار',
        doiOrIsbn: source.doi || '',
        integrityScore: 0,
        trustLevel: 'D',
        existenceVerified: false,
        metadataAccuracy: 0,
        peerReviewed: false,
        rejectedAsFabricated: false,
        rejectionReasonKurdish: 'هیچ سەرچاوەیەکی دەرەکیی پشتڕاستکەرەوە بۆ ئەم تۆمارە بەردەست نەبوو.',
        kurdishVerificationDetails: 'سەرچاوەکە نە Verified ـە و نابێت وەک citation ـی پشتڕاستکراو بەکاربهێنرێت تا verification ـی دەرەکی تەواو بکرێت.'
      };
    });

    const verifiedSources = reports.filter(report =>
      report.existenceVerified === true &&
      report.rejectedAsFabricated !== true &&
      report.trustLevel !== 'D' &&
      report.trustLevel !== 'F'
    );
    const rejectedSources = reports.filter(report => report.rejectedAsFabricated);
    const unverifiedSources = reports.filter(report =>
      !report.existenceVerified && !report.rejectedAsFabricated
    );

    return {
      verifiedSources,
      rejectedSources,
      unverifiedSources,
      allReports: reports,
      rejectedSourcesCount: rejectedSources.length
    };
  }
}

export const sourceVerificationService = new SourceVerificationService();
