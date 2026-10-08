import { GoogleGenAI } from '@google/genai';
import { claimEvidenceGraphService } from './claim-evidence-graph.service';
import {
  isCitationEligibleEvidence,
  type EvidenceProvenance,
  type EvidenceType
} from './evidence-verification-policy';

export interface GroundedClaim {
  claimId: string;
  sentenceText: string;
  sourceId?: string;
  evidenceId?: string;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  citationEligible: boolean;
  citationText?: string;
  evidenceQuote?: string;
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
    evidenceId: string;
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

function citationTextMatchesSource(
  citationText: unknown,
  source: { author?: string; year?: string }
): boolean {
  const citation = String(citationText || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const year = String(source.year || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim();
  const authorTokens = String(source.author || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter(token => token.length > 2);

  return Boolean(
    citation &&
    year &&
    citation.includes(year) &&
    authorTokens.some(token => citation.includes(token))
  );
}

export class EvidenceGroundingService {
  /**
   * Citation Eligibility Gate
   * Enforces that ONLY VERIFIED sources with actual evidence chunks are eligible for citations.
   */
  public evaluateCitationEligibility(
    sourceStatus: string,
    hasEvidence: boolean,
    evidenceType: EvidenceType = 'snippet',
    provenance: EvidenceProvenance = 'unknown'
  ): {
    eligible: boolean;
    status: 'verified' | 'partially_verified' | 'unverified'
  } {
    const normalized = (sourceStatus || '').toLowerCase();
    const status =
      normalized === 'verified'
        ? 'verified' as const
        : normalized === 'partially_verified'
          ? 'partially_verified' as const
          : 'unverified' as const;

    return {
      eligible:
        isCitationEligibleEvidence(
          status === 'verified' ? 'verified' : status === 'partially_verified'
            ? 'unverified'
            : 'unverified',
          hasEvidence,
          evidenceType,
          provenance
        ),
      status
    };
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
    evidenceType?: EvidenceType;
    provenance?: EvidenceProvenance;
    }>,
    getGeminiClient: () => GoogleGenAI
  ): Promise<GroundedGenerationResult> {
    const ai = getGeminiClient();

    const contextChunks = verifiedEvidenceChunks.filter(chunk =>
      !!chunk.chunkText?.trim() && !!chunk.sourceId && !!chunk.sourceTitle
    );
    const citationEligibleChunks = contextChunks.filter(chunk =>
      this.evaluateCitationEligibility(
        chunk.verificationStatus,
        !!chunk.chunkText?.trim(),
        chunk.evidenceType || 'snippet',
        chunk.provenance || 'unknown'
      ).eligible
    );

    if (citationEligibleChunks.length === 0) {
      return this.createFallbackGroundedResult(topic, verifiedEvidenceChunks);
    }

    const preparedContextChunks = citationEligibleChunks.map((chunk, index) => ({
      ...chunk,
      evidenceId: `EVI-${index + 1}`
    }));

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمی و بەرپرسی بزوێنەری Evidence Intelligence یت.
ئەرکی تۆ: دروستکردنی دەقێکی زانستیی فەرمی بە کوردی بۆ:
تەوەرە: ${topic}
داواکاری: ${promptText}

بەڵگە بڕواپێکراوەکان (VERIFIED EVIDENCE):
${JSON.stringify(preparedContextChunks, null, 2)}

یاسای نەگۆڕی Citation Eligibility Gate:
1. تەنها ئەو ادعانەی کە لە full-text ـی لەلایەن server ـەوە پشتڕاستکراوەوە هەن مافی Citation ـی Verified ـیان هەیە.
2. بۆ هەر ئیدعایەک کە بەڵگەی سەلمێنراوی نییە، gapDetected: true دیاری بکە و ئاگاداری "Evidence required" بنووسە.
3. بۆ context-only هیچ citation، DOI، ساڵ، نووسەر یان reference ـێکی نوێ دروست مەکە.

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
          "evidenceQuote": "دەقی ڕاستەقینەی ناو chunk ـەکە",
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
      "evidenceId": "EVI-001",
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
      const paragraphs: GroundedParagraph[] = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [];
      const evidenceGaps = Array.isArray(parsed.evidenceGaps) ? parsed.evidenceGaps : [];

      const eligibleByEvidenceId = new Map<
        string,
        (typeof preparedContextChunks)[number]
      >();

      for (const chunk of preparedContextChunks) {
        const isEligible = citationEligibleChunks.some(
          eligible =>
            eligible.sourceId === chunk.sourceId &&
            eligible.sourceTitle === chunk.sourceTitle
        );
        if (!isEligible) continue;

        eligibleByEvidenceId.set(String(chunk.evidenceId), chunk);
      }

      const normalized = (value: string) => value.normalize('NFKC').toLocaleLowerCase().trim();

      const hasGroundedEvidence = (
        sourceId: unknown,
        evidenceId: unknown,
        evidenceQuote: unknown
      ): boolean => {
        const source = String(sourceId || '');
        const evidence = eligibleByEvidenceId.get(String(evidenceId || ''));
        const quote = String(evidenceQuote || '').trim();
        if (!source || !evidence || evidence.sourceId !== source || !quote) return false;
        return normalized(evidence.chunkText).includes(normalized(quote));
      };

      let totalClaims = 0;
      let verifiedClaims = 0;
      let eligibleClaims = 0;
      let blockedSynthetic = 0;

      paragraphs.forEach(paragraph => {
        (paragraph.claims || []).forEach(claim => {
          totalClaims++;

          const grounded = Boolean(
            claim.sourceId &&
            claim.evidenceId &&
            eligibleByEvidenceId.has(String(claim.evidenceId)) &&
            hasGroundedEvidence(claim.sourceId, claim.evidenceId, claim.evidenceQuote)
          );

          claim.citationEligible = grounded && claim.verificationStatus === 'verified';

          if (claim.citationEligible) {
            const matchedChunk = eligibleByEvidenceId.get(String(claim.evidenceId));
            if (
              claim.citationText &&
              matchedChunk &&
              !citationTextMatchesSource(claim.citationText, matchedChunk)
            ) {
              claim.citationText = undefined;
            }
            verifiedClaims++;
            eligibleClaims++;
          } else {
            claim.citationText = undefined;
            claim.evidenceQuote = undefined;
            claim.gapDetected = true;
            claim.verificationStatus = claim.verificationStatus === 'verified'
              ? 'partially_verified'
              : 'unverified';
            claim.confidence = 0;
            claim.warning = 'Citation eligibility requires source-bound evidence that was not deterministically confirmed.';
            blockedSynthetic++;
          }
        });
      });

      const rawVerifiedCitations = Array.isArray(parsed.verifiedCitations)
        ? parsed.verifiedCitations
        : [];
      const verifiedCitations = rawVerifiedCitations.filter((citation: any) => {
        if (citation?.verified !== true) return false;

        const matchedChunk = eligibleByEvidenceId.get(String(citation?.evidenceId || ''));
        if (!matchedChunk) return false;

        return (
          citationTextMatchesSource(citation?.inTextCitation, matchedChunk) &&
          hasGroundedEvidence(
            citation?.sourceId,
            citation?.evidenceId,
            citation?.evidenceQuote
          )
        );
      }).map((citation: any) => ({
        citationId: String(citation.citationId || ''),
        sourceId: String(citation.sourceId || ''),
        evidenceId: String(citation.evidenceId || ''),
        inTextCitation: String(citation.inTextCitation || ''),
        evidenceQuote: String(citation.evidenceQuote || ''),
        verified: true
      }));

      const coverageRatio = totalClaims > 0
        ? Math.round((verifiedClaims / totalClaims) * 100)
        : 0;
      const status: GroundedGenerationResult['integrityMetrics']['eligibilityGateStatus'] =
        totalClaims === 0
          ? 'FAIL'
          : coverageRatio >= 80
            ? 'PASS'
            : coverageRatio >= 50
              ? 'WARN_GAPS'
              : 'FAIL';

      // Re-run the strict graph only against chunks that are already source-eligible.
      await claimEvidenceGraphService.buildGraph(
        topic,
        paragraphs.map(paragraph => paragraph.text).join('\\n\\n'),
        citationEligibleChunks,
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
      paragraphs: [
        {
          paragraphIndex: 1,
          text: `نەتوانرا دەقی ئەکادیمیی پشتڕاستکراو بۆ "${topic}" بەرهەم بهێنرێت، چونکە پشکنینی بەڵگەکان بەردەست نەبوو.`,
          claims: [
            {
              claimId: 'CLM-FALLBACK-1',
              sentenceText: 'هیچ Claim ـێک لە کاتی fallback ـدا Verified دانانرێت.',
              verificationStatus: 'unverified',
              citationEligible: false,
              confidence: 0,
              gapDetected: true,
              warning: 'Evidence verification unavailable; citation generation is blocked.'
            }
          ]
        }
      ],
      verifiedCitations: [],
      evidenceGaps: [
        {
          claimId: 'CLM-FALLBACK-1',
          claimText: `بابەتی ${topic} پێویستی بە پشکنینی بەڵگەی دووبارە هەیە.`,
          warning: 'Evidence verification unavailable'
        }
      ],
      integrityMetrics: {
        totalClaims: 1,
        verifiedClaims: 0,
        citationEligibleClaims: 0,
        blockedSyntheticCitations: 1,
        evidenceCoveragePercentage: 0,
        eligibilityGateStatus: 'FAIL'
      },
      kurdishSummary: 'Fallback بەکارهاتووە؛ هیچ Citation یان Verified Claim ـێک بەرهەم نەهاتووە.'
    };
  }
}

export const evidenceGroundingService = new EvidenceGroundingService();
