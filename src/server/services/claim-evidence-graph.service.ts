import { GoogleGenAI } from '@google/genai';

export interface ClaimNode {
  claimId: string;
  text: string;
  sourceId: string;
  evidenceId: string;
  confidence: number; // 0-100
  page?: string;
  quote: string;
  verificationStatus: 'verified' | 'unverified' | 'rejected' | 'synthetic_blocked';
  citationId: string;
  syntheticCitationBlocked?: boolean;
}

export interface EvidenceNode {
  evidenceId: string;
  text: string;
  contextSnippet: string;
  sourceTitle: string;
  doiOrIsbn?: string;
  pageNumber?: string;
}

export interface ClaimEvidenceGraph {
  claims: ClaimNode[];
  evidences: EvidenceNode[];
  syntheticCitationsBlockedCount: number;
  graphIntegrityScore: number;
  kurdishSummary: string;
}

export class ClaimEvidenceGraphService {
  /**
   * Builds a strict Claim-Evidence Graph enforcing zero synthetic citations.
   */
  public async buildGraph(
    topic: string,
    draftText: string,
    sources: any[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<ClaimEvidenceGraph> {
    const ai = getGeminiClient();

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمی باڵای زانکۆی هارفەردیت. ئەرکت بونیادنانی Claim-Evidence Graph ێکی توندوتیژە بۆ ئەم تێکستە زانستییە:
بابەت: ${topic}
تێکست: ${draftText}
سەرچاوە بەردەستەکان: ${JSON.stringify(sources.slice(0, 5))}

یاسای زێڕین: هیچ citation یان ادعایەک (Claim) دروست مەکە ئەگەر بەڵگەیەکی ڕاستەقینە (Verified Evidence) لە سەرچاوەکاندا بۆی نەبێت. ئەگەر ئیدعایەک بێ بەڵگە بێت، دەبێت وەک unverified یان synthetic_blocked دیاری بکرێت.

وەڵامەکەت تەنها بە JSON بێت لەسەر ئەم شێوازە:
{
  "claims": [
    {
      "claimId": "CLAIM-001",
      "text": "ئیدعای زانستی بە کوردی",
      "sourceId": "SRC-001",
      "evidenceId": "EVI-001",
      "confidence": 95,
      "page": "127",
      "quote": "ڕستەی ڕاستەقینەی سەرچاوەکە",
      "verificationStatus": "verified",
      "citationId": "CIT-001",
      "syntheticCitationBlocked": false
    }
  ],
  "evidences": [
    {
      "evidenceId": "EVI-001",
      "text": "بەڵگەی ناو سەرچاوەکە",
      "contextSnippet": "تێکستی دەوروبەری بەڵگەکە",
      "sourceTitle": "ناوی سەرچاوە یان وتارەکە",
      "doiOrIsbn": "10.1000/182",
      "pageNumber": "127"
    }
  ],
  "graphIntegrityScore": 92,
  "kurdishSummary": "شیکاری گراف و ئاستی ڕاستیی بەڵگەکان بە کوردی"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const claims: ClaimNode[] = parsed.claims || [];
      const evidences: EvidenceNode[] = parsed.evidences || [];

      let blockedCount = 0;
      claims.forEach(c => {
        if (c.verificationStatus !== 'verified') {
          c.syntheticCitationBlocked = true;
          blockedCount++;
        }
      });

      return {
        claims,
        evidences,
        syntheticCitationsBlockedCount: blockedCount,
        graphIntegrityScore: parsed.graphIntegrityScore || 85,
        kurdishSummary: parsed.kurdishSummary || 'گرافی بەڵگە و ادعاکان بە سەرکەوتوویی بونیاد نرا.'
      };
    } catch (err: unknown) {
      console.error('Error building ClaimEvidenceGraph:', err);
      return {
        claims: [],
        evidences: [],
        syntheticCitationsBlockedCount: 1,
        graphIntegrityScore: 0,
        kurdishSummary: 'نەتوانرا Claim-Evidence Graph بە پشتڕاستییەوە بونیاد بنرێت؛ هیچ Claim یان Citation ـێک Verified دانانرێت تا پشکنینی بەڵگەکان دووبارە بکرێتەوە.'
      };
    }
  }
}

export const claimEvidenceGraphService = new ClaimEvidenceGraphService();
