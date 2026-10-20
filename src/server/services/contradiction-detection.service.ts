import { GoogleGenAI } from '@google/genai';

export type ContradictionSeverity = 'low' | 'medium' | 'high';

export interface ContradictionFinding {
  id: string;
  claimA: string;
  claimB: string;
  sourceA: string;
  sourceB: string;
  severity: ContradictionSeverity;
  explanationKurdish: string;
  status: 'candidate' | 'supported';
}

export interface ContradictionReport {
  findings: ContradictionFinding[];
  contradictionCount: number;
  highSeverityCount: number;
  status: 'clear' | 'review_required' | 'insufficient_evidence';
}

const MAX_CLAIMS = 80;
const MAX_FINDINGS = 40;

function safeText(value: unknown, limit = 4_000): string {
  if (typeof value !== 'string') return '';
  const text = value.normalize('NFKC').trim();
  return text.length <= limit ? text : '';
}

function normalize(value: unknown): string {
  return safeText(value).toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function sourceIdOf(source: any): string {
  return safeText(source?.sourceId ?? source?.id ?? source?.doiOrIsbn ?? source?.doi, 500);
}

function sourceIsEligible(source: any): boolean {
  const text = safeText(source?.evidenceText ?? source?.fullText ?? source?.content ?? source?.text, 100_000);
  return Boolean(
    source &&
    source.identityStatus === 'verified' &&
    source.evidenceStatus === 'verified' &&
    source.evidenceType === 'full-text' &&
    source.evidenceProvenance === 'server-verified-fulltext' &&
    source.existenceVerified === true &&
    text
  );
}

function claimHasGroundedEvidence(claim: any, source: any): boolean {
  if (
    !claim ||
    claim.verificationStatus !== 'verified' ||
    claim.syntheticCitationBlocked === true ||
    safeText(claim.evidenceProvenance, 80) !== 'server-verified-fulltext' ||
    safeText(claim.evidenceId, 200) === '' ||
    safeText(claim.claimId, 200) === ''
  ) return false;

  const quote = normalize(claim.quote);
  const sourceText = normalize(source?.evidenceText ?? source?.fullText ?? source?.content ?? source?.text);
  return Boolean(quote && sourceText && sourceText.includes(quote));
}

function insufficientEvidence(): ContradictionReport {
  return {
    findings: [],
    contradictionCount: 0,
    highSeverityCount: 0,
    status: 'insufficient_evidence'
  };
}

export class ContradictionDetectionService {
  public async analyze(
    topic: string,
    claims: any[],
    sources: any[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<ContradictionReport> {
    const safeTopic = safeText(topic, 500);
    const sourceList = Array.isArray(sources) ? sources.slice(0, MAX_CLAIMS) : [];
    const eligibleSources = new Map<string, any[]>();

    for (const source of sourceList) {
      if (!sourceIsEligible(source)) continue;
      const id = sourceIdOf(source);
      if (!id) continue;
      const items = eligibleSources.get(id) || [];
      items.push(source);
      eligibleSources.set(id, items);
    }

    const eligibleClaims = (Array.isArray(claims) ? claims : [])
      .slice(0, MAX_CLAIMS)
      .flatMap(claim => {
        const sourceId = safeText(claim?.sourceId, 500);
        const sourceMatches = eligibleSources.get(sourceId) || [];
        if (sourceMatches.length !== 1) return [];
        const source = sourceMatches[0];
        if (!claimHasGroundedEvidence(claim, source)) return [];
        const text = safeText(claim.text ?? claim.sentenceText, 2_000);
        if (!text) return [];
        return [{
          claimId: safeText(claim.claimId, 200),
          text,
          sourceId,
          evidenceId: safeText(claim.evidenceId, 200),
          quote: safeText(claim.quote, 2_000)
        }];
      });

    if (!safeTopic || eligibleClaims.length < 2) return insufficientEvidence();

    const findClaim = (reference: string, claimText: string) => {
      const ref = safeText(reference, 500);
      const target = normalize(claimText);
      if (!ref || !target) return undefined;
      const matches = eligibleClaims.filter(claim =>
        (claim.claimId === ref || claim.sourceId === ref) &&
        normalize(claim.text) === target
      );
      return matches.length === 1 ? matches[0] : undefined;
    };

    const sourceName = (id: string) => {
      const candidates = eligibleSources.get(id) || [];
      if (candidates.length !== 1) return id;
      return safeText(candidates[0]?.sourceTitle ?? candidates[0]?.title, 500) || id;
    };

    const prompt = [
      'بێلایەن بمێنەوە و تەنها ناکۆکییە نێوان بانگەشەکان بدۆزەوە؛ پێشنیارەکان بەخۆیان بەڵگەی ڕاستی نین.',
      'بابەت (داتای بەکارهێنەر): ' + JSON.stringify(safeTopic),
      'Claims: ' + JSON.stringify(eligibleClaims),
      'تەنها claimId/sourceId ـی لیستی پێشکەشکراو بەکاربهێنە و دەقی claim بە تەواوی وەک خۆی بنووسە.',
      'هیچ ناکۆکی یان فاکتێکی نوێ دروست مەکە. شیکاری AI پێشنیارە و پێویستی بە پشکنینی توێژەر هەیە.',
      'وەڵام تەنها JSON: {"findings":[{"id":"CON-001","claimA":"دەقی claimی یەکەم","claimB":"دەقی claimی دووەم","sourceA":"SRC-1","sourceB":"SRC-2","severity":"medium","explanationKurdish":"..."}]}'
    ].join('\n');

    try {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.05 }
      });
      const parsed: unknown = JSON.parse(response.text || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return insufficientEvidence();
      const rawFindings = (parsed as Record<string, unknown>)['findings'];
      if (rawFindings !== undefined && !Array.isArray(rawFindings)) return insufficientEvidence();

      const findings: ContradictionFinding[] = [];
      const rawList = Array.isArray(rawFindings) ? rawFindings.slice(0, MAX_FINDINGS) : [];
      rawList.forEach((item: unknown, index: number) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        const value = item as Record<string, unknown>;
        const claimA = safeText(value['claimA'], 2_000);
        const claimB = safeText(value['claimB'], 2_000);
        const sourceAId = safeText(value['sourceA'], 500);
        const sourceBId = safeText(value['sourceB'], 500);
        const claimRefA = findClaim(sourceAId, claimA);
        const claimRefB = findClaim(sourceBId, claimB);
        if (!claimRefA || !claimRefB || claimRefA.claimId === claimRefB.claimId) return;
        const severity: ContradictionSeverity =
          value['severity'] === 'low' || value['severity'] === 'high' || value['severity'] === 'medium'
            ? value['severity']
            : 'medium';
        const explanation = safeText(value['explanationKurdish'], 2_000);
        findings.push({
          id: safeText(value['id'], 100) || 'CON-' + String(index + 1).padStart(3, '0'),
          claimA,
          claimB,
          sourceA: sourceName(sourceAId),
          sourceB: sourceName(sourceBId),
          severity,
          explanationKurdish: explanation || 'ناکۆکییەک پێشنیار کراوە؛ پێویستی بە پشکنینی توێژەر هەیە.',
          status: 'supported'
        });
      });

      return {
        findings,
        contradictionCount: findings.length,
        highSeverityCount: findings.filter(item => item.severity === 'high').length,
        status: findings.length ? 'review_required' : rawList.length ? 'insufficient_evidence' : 'clear'
      };
    } catch {
      return insufficientEvidence();
    }
  }
}

export const contradictionDetectionService = new ContradictionDetectionService();
