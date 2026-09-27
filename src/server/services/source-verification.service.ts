import { GoogleGenAI } from '@google/genai';
import { lookupIsbn, resolveDoi } from '../../helpers/extended-academic-tools.js';

export type TrustLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SourceVerificationReport {
  sourceTitle: string;
  author: string;
  publisher: string;
  doiOrIsbn?: string;
  integrityScore: number; // 0 - 100
  trustLevel: TrustLevel;
  existenceVerified: boolean;
  metadataAccuracy: number;
  peerReviewed: boolean;
  rejectedAsFabricated: boolean;
  rejectionReasonKurdish?: string;
  kurdishVerificationDetails: string;
}

export class SourceVerificationService {

  private normalizeText(value?: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private metadataMatches(
    source: { title: string; author?: string },
    external: { title?: string; authors?: string[] }
  ): boolean {
    const sourceTitle = this.normalizeText(source.title);
    const externalTitle = this.normalizeText(external.title);
    if (!sourceTitle || !externalTitle) return false;

    const sourceTerms = new Set(sourceTitle.split(' ').filter(term => term.length > 1));
    const externalTerms = new Set(externalTitle.split(' ').filter(term => term.length > 1));
    const overlap = [...sourceTerms].filter(term => externalTerms.has(term)).length;
    const titleCoverage = overlap / Math.max(sourceTerms.size, 1);
    if (titleCoverage < 0.8) return false;

    const sourceAuthor = this.normalizeText(source.author);
    if (!sourceAuthor) return true;

    const externalAuthors = (external.authors || []).map(author => this.normalizeText(author)).filter(Boolean);
    return externalAuthors.some(author => {
      const sourceAuthorTerms = new Set(sourceAuthor.split(' ').filter(term => term.length > 1));
      const externalAuthorTerms = new Set(author.split(' ').filter(term => term.length > 1));
      const authorOverlap = [...sourceAuthorTerms].filter(term => externalAuthorTerms.has(term)).length;
      return authorOverlap / Math.max(sourceAuthorTerms.size, 1) >= 0.5;
    });
  }

  /**
   * Verifies academic sources, computes integrity scores, assigns Trust Levels (A+ to F),
   * and automatically filters out fabricated/F sources.
   */
  public async verifySources(
    sources: Array<{ title: string; author?: string; year?: string; doi?: string; isbn?: string; publisher?: string }>,
    getGeminiClient: () => GoogleGenAI
  ): Promise<{ verifiedSources: SourceVerificationReport[]; rejectedSourcesCount: number }> {
    const ai = getGeminiClient();

    const externalChecks = await Promise.all(
      sources.map(async source => {
        const [doiResult, isbnResult] = await Promise.all([
          source.doi
            ? resolveDoi(source.doi).catch(() => null)
            : Promise.resolve(null),
          source.isbn
            ? lookupIsbn(source.isbn).catch(() => null)
            : Promise.resolve(null)
        ]);

        return { source, doiResult, isbnResult };
      })
    );

    const prompt = `تۆ پسپۆڕی پشکنین و هەڵسەنگاندنی ڕەسەنایەتی سەرچاوە زانستییەکانی لە پلاتفۆرمی ئەکادیمیی مام.
ئەم سەرچاوانەی خوارەوە لە ڕووی ڕاستیی بونیاد، DOI/ISBN، خاوەندارێتی، بڵاوکراوە و هاوتایی هاوڕێیان (Peer-review) بپشکنە:

سەرچاوەکان:
${JSON.stringify(sources.map((source, index) => ({ ...source, externalVerification: externalChecks[index] })))}

دیاریبکە کە ئایا سەرچاوەکە هەیە، یان دروستکراوی دەستکردە (Fabricated/F).
پلەکانی بڕواپێکراوی (Trust Level):
- A+: سەرچاوەی بنەڕەتی باڵا (Primary Authoritative)
- A: گۆڤار و کتێبی ڕەخنەدراوی زانستی (Peer-reviewed)
- B: سەرچاوەی لاوەکی زانستی (Academic Secondary)
- C: گوتاری گشتی ئەکادیمی (General Scholarly)
- D: نەسەلمێنراو (Unverified)
- F: هەڵبەستراو یان گوماناوی (Suspicious / Fabricated) - ئەمە دەبێت ڕەت بکرێتەوە.

وەڵامەکەت بە تەنها JSON بێت بەم شێوازە:
{
  "reports": [
    {
      "sourceTitle": "ناوی سەرچاوە",
      "author": "نووسەر",
      "publisher": "بڵاوکار",
      "doiOrIsbn": "10.xxxx/xxxx",
      "integrityScore": 94,
      "trustLevel": "A",
      "existenceVerified": true,
      "metadataAccuracy": 95,
      "peerReviewed": true,
      "rejectedAsFabricated": false,
      "rejectionReasonKurdish": "",
      "kurdishVerificationDetails": "پشکنینی سەرچاوەکە بە سەرکەوتوویی ڕێپێدراو درا."
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const reports: SourceVerificationReport[] = parsed.reports || [];

      const verifiedSources = sources.map((source, index) => {
        const report = reports[index] || {
          sourceTitle: source.title,
          author: source.author || 'نادیار',
          publisher: source.publisher || 'نادیار',
          doiOrIsbn: source.doi || source.isbn || '',
          integrityScore: 0,
          trustLevel: 'D' as TrustLevel,
          existenceVerified: false,
          metadataAccuracy: 0,
          peerReviewed: false,
          rejectedAsFabricated: false,
          kurdishVerificationDetails: 'هیچ ڕاپۆرتێکی پەسەندکراوی پشتڕاستکردنەوە بەردەست نییە.'
        };

        const external = externalChecks[index];
        const externalRecord = external.doiResult || external.isbnResult;
        const metadata = external.doiResult
          ? { title: external.doiResult.title, authors: external.doiResult.authors }
          : external.isbnResult
            ? { title: external.isbnResult.title, authors: external.isbnResult.authors }
            : null;

        const externallyVerified = Boolean(externalRecord && metadata && this.metadataMatches(source, metadata));
        report.existenceVerified = externallyVerified;

        if (externallyVerified) {
          report.sourceTitle = external.doiResult?.title || external.isbnResult?.title || source.title;
          report.author = external.doiResult?.authors?.[0] || external.isbnResult?.authors?.[0] || source.author || 'نادیار';
          report.publisher = external.doiResult?.publisher || external.isbnResult?.publisher || source.publisher || 'نادیار';
          report.metadataAccuracy = Math.max(report.metadataAccuracy || 0, 85);
          // Peer review is not inferred from DOI/ISBN existence alone.
          report.peerReviewed = false;
          if (report.trustLevel === 'F' || report.integrityScore < 30) {
            report.rejectedAsFabricated = true;
            report.rejectionReasonKurdish = 'سەرچاوەکە لە هەڵسەنگاندنی ئەمانەتی زانستی ڕەتکرایەوە.';
          }
        } else {
          report.integrityScore = Math.min(report.integrityScore || 0, 29);
          report.metadataAccuracy = 0;
          report.peerReviewed = false;
          report.trustLevel = 'D';
          report.rejectedAsFabricated = false;
          report.rejectionReasonKurdish = 'ناونیشان یان نووسەر لە registry ـی دەرەکی لەگەڵ زانیاریی سەرچاوەکە هاوتا نەبوو، یان سەرچاوەکە نەدۆزرایەوە.';
          report.kurdishVerificationDetails = 'سەرچاوەکە تەنها کاتێک پشتڕاست دەکرێتەوە کە metadata ـی دابینکراو لەگەڵ registry ـی پەیوەندیدار هاوتا بێت.';
        }

        return report;
      });

      const rejectedCount = verifiedSources.filter(s => s.rejectedAsFabricated).length;

      return {
        verifiedSources,
        rejectedSourcesCount: rejectedCount
      };
    } catch (err: any) {
      console.error('Error in SourceVerificationService:', err);
      return {
        verifiedSources: sources.map(s => ({
          sourceTitle: s.title,
          author: s.author || 'نادیار',
          publisher: s.publisher || 'نادیار',
          doiOrIsbn: s.doi || '',
          integrityScore: 0,
          trustLevel: 'D' as TrustLevel,
          existenceVerified: false,
          metadataAccuracy: 0,
          peerReviewed: false,
          rejectedAsFabricated: false,
          rejectionReasonKurdish: 'پشتڕاستکردنەوەی سەرچاوەکە بەهۆی نەگەیشتن بە خزمەتگوزاریی پشتڕاستکردنەوە نەکرا.',
          kurdishVerificationDetails: 'سەرچاوەکە نەسەلمێنراوە؛ هیچ داتایەکی پشتڕاستکراو لەم fallback ـەدا پەسەند ناکرێت.'
        })),
        rejectedSourcesCount: 0
      };
    }
  }
}

export const sourceVerificationService = new SourceVerificationService();
