import { GoogleGenAI } from '@google/genai';
import { resolveDoi } from '../../helpers/extended-academic-tools';

export type TrustLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SourceVerificationReport {
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
  title: string;
  author?: string;
  year?: string;
  doi?: string;
  publisher?: string;
};

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
  ): Promise<{ verifiedSources: SourceVerificationReport[]; rejectedSourcesCount: number }> {
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

      if (external) {
        const matches = titleSimilarity(source.title, external.title) >= 0.72;
        if (!matches) {
          return {
            sourceTitle: source.title,
            author: source.author || 'نادیار',
            publisher: source.publisher || 'نادیار',
            doiOrIsbn: source.doi || '',
            integrityScore: 0,
            trustLevel: 'F',
            existenceVerified: true,
            metadataAccuracy: 0,
            peerReviewed: false,
            rejectedAsFabricated: true,
            rejectionReasonKurdish: 'ناونیشانی سەرچاوە لەگەڵ تۆماری DOI لە Crossref هاوتا نییە؛ تۆمارەکە بۆ Citation ڕەتکرایەوە.',
            kurdishVerificationDetails: 'DOI بە شێوەی دەرەکی دۆزرایەوە، بەڵام ناسنامەی سەرچاوەکە لەگەڵ metadata ـی Crossref ناگونجێت.'
          };
        }

        return {
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

    return {
      verifiedSources: reports,
      rejectedSourcesCount: reports.filter(report => report.rejectedAsFabricated).length
    };
  }
}

export const sourceVerificationService = new SourceVerificationService();
