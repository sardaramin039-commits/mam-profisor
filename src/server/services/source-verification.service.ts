import { GoogleGenAI } from '@google/genai';
import { lookupIsbn, lookupIssn, resolveDoi } from '../../helpers/extended-academic-tools';

export type TrustLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type IdentityVerificationStatus = 'verified' | 'unverified' | 'rejected';
export type EvidenceVerificationStatus = 'verified' | 'unverified' | 'not_available';

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
  identityStatus: IdentityVerificationStatus;
  evidenceStatus: EvidenceVerificationStatus;
  citationEligible: boolean;
  evidenceVerificationMethod?: 'exact-normalized-claim-match';
  evidenceText?: string;
  pageNumber?: string | number | null;
  metadataAccuracy: number;
  peerReviewed: boolean;
  rejectedAsFabricated: boolean;
  rejectionReasonKurdish?: string;
  kurdishVerificationDetails: string;
}

export interface CitationEligibleSource extends SourceVerificationReport {
  citationEligible: true;
  identityStatus: 'verified';
  evidenceStatus: 'verified';
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
  pmid?: string;
  openAlexId?: string;
  crossrefId?: string;
  semanticScholarId?: string;
  publisher?: string;
  claimText?: string;
  evidenceText?: string;
  content?: string;
  fullText?: string;
  text?: string;
  chunkText?: string;
  pageNumber?: string | number | null;
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter(token => token.length > 2));
}

