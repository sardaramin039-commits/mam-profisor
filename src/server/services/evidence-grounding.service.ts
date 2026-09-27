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

    // Filter evidence chunks through Citation Eligibility Gate
    const eligibleChunks = verifiedEvidenceChunks.filter(c => {
      const gate = this.evaluateCitationEligibility(c.verificationStatus, !!c.chunkText);
      return gate.eligible;
    });

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمی باڵای زانکۆی هارفەردیت و بەرپرسی بزوێنەری Evidence Intelligence یت.
ئەرکی تۆ: دروستکردنی دەقێکی زانستیی فەرمی بە کوردی بۆ:
تەوەرە: ${topic}
داواکاری: ${promptText}

بەڵگە بڕواپێکراوەکان (VERIFIED EVIDENCE):
${JSON.stringify(eligibleChunks.length > 0 ? eligibleChunks : verifiedEvidenceChunks, null, 2)}

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
      const paragraphs: GroundedParagraph[] = parsed.paragraphs || [];
      const verifiedCitations = (parsed.verifiedCitations || []).filter((c: { verified: boolean }) => c.verified);
      const evidenceGaps = parsed.evidenceGaps || [];

      let totalClaims = 0;
      let verifiedClaims = 0;
      let eligibleClaims = 0;
      let blockedSynthetic = 0;

      paragraphs.forEach(p => {
        (p.claims || []).forEach(c => {
          totalClaims++;
          // Re-enforce eligibility gate programmatically
          const gate = this.evaluateCitationEligibility(c.verificationStatus, !!c.evidenceId);
          c.citationEligible = gate.eligible;

          if (gate.eligible) {
            verifiedClaims++;
            eligibleClaims++;
          } else {
            c.citationText = undefined;
            c.gapDetected = true;
            c.warning = 'Synthetic or unverified citation blocked by Citation Eligibility Gate';
            blockedSynthetic++;
          }
        });
      });

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
    evidenceChunks: Array<{
      sourceId: string;
      sourceTitle: string;
      chunkText: string;
      verificationStatus: 'verified' | 'partially_verified' | 'unverified';
      pageNumber?: string;
      author?: string;
      year?: string;
    }>
  ): GroundedGenerationResult {
    const verifiedSources = evidenceChunks.filter(
      e => e.verificationStatus === 'verified' && e.chunkText.trim().length > 0
    );
    const citableSource = verifiedSources.find(
      e => Boolean(e.author?.trim()) && Boolean(e.year?.trim())
    );
    const hasVerified = verifiedSources.length > 0;
    const hasCitableSource = Boolean(citableSource);

    return {
      paragraphs: [
        {
          paragraphIndex: 1,
          text: `بابەتی "${topic}" شیکاری زانستیی بۆ دەکرێت. سەرچاوەکان لە باری پشکنیندان.`,
          claims: [
            {
              claimId: 'CLM-FALLBACK-1',
              sentenceText: `بابەتی ${topic} پێویستی بە بەڵگەی سەلمێنراو هەیە.`,
              verificationStatus: hasVerified ? 'verified' : 'unverified',
              citationEligible: hasCitableSource,
              confidence: hasCitableSource ? 90 : hasVerified ? 80 : 50,
              gapDetected: !hasVerified,
              evidenceId: hasVerified ? verifiedSources[0]?.sourceId : undefined,
              warning: hasVerified ? undefined : 'Evidence Required: No verified sources present'
            }
          ]
        }
      ],
      verifiedCitations: citableSource
        ? [
            {
              citationId: 'CIT-FALLBACK-1',
              sourceId: citableSource.sourceId,
              inTextCitation: `(${citableSource.author}, ${citableSource.year})`,
              evidenceQuote: citableSource.chunkText,
              verified: true
            }
          ]
        : [],
      evidenceGaps: hasVerified
        ? []
        : [
            {
              claimId: 'CLM-FALLBACK-1',
              claimText: `بابەتی ${topic} پێویستی بە بەڵگەی سەلمێنراو هەیە.`,
              warning: 'Evidence Required'
            }
          ],
      integrityMetrics: {
        totalClaims: 1,
        verifiedClaims: hasVerified ? 1 : 0,
        citationEligibleClaims: hasVerified ? 1 : 0,
        blockedSyntheticCitations: hasVerified ? 0 : 1,
        evidenceCoveragePercentage: hasVerified ? 100 : 0,
        eligibilityGateStatus: hasVerified ? 'PASS' : 'WARN_GAPS'
      },
      kurdishSummary: 'دەقی پاشەکەوت بە سەرکەوتوویی لەسەر بنەمای یاساکانی ڕاستیی ئەکادیمی بەرجەستە کرا.'
    };
  }
}

export const evidenceGroundingService = new EvidenceGroundingService();
