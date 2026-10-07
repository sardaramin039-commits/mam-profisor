import { assessEvidenceVerification, SourceVerificationReport } from './source-verification.service';

export interface EvidenceLink {
  claim: string;
  sourceId: string;
  sourceTitle: string;
  evidenceText: string;
  overlapScore: number;
  status: 'candidate' | 'strong-candidate';
  verificationStatus: 'verified' | 'unverified' | 'not_available';
  claimCitationEligible: boolean;
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(token => token.length > 2)
  );
}

function overlapScore(claim: string, evidence: string): number {
  const left = tokens(claim);
  const right = tokens(evidence);
  if (left.size < 3 || right.size === 0) return 0;

  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap++;
  }
  return Math.round((overlap / left.size) * 100);
}

export function linkClaimsToEvidence(
  claims: string[],
  sources: Array<{
    id?: string;
    sourceId?: string;
    title?: string;
    evidenceText?: string;
  }>,
  reports: SourceVerificationReport[] = [],
  limit = 40
): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  const reportById = new Map(reports.map(report => [report.sourceId, report]));

  for (const claimValue of claims) {
    const claim = String(claimValue || '').trim();
    if (!claim) continue;

    const ranked = sources
      .map(source => {
        const evidence = String(source.evidenceText || '').trim();
        const score = evidence ? overlapScore(claim, evidence) : 0;
        const sourceId = String(source.id || source.sourceId || '').trim();
        const report = reportById.get(sourceId);
        const evidenceVerification = evidence
          ? assessEvidenceVerification({ claimText: claim, evidenceText: evidence })
          : { status: 'not_available' as const };

        return {
          claim,
          sourceId,
          sourceTitle: String(source.title || '').trim(),
          evidenceText: evidence,
          overlapScore: score,
          status: score >= 70 ? 'strong-candidate' as const : 'candidate' as const,
          verificationStatus: evidenceVerification.status,
          claimCitationEligible:
            report?.identityStatus === 'verified' &&
            evidenceVerification.status === 'verified'
        };
      })
      .filter(item => item.sourceId && item.evidenceText && item.overlapScore >= 35)
      .sort((a, b) =>
        Number(b.claimCitationEligible) - Number(a.claimCitationEligible) ||
        b.overlapScore - a.overlapScore
      )
      .slice(0, 3);

    links.push(...ranked);
    if (links.length >= limit) return links.slice(0, limit);
  }

  return links.slice(0, limit);
}
