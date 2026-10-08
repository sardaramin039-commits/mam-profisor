import { GoogleGenAI } from '@google/genai';

export type EvidenceProvenance = 'server-verified-fulltext' | 'user-supplied-content' | 'unknown';

export interface ClaimNode {
  claimId: string;
  text: string;
  sourceId: string;
  evidenceId: string;
  confidence: number;
  page?: string;
  quote: string;
  verificationStatus: 'verified' | 'unverified' | 'rejected' | 'synthetic_blocked';
  citationId: string;
  syntheticCitationBlocked?: boolean;
  evidenceProvenance?: EvidenceProvenance;
}

export interface EvidenceNode {
  evidenceId: string;
  text: string;
  contextSnippet: string;
  sourceTitle: string;
  doiOrIsbn?: string;
  pageNumber?: string;
  provenance?: EvidenceProvenance;
}

export interface ClaimEvidenceGraph {
  claims: ClaimNode[];
  evidences: EvidenceNode[];
  syntheticCitationsBlockedCount: number;
  graphIntegrityScore: number;
  kurdishSummary: string;
}

function normalize(value: unknown): string {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDoi(value: unknown): string {
  return normalize(value).replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function titlesMatch(left: unknown, right: unknown): boolean {
  const a = normalize(left);
  const b = normalize(right);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function containsGroundedQuote(source: any, evidence: any): boolean {
  const sourceText = String(
    source?.content ??
    source?.fullText ??
    source?.text ??
    source?.rawText ??
    source?.chunkText ??
    source?.evidenceText ??
    ''
  ).trim();

  const quote = String(evidence?.quote ?? evidence?.text ?? '').trim();
  if (!sourceText || !quote) return false;

  return normalize(sourceText).includes(normalize(quote));
}

export class ClaimEvidenceGraphService {
  /**
   * Builds a candidate Claim-Evidence Graph, then applies deterministic grounding rules.
   * An LLM response can propose a relationship, but cannot grant verification status by itself.
   */
  public async buildGraph(
    topic: string,
    draftText: string,
    sources: any[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<ClaimEvidenceGraph> {
    const ai = getGeminiClient();
    const prompt = `بەڵگە و ادعاکان بۆ ئەم بابەتە پێشنیار بکە، بەڵام تەنها لەسەر تۆمارە سەرچاوەکانی لیستی خوارەوە.
بابەت: ${topic}
دەق: ${draftText}
سەرچاوەکان: ${JSON.stringify(sources.slice(0, 5))}

یاسای گرنگ:
- هیچ سەرچاوەی نوێ، DOI، نووسەر یان citation دروست مەکە.
- تەنها sourceTitle و doiOrIsbn ـی هەمان تۆمارە بەکاربهێنە.
- ئەگەر quote لە دەقی سەرچاوەدا نییە، claim ـەکە پشتڕاستکراو نییە.
- verificationStatus لە وەڵامەکەت تەنها candidate status ـە؛ سیستەم دواتر خۆی verification دەکات.

وەڵام تەنها JSON بێت:
{
  "claims": [
    {
      "claimId": "CLAIM-001",
      "text": "ادعای پێشنیارکراو",
      "sourceId": "SRC-001",
      "evidenceId": "EVI-001",
      "confidence": 0,
      "page": "",
      "quote": "quote ـی پێشنیارکراو",
      "verificationStatus": "unverified",
      "citationId": "CIT-001"
    }
  ],
  "evidences": [
    {
      "evidenceId": "EVI-001",
      "text": "بەڵگەی پێشنیارکراو",
      "contextSnippet": "",
      "sourceTitle": "ناوی هەمان سەرچاوە",
      "doiOrIsbn": ""
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
      const rawClaims: any[] = Array.isArray(parsed.claims) ? parsed.claims : [];
      const rawEvidences: any[] = Array.isArray(parsed.evidences) ? parsed.evidences : [];

      const safeSources = (Array.isArray(sources) ? sources : []).filter(source => {
        const provenance = source?.evidenceProvenance || source?.provenance;
        const strictEvidence =
          (source?.verificationStatus === 'verified' || source?.identityStatus === 'verified') &&
          source?.evidenceStatus === 'verified' &&
          source?.evidenceType === 'full-text' &&
          provenance === 'server-verified-fulltext';

        const sourceText = String(
          source?.content ??
          source?.fullText ??
          source?.text ??
          source?.rawText ??
          source?.chunkText ??
          source?.evidenceText ??
          ''
        ).trim();

        return (
          strictEvidence &&
          Boolean(sourceText) &&
          source?.rejectedAsFabricated !== true &&
          source?.trustLevel !== 'F' &&
          source?.trustLevel !== 'D'
        );
      });

      const evidenceMap = new Map<string, EvidenceNode>();
      for (const raw of rawEvidences) {
        const source = safeSources.find(
          candidate =>
            titlesMatch(candidate.title, raw.sourceTitle) ||
            (normalizeDoi(candidate.doiOrIsbn) &&
             normalizeDoi(candidate.doiOrIsbn) === normalizeDoi(raw.doiOrIsbn))
        );

        if (!source) continue;

        evidenceMap.set(String(raw.evidenceId || `EVI-${evidenceMap.size + 1}`), {
          evidenceId: String(raw.evidenceId || `EVI-${evidenceMap.size + 1}`),
          text: String(raw.text || ''),
          contextSnippet: String(raw.contextSnippet || ''),
          sourceTitle: String(source.title || ''),
          doiOrIsbn: source.doiOrIsbn || source.doi || undefined,
          pageNumber: raw.pageNumber ? String(raw.pageNumber) : undefined,
          provenance: source?.evidenceProvenance || 'unknown'
        });
      }

      const claims: ClaimNode[] = rawClaims.map((raw, index) => {
        const proposedEvidenceId = String(raw.evidenceId || '');
        const evidence = evidenceMap.get(proposedEvidenceId);
        const source = evidence
          ? safeSources.find(
              candidate =>
                titlesMatch(candidate.title, evidence.sourceTitle) ||
                normalizeDoi(candidate.doiOrIsbn) === normalizeDoi(evidence.doiOrIsbn)
            )
          : undefined;

        const grounded = Boolean(
          source &&
          evidence &&
          containsGroundedQuote(source, raw) &&
          source?.evidenceType === 'full-text' &&
          source?.evidenceProvenance === 'server-verified-fulltext'
        );
        const provenance = evidence?.provenance || 'unknown';
        const actualSourceId = source
          ? String(source.id || source.sourceId || source.doiOrIsbn || source.doi || '')
          : '';
        const actualEvidenceId = evidence?.evidenceId || '';

        return {
          claimId: String(raw.claimId || `CLAIM-${String(index + 1).padStart(3, '0')}`),
          text: String(raw.text || ''),
          sourceId: actualSourceId,
          evidenceId: actualEvidenceId,
          confidence: grounded ? Math.max(0, Math.min(100, Number(raw.confidence) || 0)) : 0,
          page: raw.page ? String(raw.page) : undefined,
          quote: grounded ? String(raw.quote || '') : '',
          verificationStatus: grounded && provenance === 'server-verified-fulltext' ? 'verified' : 'unverified',
          citationId: grounded ? String(raw.citationId || '') : '',
          syntheticCitationBlocked: !(grounded && provenance === 'server-verified-fulltext'),
          evidenceProvenance: provenance
        };
      });

      const verifiedCount = claims.filter(claim => claim.verificationStatus === 'verified').length;
      const graphIntegrityScore = claims.length > 0
        ? Math.round((verifiedCount / claims.length) * 100)
        : 0;

      return {
        claims,
        evidences: [...evidenceMap.values()],
        syntheticCitationsBlockedCount: claims.filter(
          claim => claim.verificationStatus !== 'verified'
        ).length,
        graphIntegrityScore,
        kurdishSummary: claims.length === 0
          ? 'هیچ Claim ـێکی بەڵگەدار پشتڕاست نەکرایەوە؛ هیچ citation ـێک Verified دانانرێت.'
          : `${verifiedCount} لە ${claims.length} Claim بە quote ـی هەمان source پشتڕاست کرا؛ ئەوانەی تر بە شێوەی unverified دەمێنن.`
      };
    } catch (err: unknown) {
      console.error('Error building ClaimEvidenceGraph:', err);
      return {
        claims: [],
        evidences: [],
        syntheticCitationsBlockedCount: 1,
        graphIntegrityScore: 0,
        kurdishSummary: 'نەتوانرا Claim-Evidence Graph بە پشتڕاستییەوە بونیاد بنرێت؛ هیچ Claim یان Citation ـێک Verified دانانرێت.'
      };
    }
  }
}

export const claimEvidenceGraphService = new ClaimEvidenceGraphService();
