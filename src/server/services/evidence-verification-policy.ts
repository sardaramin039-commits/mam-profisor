export type EvidenceVerificationStatus = 'verified' | 'unverified' | 'not_available';
export type EvidenceType = 'abstract' | 'snippet' | 'full-text';
export type EvidenceProvenance =
  | 'server-verified-fulltext'
  | 'user-supplied-content'
  | 'unknown';

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readEvidence(source: {
  evidenceText?: string;
  content?: string;
  fullText?: string;
  text?: string;
  chunkText?: string;
}): string {
  return String(
    source.evidenceText ??
    source.content ??
    source.fullText ??
    source.text ??
    source.chunkText ??
    ''
  ).trim();
}

export function assessEvidenceVerification(source: {
  claimText?: string;
  evidenceText?: string;
  content?: string;
  fullText?: string;
  text?: string;
  chunkText?: string;
}): {
  status: EvidenceVerificationStatus;
  method?: 'exact-normalized-claim-match';
} {
  const claim = normalize(String(source.claimText || ''));
  const evidence = normalize(readEvidence(source));

  if (!claim || !evidence || evidence.length < 10) {
    return { status: 'not_available' };
  }

  if (evidence.includes(claim)) {
    return {
      status: 'verified',
      method: 'exact-normalized-claim-match'
    };
  }

  return { status: 'unverified' };
}

export function isCitationEligibleEvidence(
  evidenceStatus: EvidenceVerificationStatus,
  hasEvidence: boolean,
  evidenceType: EvidenceType | undefined,
  evidenceProvenance: EvidenceProvenance | undefined
): boolean {
  return (
    evidenceStatus === 'verified' &&
    hasEvidence &&
    evidenceType === 'full-text' &&
    evidenceProvenance === 'server-verified-fulltext'
  );
}