function authorOverlap(inputAuthor: string | undefined, externalAuthors: string[]): number {
  const inputTokens = new Set(
    normalize(inputAuthor || '').split(' ').filter(token => token.length > 2)
  );
  const externalTokens = new Set(
    normalize(externalAuthors.join(' ')).split(' ').filter(token => token.length > 2)
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

function readEvidence(source: {
  evidenceText?: string;
  content?: string;
  fullText?: string;
  text?: string;
  chunkText?: string;
}): string {
  return String(
    source.evidenceText ??
    source.content ??
    source.fullText ??
    source.text ??
    source.chunkText ??
    ''
  ).trim();
}

export function assessEvidenceVerification(source: {
  claimText?: string;
  evidenceText?: string;
  content?: string;
  fullText?: string;
  text?: string;
  chunkText?: string;
}): {
  status: EvidenceVerificationStatus;
  method?: 'exact-normalized-claim-match';
} {
  const claim = normalize(String(source.claimText || ''));
  const evidence = normalize(readEvidence(source));

  if (!claim || !evidence || evidence.length < 10) {
    return { status: 'not_available' };
  }

  if (evidence.includes(claim) || claim.includes(evidence)) {
    return {
      status: 'verified',
      method: 'exact-normalized-claim-match'
    };
  }

  return { status: 'unverified' };
}

function buildBaseReport(
  source: InputSource,
  sourceId: string,
  identityStatus: IdentityVerificationStatus,
  integrityScore: number,
  trustLevel: TrustLevel,
  metadataAccuracy: number,
  details: string,
  rejectedAsFabricated = false,
  rejectionReasonKurdish?: string,
  overrides: Partial<SourceVerificationReport> = {}
): SourceVerificationReport {
  const evidence = assessEvidenceVerification(source);
  const citationEligible = identityStatus === 'verified' && evidence.status === 'verified';

  return {
    sourceId,
    sourceTitle: source.title,
    author: source.author || 'نادیار',
    year: source.year ? String(source.year) : undefined,
    publisher: source.publisher || 'نادیار',
    doiOrIsbn: source.doi || source.isbn || source.issn || undefined,
    integrityScore,
    trustLevel,
    existenceVerified: identityStatus === 'verified',
    identityStatus,
    evidenceStatus: evidence.status,
    citationEligible,
    evidenceVerificationMethod: evidence.method,
    evidenceText: readEvidence(source) || undefined,
    pageNumber: source.pageNumber ?? null,
    metadataAccuracy,
    peerReviewed: false,
    rejectedAsFabricated,
    rejectionReasonKurdish,
    kurdishVerificationDetails: details,
    ...overrides
  };
}

type CrossrefCandidate = {
  title: string;
  authors: string[];
  publisher: string;
  year: string;
  doi: string;
};

async function searchCrossrefByMetadata(
  source: InputSource
): Promise<CrossrefCandidate | undefined> {
  const query = [source.title, source.author, source.publisher]
    .filter(Boolean)
    .join(' ')
    .trim();
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
    let best:
      | { candidate: CrossrefCandidate; score: number; authorScore: number; yearMatch: boolean }
      | undefined;

    for (const item of items) {
      const title = item.title?.[0]?.trim() || '';
      if (!title) continue;

      const authors = (item.author || [])
        .map(author => [author.given, author.family].filter(Boolean).join(' ').trim())
        .filter(Boolean);

      const score = titleSimilarity(source.title, title);
      const authorScore = source.author ? authorOverlap(source.author, authors) : 1;
      const sourceYear = Number(source.year);
      const itemYear = Number(
        item.published?.['date-parts']?.[0]?.[0] ??
        item.issued?.['date-parts']?.[0]?.[0] ??
        0
      );
      const yearMatch =
        !Number.isFinite(sourceYear) || !sourceYear || !itemYear
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
  public async verifySources(
    sources: InputSource[],
    _getGeminiClient: () => GoogleGenAI
  ): Promise<{
    verifiedSources: SourceVerificationReport[];
    citationEligibleSources: CitationEligibleSource[];
    rejectedSources: SourceVerificationReport[];
    unverifiedSources: SourceVerificationReport[];
    allReports: SourceVerificationReport[];
    rejectedSourcesCount: number;
  }> {
    const uniqueSources = sources.filter(
      source => source && typeof source.title === 'string'
    );

    const externallyResolved = new Map<string, Awaited<ReturnType<typeof resolveDoi>>>();
    const isbnResolved = new Map<string, Awaited<ReturnType<typeof lookupIsbn>>>();
    const issnResolved = new Map<string, Awaited<ReturnType<typeof lookupIssn>>>();

    await Promise.all([
      ...uniqueSources.filter(source => Boolean(source.doi?.trim())).slice(0, 20).map(async source => {
        const doi = normalizeDoi(source.doi);
        try { externallyResolved.set(doi, await resolveDoi(doi)); } catch {}
      }),
      ...uniqueSources.filter(source => Boolean(source.isbn?.trim())).slice(0, 20).map(async source => {
        const isbn = String(source.isbn).replace(/[^0-9X]/gi, '').toUpperCase();
        try { isbnResolved.set(isbn, await lookupIsbn(isbn)); } catch {}
      }),
      ...uniqueSources.filter(source => Boolean(source.issn?.trim())).slice(0, 20).map(async source => {
        const issn = String(source.issn).replace(/-/g, '').toUpperCase();
        try { issnResolved.set(issn, await lookupIssn(issn)); } catch {}
      })
    ]);

    const metadataResolved = await Promise.all(
      uniqueSources.map(source =>
        !source.doi && !source.isbn && !source.issn
          ? searchCrossrefByMetadata(source)
          : Promise.resolve(undefined)
      )
    );

    const reports = uniqueSources.map((source, index): SourceVerificationReport => {
      const inputDoi = normalizeDoi(source.doi);
      const inputIsbn = String(source.isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
      const inputIssn = String(source.issn || '').replace(/-/g, '').toUpperCase();
      const external = inputDoi ? externallyResolved.get(inputDoi) : undefined;
      const isbnExternal = inputIsbn ? isbnResolved.get(inputIsbn) : undefined;
      const issnExternal = inputIssn ? issnResolved.get(inputIssn) : undefined;
      const sourceId = String(
        source.id || source.sourceId || source.doi || source.isbn || source.issn || source.title
      ).trim();

      if (external) {
        const titleMatch = titleSimilarity(source.title, external.title) >= 0.72;
        const authorMatch =
          !source.author || external.authors.length === 0
            ? true
            : authorOverlap(source.author, external.authors) >= 0.5;
        const inputYear = Number(source.year);
        const externalYear = Number(external.publishedYear);
        const yearMatch =
          !Number.isFinite(inputYear) || !Number.isFinite(externalYear) || inputYear === 0
            ? true
            : Math.abs(inputYear - externalYear) <= 1;
        const matches = titleMatch && authorMatch && yearMatch;

        if (!matches) {
          return buildBaseReport(
            source,
            sourceId,
            'rejected',
            0,
            'F',
            Math.round((Number(titleMatch) + Number(authorMatch) + Number(yearMatch)) / 3 * 100),
            'DOI دۆزرایەوە، بەڵام metadata ـی سەرچاوە لەگەڵ تۆماری Crossref ناگونجێت.',
            true,
            'metadata ـی سەرچاوە لەگەڵ تۆماری DOI/Crossref بە تەواوی هاوتا نییە.'
          );
        }

        return buildBaseReport(
          { ...source, title: external.title, author: external.authors.join(', ') || source.author, year: external.publishedYear, publisher: external.publisher || source.publisher, doi: external.doi },
          sourceId,
          'verified',
          0,
          'C',
          100,
          'ناسنامەی سەرچاوە بە DOI/Crossref پشتڕاستکراوەتەوە؛ ئەمە بە تەنها peer-review یان evidence verification نییە.',
          false
        );
      }

      if (isbnExternal) {
        const titleMatch = titleSimilarity(source.title, isbnExternal.title) >= 0.65;
        const authorMatch =
          !source.author || isbnExternal.authors.length === 0
            ? true
            : authorOverlap(source.author, isbnExternal.authors) >= 0.5;
        const matched = titleMatch && authorMatch;

        return buildBaseReport(
          { ...source, title: isbnExternal.title, author: isbnExternal.authors.join(', ') || source.author, year: isbnExternal.publishDate || source.year, publisher: isbnExternal.publisher || source.publisher, isbn: isbnExternal.isbn },
          sourceId,
          matched ? 'verified' : 'rejected',
          matched ? 0 : 0,
          matched ? 'C' : 'F',
          Math.round((Number(titleMatch) + Number(authorMatch)) / 2 * 100),
          matched
            ? 'ناسنامەی کتێب بە ISBN/Open Library پشتڕاستکراوەتەوە؛ evidence verification جیاوازە.'
            : 'ناونیشان یان نووسەر لەگەڵ تۆماری ISBN ناگونجێت.',
          !matched,
          matched ? undefined : 'metadata ـی سەرچاوە لەگەڵ تۆماری ISBN ناگونجێت.'
        );
      }

      if (metadataResolved[index]) {
        const candidate = metadataResolved[index]!;
        return buildBaseReport(
          { ...source, title: candidate.title, author: candidate.authors.join(', ') || source.author, year: candidate.year || source.year, publisher: candidate.publisher || source.publisher, doi: candidate.doi || source.doi },
          sourceId,
          'verified',
          0,
          'C',
          100,
          'ناسنامەی سەرچاوە بە metadata ـی Crossref پشتڕاستکراوەتەوە؛ evidence verification جیاوازە.'
        );
      }

      if (issnExternal) {
        const titleMatch =
          !issnExternal.journalTitle ||
          titleSimilarity(source.title, issnExternal.journalTitle) >= 0.65;
        const publisherMatch =
          !source.publisher ||
          !issnExternal.publisher ||
          normalize(source.publisher) === normalize(issnExternal.publisher);
        const matched = titleMatch && publisherMatch;

        return buildBaseReport(
          { ...source, title: issnExternal.journalTitle || source.title, publisher: issnExternal.publisher || source.publisher, issn: issnExternal.issn },
          sourceId,
          matched ? 'verified' : 'rejected',
          matched ? 0 : 0,
          matched ? 'C' : 'F',
          Math.round((Number(titleMatch) + Number(publisherMatch)) / 2 * 100),
          matched
            ? 'ژمارەی ISSN و metadata ـی گۆڤار پشتڕاستکراوەتەوە؛ evidence verification جیاوازە.'
            : 'تۆماری ISSN لەگەڵ metadata ـی پێدراو ناگونجێت.',
          !matched,
          matched ? undefined : 'metadata ـی سەرچاوە لەگەڵ تۆماری ISSN ناگونجێت.'
        );
      }

      return buildBaseReport(
        source,
        sourceId,
        'unverified',
        0,
        'D',
        0,
        'ناسنامەی سەرچاوە بە authority ـی دەرەکی پشتڕاست نەکراوەتەوە؛ citation ـی پشتڕاستکراو نابێت دروست بکرێت.'
      );
    });

    const verifiedSources = reports.filter(
      report => report.identityStatus === 'verified' && !report.rejectedAsFabricated
    );
    const citationEligibleSources = reports.filter(
      (report): report is CitationEligibleSource => report.citationEligible
    );
    const rejectedSources = reports.filter(report => report.identityStatus === 'rejected');
    const unverifiedSources = reports.filter(report => report.identityStatus === 'unverified');

    return {
      verifiedSources,
      citationEligibleSources,
      rejectedSources,
      unverifiedSources,
      allReports: reports,
      rejectedSourcesCount: rejectedSources.length
    };
  }
}

export const sourceVerificationService = new SourceVerificationService();
