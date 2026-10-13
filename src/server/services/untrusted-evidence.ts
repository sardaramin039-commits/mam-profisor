/**
 * Client-controlled records are retrieval/input candidates, never trusted evidence.
 * Trusted full-text provenance can only be attached by a future server-side
 * acquisition and verification pipeline, not by JSON request fields.
 */
export function downgradeUntrustedEvidence<T extends Record<string, unknown>>(
  source: T
): T & Record<string, unknown> {
  return {
    ...source,
    verificationStatus: 'unverified',
    identityStatus: 'unverified',
    evidenceStatus: 'unverified',
    evidenceType: 'snippet',
    evidenceProvenance: 'user-supplied-content',
    provenance: 'user-supplied-content',
    citationEligible: false,
    existenceVerified: false
  };
}

export function downgradeUntrustedEvidenceList(
  sources: unknown[]
): Array<Record<string, unknown>> {
  return sources
    .filter((source): source is Record<string, unknown> =>
      Boolean(source && typeof source === 'object' && !Array.isArray(source))
    )
    .map(source => downgradeUntrustedEvidence(source));
}
