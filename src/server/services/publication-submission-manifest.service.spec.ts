import { describe, expect, it } from 'vitest';
import { buildPublicationSubmissionPackage } from './publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from './publication-submission-integrity.service';
import { assembleManuscript } from './manuscript-assembly.service';
import {
  buildSubmissionManifest,
  verifySubmissionManifest
} from './publication-submission-manifest.service';

function makeInputs() {
  const manuscript = assembleManuscript({
    projectId: 'P19-1',
    title: 'P19 test manuscript',
    abstract: 'A concise abstract.',
    methodology: 'Qualitative methodology.',
    chapters: [{ id: 'CH-1', title: 'Chapter one', order: 1, content: 'Evidence based content.' }],
    conclusion: 'Final conclusion.'
  });
  const policy = {
    journalName: 'P19 Journal',
    manuscriptType: 'article' as const,
    requiredSections: ['abstract', 'methodology', 'chapter', 'conclusion'] as const
  };
  const pkg = buildPublicationSubmissionPackage({
    manuscript,
    policy,
    keywords: ['research', 'kurdish']
  });
  const integrity = verifyPublicationSubmissionIntegrity({ package: pkg });
  return { manuscript, policy, pkg, integrity };
}

describe('P19 reproducible submission manifest', () => {
  it('builds a stable manifest with a deterministic policy fingerprint', () => {
    const { policy, pkg, integrity } = makeInputs();
    const input = {
      submissionId: 'SUB-19',
      userId: 'USER-19',
      workspaceId: 'WS-19',
      policy,
      package: pkg,
      integrity,
      versionId: 'VER-19',
      auditHeadHash: 'a'.repeat(64),
      capturedAt: '2026-10-08T16:00:00.000Z'
    };
    const first = buildSubmissionManifest(input);
    const second = buildSubmissionManifest(input);
    expect(first.id).toBe(second.id);
    expect(first.policyFingerprint).toHaveLength(64);
    expect(first.immutableHash).toBe(second.immutableHash);
  });

  it('detects policy tampering', () => {
    const { policy, pkg, integrity } = makeInputs();
    const manifest = buildSubmissionManifest({
      submissionId: 'SUB-19',
      userId: 'USER-19',
      workspaceId: 'WS-19',
      policy,
      package: pkg,
      integrity,
      versionId: 'VER-19',
      auditHeadHash: 'a'.repeat(64),
      capturedAt: '2026-10-08T16:00:00.000Z'
    });
    const tampered = { ...manifest, policy: { ...manifest.policy, journalName: 'Tampered Journal' } };
    const verification = verifySubmissionManifest(tampered);
    expect(verification.status).toBe('INVALID');
    expect(verification.errors.some(error => error.includes('Policy fingerprint'))).toBe(true);
  });

  it('rejects a non-ready integrity package', () => {
    const { policy, pkg, integrity } = makeInputs();
    const revised = { ...integrity, status: 'REVISE' as const, readyToSubmit: false };
    expect(() => buildSubmissionManifest({
      submissionId: 'SUB-19',
      userId: 'USER-19',
      workspaceId: 'WS-19',
      policy,
      package: pkg,
      integrity: revised,
      versionId: 'VER-19',
      auditHeadHash: 'a'.repeat(64),
      capturedAt: '2026-10-08T16:00:00.000Z'
    })).toThrow('Only a READY integrity package');
  });

  it('rejects malformed manifest hashes', () => {
    const { policy, pkg, integrity } = makeInputs();
    expect(() => buildSubmissionManifest({
      submissionId: 'SUB-19',
      userId: 'USER-19',
      workspaceId: 'WS-19',
      policy,
      package: pkg,
      integrity,
      versionId: 'VER-19',
      auditHeadHash: 'bad',
      capturedAt: '2026-10-08T16:00:00.000Z'
    })).toThrow('integrity hash is invalid');
  });
});
