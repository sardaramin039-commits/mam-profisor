export type EvidenceVerificationStatus = 'verified' | 'unverified' | 'not_available';
export type EvidenceType = 'abstract' | 'snippet' | 'full-text';
export type EvidenceProvenance =
  | 'server-verified-fulltext'
  | 'user-supplied-content'
  | 'unknown';

const SERVER_VERIFIED_FULLTEXT = Symbol('mam-professor.server-verified-fulltext');

/**
 * Call only after the server itself has fetched and validated the source full text.
 * JSON clients cannot create this non-serializable trust marker.
 */
export function markServerVerifiedFullText<T extends object>(source: T): T {
  Object.assign(source, {
    evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext'
  });
  Object.defineProperty(source, SERVER_VERIFIED_FULLTEXT, {
    value: true,
    enumerable: true,
    configurable: false,
    writable: false
  });
  return source;
}

export function isServerVerifiedFullText(source: unknown): boolean {
  if (!source || typeof source !== 'object') return false;
  return (source as Record<PropertyKey, unknown>)[SERVER_VERIFIED_FULLTEXT] === true;
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readEvidence(source: {
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
  evidenceProvenance: EvidenceProvenance | undefined,
  trustedSource?: unknown
): boolean {
  return (
    isServerVerifiedFullText(trustedSource) &&
    evidenceStatus === 'verified' &&
    hasEvidence &&
    evidenceType === 'full-text' &&
    evidenceProvenance === 'server-verified-fulltext'
  );
}
