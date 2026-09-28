import { GoogleGenAI } from '@google/genai';
import { resolveDoi } from '../../helpers/extended-academic-tools';

export type TrustLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SourceVerificationReport {
  sourceId: string;
  sourceTitle: string;
  author: string;
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
    await Promise.all(
      uniqueSources
        .filter(source => Boolean(source.doi?.trim()))
        .slice(0, 20)
        .map(async source => {
          const doi = normalizeDoi(source.doi);
          try {
            const resolved = await resolveDoi(doi);
            externallyResolved.set(doi, resolved);
          } catch {
            // No external proof: remain unverified.
          }
        })
    );

    const reports = uniqueSources.map((source): SourceVerificationReport => {
      const inputDoi = normalizeDoi(source.doi);
      const external = inputDoi ? externallyResolved.get(inputDoi) : undefined;

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
