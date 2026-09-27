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
      sources.map(async source => ({
        source,
        doiResult: source.doi ? await resolveDoi(source.doi) : null,
        isbnResult: source.isbn ? await lookupIsbn(source.isbn) : null
      }))
    );

    const externallyVerifiedSources = externalChecks.filter(check =>
      Boolean(check.doiResult || check.isbnResult)
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
        const externallyVerified = Boolean(external.doiResult || external.isbnResult);

        report.existenceVerified = externallyVerified;
        if (!externallyVerified) {
          report.integrityScore = Math.min(report.integrityScore || 0, 29);
          report.metadataAccuracy = Math.min(report.metadataAccuracy || 0, 29);
          report.peerReviewed = false;
          report.trustLevel = 'D';
          report.rejectedAsFabricated = false;
          report.rejectionReasonKurdish = 'بوونی سەرچاوەکە بە registry ـی دەرەکی پشتڕاست نەکراوەتەوە.';
          report.kurdishVerificationDetails = 'سەرچاوەکە نەسەلمێنراوە؛ ئەنجامی LLM بە تەنیا بۆ پشتڕاستکردنەوە بەکارنەهێنرا.';
        } else if (report.trustLevel === 'F' || report.integrityScore < 30) {
          report.rejectedAsFabricated = true;
          report.rejectionReasonKurdish = 'سەرچاوەکە لە پشکنینی ئەمانەتی زانستی ڕەتکرایەوە.';
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
        rejectedSourcesCount: verifiedSources.filter(s => s.rejectedAsFabricated).length
      };
    }
  }
}

export const sourceVerificationService = new SourceVerificationService();
