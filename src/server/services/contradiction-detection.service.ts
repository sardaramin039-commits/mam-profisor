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

function safeText(value: unknown): string {
  return String(value ?? '').trim();
}

export class ContradictionDetectionService {
  public async analyze(
    topic: string,
    claims: any[],
    sources: any[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<ContradictionReport> {
    const safeClaims = Array.isArray(claims) ? claims.slice(0, 80) : [];
    const safeSources = Array.isArray(sources) ? sources.slice(0, 80) : [];
    if (safeClaims.length < 2) {
      return { findings: [], contradictionCount: 0, highSeverityCount: 0, status: 'insufficient_evidence' };
    }

    const findClaim = (reference: string, text: string) => {
      const normalizedText = safeText(text);
      return safeClaims.find(claim => {
        const claimId = safeText(claim?.claimId);
        const sourceId = safeText(claim?.sourceId);
        const claimText = safeText(claim?.text ?? claim?.sentenceText);
        return (
          (reference && (claimId === reference || sourceId === reference)) ||
          (normalizedText && claimText === normalizedText)
        );
      });
    };

    const sourceName = (id: string) => {
      const source = safeSources.find(item =>
        String(item?.id ?? item?.sourceId ?? item?.doiOrIsbn ?? item?.doi ?? '') === id
      );
      return safeText(source?.sourceTitle ?? source?.title ?? id);
    };

    const prompt = `بە شێوەیەکی بێلایەن ناکۆکییە زانستییەکان بدۆزەوە.
بابەت: ${topic}
Claims:
${JSON.stringify(safeClaims.map(claim => ({
  claimId: claim.claimId,
  text: claim.text,
  sourceId: claim.sourceId,
  evidenceId: claim.evidenceId,
  quote: claim.quote
})), null, 2)}

تەنها ناکۆکییە ڕوونەکان دەستنیشان بکە. هیچ فاکتێکی نوێ زیاد مەکە.
وەڵام تەنها JSON:
{"findings":[{"id":"CON-001","claimA":"...","claimB":"...","sourceA":"SRC-1","sourceB":"SRC-2","severity":"medium","explanationKurdish":"..."}]}`;

    try {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.05 }
      });
      const parsed = JSON.parse(response.text || '{}');
      const findings: ContradictionFinding[] = (Array.isArray(parsed.findings) ? parsed.findings : [])
        .slice(0, 40)
        .map((item: any, index: number) => {
          const sourceA = safeText(item?.sourceA);
          const sourceB = safeText(item?.sourceB);
          const claimA = safeText(item?.claimA);
          const claimB = safeText(item?.claimB);
          const severity = ['low', 'medium', 'high'].includes(item?.severity) ? item.severity : 'medium';
          const claimRefA = findClaim(sourceA, claimA);
          const claimRefB = findClaim(sourceB, claimB);
          const supported = Boolean(
            claimA &&
            claimB &&
            sourceA &&
            sourceB &&
            claimRefA &&
            claimRefB &&
            claimRefA !== claimRefB
          );
          return {
            id: safeText(item?.id) || `CON-${String(index + 1).padStart(3, '0')}`,
            claimA, claimB,
            sourceA: sourceName(sourceA) || sourceA,
            sourceB: sourceName(sourceB) || sourceB,
            severity,
            explanationKurdish: safeText(item?.explanationKurdish) || 'ناکۆکییەک پێشنیار کراوە و پێویستی بە پشکنینی توێژەر هەیە.',
            status: supported ? 'supported' : 'candidate'
          } as ContradictionFinding;
        });

      const supported = findings.filter(item => item.status === 'supported');
      return {
        findings: supported,
        contradictionCount: supported.length,
        highSeverityCount: supported.filter(item => item.severity === 'high').length,
        status: supported.length ? 'review_required' : 'clear'
      };
    } catch {
      return {
        findings: [],
        contradictionCount: 0,
        highSeverityCount: 0,
        status: 'insufficient_evidence'
      };
    }
  }
}

export const contradictionDetectionService = new ContradictionDetectionService();
