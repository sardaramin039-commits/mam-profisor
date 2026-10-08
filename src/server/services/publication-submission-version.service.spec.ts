import { describe, expect, it } from 'vitest';
import {
  buildSubmissionVersion,
  verifySubmissionVersionChain
} from './publication-submission-version.service';

const fp1 = 'a'.repeat(64);
const fp2 = 'b'.repeat(64);

describe('P18 submission versioning', () => {
  it('builds deterministic immutable versions', () => {
    const input = {
      submissionId: 'SUB-1',
      cycle: 1,
      kind: 'READY' as const,
      statusAtCapture: 'READY' as const,
      packageFingerprint: fp1,
      capturedAt: '2026-10-08T15:00:00.000Z'
    };
    const first = buildSubmissionVersion(input);
    const second = buildSubmissionVersion(input);
    expect(first.id).toBe(second.id);
    expect(first.immutableHash).toBe(second.immutableHash);
  });

  it('verifies a contiguous version chain', () => {
    const first = buildSubmissionVersion({
      submissionId: 'SUB-1',
      cycle: 1,
      kind: 'READY',
      statusAtCapture: 'READY',
      packageFingerprint: fp1,
      capturedAt: '2026-10-08T15:00:00.000Z'
    });
    const second = buildSubmissionVersion({
      submissionId: 'SUB-1',
      cycle: 2,
      kind: 'RESUBMISSION',
      statusAtCapture: 'RESUBMITTED',
      packageFingerprint: fp2,
      previousFingerprint: fp1,
      capturedAt: '2026-10-08T16:00:00.000Z'
    });
    const report = verifySubmissionVersionChain([second, first]);
    expect(report.status).toBe('VERIFIED');
    expect(report.latestCycle).toBe(2);
    expect(report.latestFingerprint).toBe(fp2);
  });

  it('detects a changed previous fingerprint', () => {
    const first = buildSubmissionVersion({
      submissionId: 'SUB-1',
      cycle: 1,
      kind: 'READY',
      statusAtCapture: 'READY',
      packageFingerprint: fp1,
      capturedAt: '2026-10-08T15:00:00.000Z'
    });
    const second = buildSubmissionVersion({
      submissionId: 'SUB-1',
      cycle: 2,
      kind: 'RESUBMISSION',
      statusAtCapture: 'RESUBMITTED',
      packageFingerprint: fp2,
      previousFingerprint: 'c'.repeat(64),
      capturedAt: '2026-10-08T16:00:00.000Z'
    });
    const report = verifySubmissionVersionChain([first, second]);
    expect(report.status).toBe('INVALID');
    expect(report.errors.some(error => error.includes('fingerprint chain break'))).toBe(true);
  });

  it('reports no versions explicitly', () => {
    const report = verifySubmissionVersionChain([]);
    expect(report.status).toBe('EMPTY');
    expect(report.versionCount).toBe(0);
  });
});
