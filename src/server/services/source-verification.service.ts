import { GoogleGenAI } from '@google/genai';
import { robustParseJson } from '../utils/json-repair';

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

interface SourceInput {
  title: string;
  author?: string;
  year?: string;
  doi?: string;
  isbn?: string;
  publisher?: string;
}

interface RegistryMatch {
  verified: boolean;
  titleScore: number;
  authorMatched: boolean;
  yearMatched: boolean;
  canonicalTitle?: string;
  canonicalAuthor?: string;
  doi?: string;
  detail: string;
}

function normalize(value: string | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function titleSimilarity(left: string, right: string): number {
  const a = new Set(normalize(left).split(/\s+/).filter(Boolean));
  const b = new Set(normalize(right).split(/\s+/).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function authorMatches(input: string | undefined, registry: any): boolean {
  const wanted = normalize(input);
  if (!wanted) return true;
  const authors = Array.isArray(registry?.author)
    ? registry.author
        .map((a: any) => normalize([a?.given, a?.family].filter(Boolean).join(' ')))
        .join(' ')
    : '';
  return !!authors && (authors.includes(wanted) || wanted.split(/\s+/).some(part => part.length > 2 && authors.includes(part)));
}

async function verifyAgainstCrossref(source: SourceInput): Promise<RegistryMatch> {
  const title = normalize(source.title);
  if (!title) {
    return { verified: false, titleScore: 0, authorMatched: false, yearMatched: false, detail: 'ناونیشان بەتاڵە.' };
  }

  try {
    const doi = (source.doi || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    let message: any;

    if (doi) {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' }
      });
      if (!response.ok) {
        return { verified: false, titleScore: 0, authorMatched: false, yearMatched: false, detail: `Crossref DOI response ${response.status}.` };
      }
      const body = await response.json() as any;
      message = body?.message;
      const canonicalTitle = Array.isArray(message?.title) ? message.title[0] : '';
      const titleScore = titleSimilarity(source.title, canonicalTitle);
      const authorMatched = authorMatches(source.author, message);
      const registryYear = Number(
        message?.published?.['date-parts']?.[0]?.[0] ||
        message?.issued?.['date-parts']?.[0]?.[0]
      );
      const inputYear = Number(source.year);
      const yearMatched = !inputYear || !registryYear || Math.abs(inputYear - registryYear) <= 1;
      const verified = !!message && titleScore >= 0.75 && authorMatched && yearMatched;
      return {
        verified,
        titleScore,
        authorMatched,
        yearMatched,
        canonicalTitle,
        canonicalAuthor: Array.isArray(message?.author)
          ? message.author.map((a: any) => [a?.given, a?.family].filter(Boolean).join(' ')).filter(Boolean).join(', ')
          : '',
        doi: message?.DOI || doi,
        detail: verified
          ? 'DOI و metadata لە Crossref هاوتا بوون.'
          : 'DOI هەبوو، بەڵام metadata ـی سەرچاوەکە بە تەواوی نەگونجا.'
      };
    }

    const query = encodeURIComponent([source.title, source.author, source.publisher].filter(Boolean).join(' '));
    const response = await fetch(`https://api.crossref.org/works?query.bibliographic=${query}&rows=5`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' }
    });
    if (!response.ok) {
      return { verified: false, titleScore: 0, authorMatched: false, yearMatched: false, detail: `Crossref search response ${response.status}.` };
    }

    const body = await response.json() as any;
    const items = Array.isArray(body?.message?.items) ? body.message.items : [];
    let best: any = null;
    let bestScore = 0;

    for (const item of items) {
      const canonicalTitle = Array.isArray(item?.title) ? item.title[0] : '';
      const score = titleSimilarity(source.title, canonicalTitle);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (!best) {
      return { verified: false, titleScore: 0, authorMatched: false, yearMatched: false, detail: 'هیچ هاوتایەکی باوەڕپێکراو لە Crossref نەدۆزرایەوە.' };
    }

    const canonicalTitle = Array.isArray(best?.title) ? best.title[0] : '';
    const authorMatched = authorMatches(source.author, best);
    const registryYear = Number(best?.published?.['date-parts']?.[0]?.[0] || best?.issued?.['date-parts']?.[0]?.[0]);
    const inputYear = Number(source.year);
    const yearMatched = !inputYear || !registryYear || Math.abs(inputYear - registryYear) <= 1;
    const verified = bestScore >= 0.82 && authorMatched && yearMatched;

    return {
      verified,
      titleScore: bestScore,
      authorMatched,
      yearMatched,
      canonicalTitle,
      canonicalAuthor: Array.isArray(best?.author)
        ? best.author.map((a: any) => [a?.given, a?.family].filter(Boolean).join(' ')).filter(Boolean).join(', ')
        : '',
      doi: best?.DOI || '',
      detail: verified
        ? 'ناونیشان، نووسەر و ساڵ لە Crossref هاوتا بوون.'
        : 'نزیکترین ئەنجام لە Crossref دۆزرایەوە، بەڵام هاوتاییەکە بە قەدری پێویست نییە.'
    };
  } catch (error) {
    console.warn('Crossref source verification failed:', error);
    return {
      verified: false,
      titleScore: 0,
      authorMatched: false,
      yearMatched: false,
      detail: 'پشکنینی Crossref بەهۆی کێشەی network سەرکەوتوو نەبوو.'
    };
  }
}

function buildUnverifiedReport(source: SourceInput, detail: string): SourceVerificationReport {
  return {
    sourceTitle: source.title,
    author: source.author || 'نادیار',
    publisher: source.publisher || '',
    doiOrIsbn: source.doi || source.isbn || '',
    integrityScore: 0,
    trustLevel: 'D',
    existenceVerified: false,
    metadataAccuracy: 0,
    peerReviewed: false,
    rejectedAsFabricated: false,
    rejectionReasonKurdish: 'سەرچاوەکە پشتڕاست نەکراوەتەوە؛ نابێت وەک سەرچاوەی دڵنیابەخش بەکاربهێنرێت.',
    kurdishVerificationDetails: detail
  };
}

export class SourceVerificationService {
  public async verifySources(
    sources: SourceInput[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<{ verifiedSources: SourceVerificationReport[]; rejectedSourcesCount: number }> {
    if (!Array.isArray(sources) || sources.length === 0) {
      return { verifiedSources: [], rejectedSourcesCount: 0 };
    }

    const registryMatches = await Promise.all(
      sources.map(source => verifyAgainstCrossref(source))
    );

    let aiReports: SourceVerificationReport[] = [];
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `ئەم سەرچاوانە تەنها لە ڕووی metadata ـی ناوخۆیی شیکاربکە. نابێت بە خۆت بڵێیت سەرچاوەکە هەیە مەگەر بەڵگەی registry هەبێت.
سەرچاوەکان:
${JSON.stringify(sources)}

بۆ هەر سەرچاوەیەک JSON ـێک بدە:
{
  "reports": [
    {
      "sourceTitle": "ناوی سەرچاوە",
      "author": "نووسەر",
      "publisher": "بڵاوکار",
      "metadataAccuracy": 0,
      "peerReviewed": false
    }
  ]
}`,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      });
      const parsed = robustParseJson(response.text || '{}') as any;
      aiReports = Array.isArray(parsed?.reports) ? parsed.reports : [];
    } catch {
      aiReports = [];
    }

    const verifiedSources: SourceVerificationReport[] = [];
    let rejectedSourcesCount = 0;

    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      const match = registryMatches[index];
      const ai = aiReports.find(
        report => normalize(report?.sourceTitle) === normalize(source.title)
      );

      if (!match.verified) {
        if (ai?.rejectedAsFabricated === true || ai?.trustLevel === 'F') {
          rejectedSourcesCount += 1;
        }
        continue;
      }

      const integrityScore = Math.round(
        Math.min(
          100,
          70 +
          match.titleScore * 20 +
          (match.authorMatched ? 7 : 0) +
          (match.yearMatched ? 3 : 0)
        )
      );

      verifiedSources.push({
        sourceTitle: source.title,
        author: source.author || match.canonicalAuthor || 'نادیار',
        publisher: source.publisher || '',
        doiOrIsbn: source.doi || source.isbn || match.doi || '',
        integrityScore,
        trustLevel: 'B',
        existenceVerified: true,
        metadataAccuracy: Math.round(match.titleScore * 100),
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: match.detail +
          ' تێبینی: Crossref بوونی metadata پشتڕاست دەکات، بەڵام بە تەنیا خۆی peer-review یان کوالیتی زانستی نادەسەلمێنێت.'
      });
    }

    return {
      verifiedSources,
      rejectedSourcesCount
    };
  }
}

export const sourceVerificationService = new SourceVerificationService();
