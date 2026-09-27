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
    const groundedSources = (Array.isArray(sources) ? sources : []).filter(
      (source: any) =>
        typeof source?.content === 'string' && source.content.trim().length > 0
    );

    // Source metadata alone cannot prove a quotation or evidence. Fail closed
    // instead of allowing the language model to invent evidence text.
    if (groundedSources.length === 0) {
      return {
        claims: [],
        evidences: [],
        syntheticCitationsBlockedCount: 0,
        graphIntegrityScore: 0,
        kurdishSummary: 'هیچ بەڵگەی دەقیی پشتڕاستکراوە بۆ بونیادنانەوەی Claim-Evidence Graph بەردەست نییە.'
      };
    }

    const ai = getGeminiClient();

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمی باڵای زانکۆی هارفەردیت. ئەرکت بونیادنانی Claim-Evidence Graph ێکی توندوتیژە بۆ ئەم تێکستە زانستییە:
بابەت: ${topic}
تێکست: ${draftText}
سەرچاوە و بەڵگەی دەقیی پشتڕاستکراوە:
${JSON.stringify(groundedSources.slice(0, 5))}

گرنگ: quote و evidence تەنها دەبێت لە ناو content ـی سەرچاوەکانی سەرەوە وەربگیرێت؛ هیچ دەقێکی نوێ یان خەیاڵی دروست مەکە.

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
      const parsedEvidences: EvidenceNode[] = Array.isArray(parsed?.evidences) ? parsed.evidences : [];
      const allowedTitles = new Set(
        groundedSources.map((source: any) => String(source.title || '').trim())
      );

      const evidences = parsedEvidences.filter(evidence =>
        allowedTitles.has(String(evidence?.sourceTitle || '').trim())
      );

      const evidenceById = new Set(evidences.map(evidence => evidence.evidenceId));
      let blockedCount = 0;

      const claims: ClaimNode[] = (Array.isArray(parsed?.claims) ? parsed.claims : []).filter((claim: ClaimNode) => {
        const allowed = evidenceById.has(claim.evidenceId) && claim.verificationStatus === 'verified';
        if (!allowed) {
          blockedCount++;
          return false;
        }
        return true;
      });

      return {
        claims,
        evidences,
        syntheticCitationsBlockedCount: blockedCount,
        graphIntegrityScore: claims.length > 0 ? Math.min(100, Number(parsed.graphIntegrityScore) || 0) : 0,
        kurdishSummary: claims.length > 0
          ? (parsed.kurdishSummary || 'گرافی بەڵگە و ادعاکان بونیاد نرا.')
          : 'هیچ Claim ـێکی پشتڕاستکراو بە بەڵگەی دەقییەوە نەدۆزرایەوە.'
      };
    } catch (err: any) {
      console.error('Error building ClaimEvidenceGraph:', err);
      return {
        claims: [],
        evidences: [],
        syntheticCitationsBlockedCount: 0,
        graphIntegrityScore: 0,
        kurdishSummary: 'پشکنینی بەڵگەکان بەهۆی هەڵەی سێرڤەرەوە تەواو نەبوو؛ هیچ Claim ـێک پشتڕاستکراو نەنرا.'
      };
    }
  }
}

export const claimEvidenceGraphService = new ClaimEvidenceGraphService();
