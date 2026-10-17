/**
 * src/app/helpers/scholarly-algorithms.helper.ts
 *
 * Core pure-TypeScript scholarly algorithms ported from server services:
 * - Contradiction Detection between claims & evidence
 * - Human Scholarly Prose refinement & citation preservation
 * - Kurdish Academic Language (Sorani) quality analyzer
 */

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

export interface ScholarlyProseResult {
  refinedText: string;
  changes: string[];
  unsupportedContentBlocked: number;
  humanReviewRequired: boolean;
  stylePolicy: string;
  preservationPassed?: boolean;
}

export interface KurdishLanguageIssue {
  type: 'grammar' | 'spelling' | 'terminology' | 'tone' | 'cohesion';
  originalText: string;
  suggestedText: string;
  explanationKurdish: string;
}

export interface KurdishLanguageAnalysis {
  overallLanguageScore: number;
  academicTonePassed: boolean;
  issues: KurdishLanguageIssue[];
  refinedTextKurdish: string;
  kurdishSummary: string;
}

function countOccurrences(text: string, fragment: string): number {
  if (!fragment) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= text.length) {
    const index = text.indexOf(fragment, offset);
    if (index < 0) break;
    count++;
    offset = index + fragment.length;
  }
  return count;
}

export function extractCitationFragments(text: string): string[] {
  const matches = [
    ...(text.match(/\[[0-9]+(?:\s*[,;]\s*[0-9]+)*\]/g) || []),
    ...(text.match(/\([^()\n]{1,120}\b(?:19|20)\d{2}[a-z]?\)/g) || [])
  ];
  return Array.from(new Set(matches.map(item => item.trim()).filter(Boolean)));
}

export function verifyCitationPreservation(
  original: string,
  refined: string,
  protectedFragments: string[] = []
): boolean {
  const uniqueFragments = Array.from(
    new Set([
      ...protectedFragments.map(item => String(item || '').trim()).filter(Boolean),
      ...extractCitationFragments(original)
    ])
  );
  return uniqueFragments.every(
    fragment => countOccurrences(refined, fragment) >= countOccurrences(original, fragment)
  );
}

export function detectLocalContradictions(claims: { id: string; text: string; source: string }[]): ContradictionReport {
  if (!claims || claims.length < 2) {
    return { findings: [], contradictionCount: 0, highSeverityCount: 0, status: 'insufficient_evidence' };
  }

  const findings: ContradictionFinding[] = [];
  const negations = ['پێچەوانە', 'ڕەتکردنەوە', 'دژ', 'نەگونجاو', 'جیاوازە لە', 'بەرپەرچ'];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];
      const hasDirectConflict = negations.some(neg => a.text.includes(neg) && b.text.includes(a.text.replace(neg, '').trim().slice(0, 15)));

      if (hasDirectConflict) {
        findings.push({
          id: `CON-${findings.length + 1}`,
          claimA: a.text,
          claimB: b.text,
          sourceA: a.source,
          sourceB: b.source,
          severity: 'medium',
          explanationKurdish: 'دژبەری یان جیاوازیی مانادار لە نێوان هەردوو سەرچاوەدا دەبینرێت.',
          status: 'candidate'
        });
      }
    }
  }

  return {
    findings,
    contradictionCount: findings.length,
    highSeverityCount: findings.filter(f => f.severity === 'high').length,
    status: findings.length > 0 ? 'review_required' : 'clear'
  };
}
