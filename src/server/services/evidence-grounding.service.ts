import { GoogleGenAI } from '@google/genai';
import { claimEvidenceGraphService } from './claim-evidence-graph.service';

export interface GroundedClaim {
  claimId: string;
  sentenceText: string;
  sourceId?: string;
  evidenceId?: string;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  citationEligible: boolean;
  citationText?: string;
  confidence: number;
  gapDetected: boolean;
  warning?: string;
}

export interface GroundedParagraph {
  paragraphIndex: number;
  text: string;
  claims: GroundedClaim[];
}

export interface GroundedGenerationResult {
  paragraphs: GroundedParagraph[];
  verifiedCitations: Array<{
    citationId: string;
    sourceId: string;
    inTextCitation: string;
    evidenceQuote: string;
    verified: boolean;
  }>;
  evidenceGaps: Array<{
    claimId: string;
    claimText: string;
    warning: string;
  }>;
  integrityMetrics: {
    totalClaims: number;
    verifiedClaims: number;
    citationEligibleClaims: number;
    blockedSyntheticCitations: number;
    evidenceCoveragePercentage: number;
    eligibilityGateStatus: 'PASS' | 'WARN_GAPS' | 'FAIL';
  };
  kurdishSummary: string;
}

export class EvidenceGroundingService {
  /**
   * Citation Eligibility Gate
   * Enforces that ONLY VERIFIED sources with actual evidence chunks are eligible for citations.
   */
  public evaluateCitationEligibility(sourceStatus: string, hasEvidence: boolean): { eligible: boolean; status: 'verified' | 'partially_verified' | 'unverified' } {
    const normalized = (sourceStatus || '').toLowerCase();
    if (normalized === 'verified' && hasEvidence) {
      return { eligible: true, status: 'verified' };
    }
    if (normalized === 'partially_verified') {
      return { eligible: false, status: 'partially_verified' };
    }
    return { eligible: false, status: 'unverified' };
  }

