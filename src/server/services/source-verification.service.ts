import { GoogleGenAI } from '@google/genai';
import { resolveDoi } from '../../helpers/extended-academic-tools';

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
    sources: Array<{ title: string; author?: string; year?: string; doi?: string; publisher?: string }>,
    getGeminiClient: () => GoogleGenAI
  ): Promise<{ verifiedSources: SourceVerificationReport[]; rejectedSourcesCount: number }> {
    const ai = getGeminiClient();

    const externallyResolved = new Map<string, Awaited<ReturnType<typeof resolveDoi>>>();
    await Promise.all(
      sources
        .filter((source) => Boolean(source.doi?.trim()))
        .slice(0, 20)
        .map(async (source) => {
          try {
            const doi = source.doi!.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
            const resolved = await resolveDoi(doi);
            externallyResolved.set(doi.toLowerCase(), resolved);
          } catch {
            // A failed external lookup must never be treated as verification.
          }
        })
    );

    const prompt = `تۆ پسپۆڕی پشکنین و هەڵسەنگاندنی ڕەسەنایەتی سەرچاوە زانستییەکانی لە پلاتفۆرمی ئەکادیمیی مام.
ئەم سەرچاوانەی خوارەوە لە ڕووی ڕاستیی بونیاد، DOI/ISBN، خاوەندارێتی، بڵاوکراوە و هاوتایی هاوڕێیان (Peer-review) بپشکنە:

سەرچاوەکان:
${JSON.stringify(sources)}

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
      const reports: SourceVerificationReport[] = Array.isArray(parsed.reports) ? parsed.reports : [];

      const verifiedSources = reports.map((report) => {
        const doiKey = (report.doiOrIsbn || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
        const external = doiKey ? externallyResolved.get(doiKey) : undefined;

        if (external) {
          const normalizedTitle = report.sourceTitle.trim().toLowerCase();
          const externalTitle = external.title.trim().toLowerCase();
          const titleMatches = normalizedTitle === externalTitle ||
            normalizedTitle.includes(externalTitle) ||
            externalTitle.includes(normalizedTitle);

          report.existenceVerified = true;
          report.metadataAccuracy = titleMatches ? Math.max(report.metadataAccuracy || 0, 95) : Math.min(report.metadataAccuracy || 0, 60);
          if (!titleMatches) {
            report.rejectedAsFabricated = true;
            report.trustLevel = 'F';
            report.integrityScore = 0;
            report.rejectionReasonKurdish = 'ناوی سەرچاوە لەگەڵ تۆماری DOI لە Crossref هاوتا نییە؛ بۆیە سەرچاوەکە ڕەتکرایەوە.';
          }
        } else {
          // LLM-only verification is insufficient for citation eligibility.
          report.existenceVerified = false;
          report.trustLevel = 'D';
          report.integrityScore = Math.min(report.integrityScore || 0, 20);
          report.rejectedAsFabricated = false;
          report.peerReviewed = false;
          report.rejectionReasonKurdish = 'پشکنینی ڕەسەنایەتی لە سەرچاوەی دەرەکییەوە نەسەلمێنراوە؛ ئەم تۆمارە نابێت Verified Citation بێت.';
        }

        if (report.trustLevel === 'F' || report.integrityScore < 30) {
          report.rejectedAsFabricated = true;
          if (!report.rejectionReasonKurdish) {
            report.rejectionReasonKurdish = 'سەرچاوەکە وەک سەرچاوەی هەڵبەستراو یان بێ بەڵگە ڕەتکرایەوە.';
          }
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
      // Verification failure must never turn an unverified source into a trusted citation.
      return {
        verifiedSources: sources.map(s => ({
          sourceTitle: s.title,
          author: s.author || 'نادیار',
          publisher: s.publisher || 'نادیار',
          doiOrIsbn: s.doi || '',
          integrityScore: 0,
          trustLevel: 'D' as const,
          existenceVerified: false,
          metadataAccuracy: 0,
          peerReviewed: false,
          rejectedAsFabricated: false,
          kurdishVerificationDetails: 'پشکنینی سەرچاوەکە نەکرا؛ بۆیە سەرچاوەکە Verified دانانرێت و نابێت وەک Citation بەکاربهێنرێت.'
        })),
        rejectedSourcesCount: 0
      };
    }
  }
}

export const sourceVerificationService = new SourceVerificationService();