  /**
   * Generates academic text strictly grounded in verified evidence sources.
   */
  public async generateGroundedContent(
    topic: string,
    promptText: string,
    verifiedEvidenceChunks: Array<{
      sourceId: string;
      sourceTitle: string;
      chunkText: string;
      verificationStatus: 'verified' | 'partially_verified' | 'unverified';
      pageNumber?: string;
      author?: string;
      year?: string;
    }>,
    getGeminiClient: () => GoogleGenAI
  ): Promise<GroundedGenerationResult> {
    const ai = getGeminiClient();

    // Only verified chunks with real text may reach the model.
    const eligibleChunks = verifiedEvidenceChunks.filter(chunk => {
      const gate = this.evaluateCitationEligibility(chunk.verificationStatus, !!chunk.chunkText?.trim());
      return gate.eligible && !!chunk.sourceId && !!chunk.sourceTitle;
    });

    if (eligibleChunks.length === 0) {
      return this.createFallbackGroundedResult(topic, []);
    }

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمی باڵای زانکۆی هارفەردیت و بەرپرسی بزوێنەری Evidence Intelligence یت.
ئەرکی تۆ: دروستکردنی دەقێکی زانستیی فەرمی بە کوردی بۆ:
تەوەرە: ${topic}
داواکاری: ${promptText}

بەڵگە بڕواپێکراوەکان (VERIFIED EVIDENCE):
${JSON.stringify(eligibleChunks, null, 2)}

یاسای نەگۆڕی Citation Eligibility Gate:
1. تەنها ئەو ادعانەی (Claims) کە بەڵگەی سەلمێنراوی VERIFIED یان لە لیستەکەدا هەیە مافی Citationیان هەیە.
2. بۆ هەر ئیدعایەک کە بەڵگەی سەلمێنراوی نییە، gapDetected: true دیاری بکە و ئاگاداری "Evidence required" بنووسە.
3. بە هیچ شێوەیەک سەرچاوە، ساڵ، یان نووسەری دروستکراو (Synthetic/Fake Citation) لە خۆتەوە بەرهەم مەهێنە.

وەڵامەکەت تەنها بە یەک ئۆبجێکتی ڕێکی JSON بێت لەسەر ئەم ساختارە:
{
  "paragraphs": [
    {
      "paragraphIndex": 1,
      "text": "دەقی پاراگرافەکە بە کوردی لەگەڵ کۆدی (سەرچاوە، ساڵ) تەنها بۆ سەرچاوە بڕواپێکراوەکان",
      "claims": [
        {
          "claimId": "CLM-001",
          "sentenceText": "ڕستەی ئیدعاکە",
          "sourceId": "SRC-001",
          "evidenceId": "EVI-001",
          "verificationStatus": "verified",
          "citationEligible": true,
          "citationText": "(نووسەر، ساڵ)",
          "confidence": 95,
          "gapDetected": false
        }
      ]
    }
  ],
  "verifiedCitations": [
    {
      "citationId": "CIT-001",
      "sourceId": "SRC-001",
      "inTextCitation": "(نووسەر، ساڵ)",
      "evidenceQuote": "دەقی بەڵگەکە لە سەرچاوەکەدا",
      "verified": true
    }
  ],
  "evidenceGaps": [
    {
      "claimId": "CLM-GAP-001",
      "claimText": "ئیدعای بێ بەڵگە",
      "warning": "ئەم بانگەشەیە پێویستی بە بەڵگەی سەلمێنراوە (Evidence Required)"
    }
  ],
  "kurdishSummary": "پوختەی هەڵسەنگاندنی بەڵگەکان و ئاستی سەلماندنی زانستی"
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
      const paragraphs: GroundedParagraph[] = Array.isArray(parsed?.paragraphs) ? parsed.paragraphs : [];
      const evidenceGaps = Array.isArray(parsed?.evidenceGaps) ? parsed.evidenceGaps : [];

      const allowedEvidence = new Map(
        eligibleChunks.map(chunk => [chunk.sourceId + '::' + chunk.sourceTitle, chunk])
      );
      const evidenceIds = new Set(
        eligibleChunks.map((chunk, index) => chunk.sourceId + '::' + (chunk.pageNumber || index))
      );

      let totalClaims = 0;
      let verifiedClaims = 0;
      let eligibleClaims = 0;
      let blockedSynthetic = 0;

      paragraphs.forEach(paragraph => {
        paragraph.claims = Array.isArray(paragraph.claims) ? paragraph.claims : [];
        paragraph.claims.forEach(claim => {
          totalClaims++;
          const sourceMatch = eligibleChunks.find(chunk => chunk.sourceId === claim.sourceId);
          const sourceKey = sourceMatch
            ? sourceMatch.sourceId + '::' + sourceMatch.sourceTitle
            : '';
          const linkedSource = sourceKey ? allowedEvidence.get(sourceKey) : undefined;
          const hasEvidence = !!linkedSource && !!claim.evidenceId;
          const gate = this.evaluateCitationEligibility(claim.verificationStatus, hasEvidence);
          claim.citationEligible = gate.eligible;

          if (gate.eligible) {
            verifiedClaims++;
            eligibleClaims++;
          } else {
            claim.citationText = undefined;
            claim.gapDetected = true;
            claim.warning = 'Synthetic or unverified citation blocked by Citation Eligibility Gate';
            blockedSynthetic++;
          }
        });
      }

      const verifiedCitations = (Array.isArray(parsed?.verifiedCitations) ? parsed.verifiedCitations : [])
        .filter((citation: { verified: boolean; sourceId?: string; evidenceQuote?: string }) => {
          if (!citation.verified || !citation.sourceId || !citation.evidenceQuote?.trim()) return false;
          const sourceChunks = eligibleChunks.filter(chunk => chunk.sourceId === citation.sourceId);
          return sourceChunks.some(chunk =>
            chunk.chunkText.toLowerCase().includes(citation.evidenceQuote!.trim().toLowerCase())
          );
        });

      // Avoid carrying an AI-generated citation unless its evidence can be tied to input text.
      for (const paragraph of paragraphs) {
        paragraph.claims = paragraph.claims.filter(claim =>
          !claim.citationEligible || eligibleChunks.some(chunk =>
            chunk.sourceId === claim.sourceId &&
            !!claim.evidenceId &&
            chunk.chunkText.trim().length > 0
          )
        );
      }

      const coverageRatio = totalClaims > 0 ? Math.round((verifiedClaims / totalClaims) * 100) : 100;
      const status = coverageRatio >= 80 ? 'PASS' : coverageRatio >= 50 ? 'WARN_GAPS' : 'FAIL';

      // Sync with Claim-Evidence Graph
      await claimEvidenceGraphService.buildGraph(
        topic,
        paragraphs.map(p => p.text).join('\n\n'),
        eligibleChunks,
        getGeminiClient
      );

      return {
        paragraphs,
        verifiedCitations,
        evidenceGaps,
        integrityMetrics: {
          totalClaims,
          verifiedClaims,
          citationEligibleClaims: eligibleClaims,
          blockedSyntheticCitations: blockedSynthetic,
          evidenceCoveragePercentage: coverageRatio,
          eligibilityGateStatus: status
        },
        kurdishSummary: parsed.kurdishSummary || 'دەقی زانستی بە سەرکەوتوویی لەسەر بنەمای بەڵگە سەلمێنراوەکان دارێژرا.'
      };
    } catch (err: unknown) {
      console.error('EvidenceGroundingService Error:', err);
      return this.createFallbackGroundedResult(topic, verifiedEvidenceChunks);
    }
  }

  private createFallbackGroundedResult(
    topic: string,
    _evidenceChunks: Array<{
      sourceId: string;
      sourceTitle: string;
      chunkText: string;
      verificationStatus: 'verified' | 'partially_verified' | 'unverified';
      pageNumber?: string;
      author?: string;
      year?: string;
    }>
  ): GroundedGenerationResult {
    return {
      paragraphs: [],
      verifiedCitations: [],
      evidenceGaps: [
        {
          claimId: 'CLM-UNAVAILABLE-1',
          claimText: topic,
          warning: 'Evidence-based generation بەردەست نەبوو؛ هیچ citation یان دەقی ساختە بەرهەم نەهێنرا.'
        }
      ],
      integrityMetrics: {
        totalClaims: 0,
        verifiedClaims: 0,
        citationEligibleClaims: 0,
        blockedSyntheticCitations: 0,
        evidenceCoveragePercentage: 0,
        eligibilityGateStatus: 'FAIL'
      },
      kurdishSummary: 'دروستکردنی دەقی بنەماپێدراو سەرکەوتوو نەبوو؛ بۆ پاراستنی ئەمانەتی زانستی هیچ دۆزینەوە یان citation ـێکی ساختە نەنرا.'
    };
  }
}

export const evidenceGroundingService = new EvidenceGroundingService();
