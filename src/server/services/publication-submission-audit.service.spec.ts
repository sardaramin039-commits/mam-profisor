import { describe, expect, it } from 'vitest';
import {
  buildSubmissionAuditEvent,
  verifySubmissionAuditChain
} from './publication-submission-audit.service';

function event(version: number, from: 'DRAFT' | 'READY' | 'SUBMITTED' | null, to: 'DRAFT' | 'READY' | 'SUBMITTED', previousHash: string) {
  return buildSubmissionAuditEvent({
    submissionId: 'SUB-1',
    version,
    from,
    to,
    note: version === 1 ? 'Created' : 'Transitioned',
    occurredAt: '2026-10-08T15:00:0' + version + '.000Z',
    previousHash
  });
}

describe('P17 submission audit chain', () => {
  it('verifies a valid multi-event chain', () => {
    const first = event(1, null, 'DRAFT', '');
    const second = event(2, 'DRAFT', 'READY', first.eventHash);
    const third = event(3, 'READY', 'SUBMITTED', second.eventHash);
    const report = verifySubmissionAuditChain([third, first, second], 'SUBMITTED', 3);
    expect(report.status).toBe('VERIFIED');
    expect(report.eventCount).toBe(3);
    expect(report.latestHash).toBe(third.eventHash);
  });

  it('detects a broken previous-hash link', () => {
    const first = event(1, null, 'DRAFT', '');
    const second = event(2, 'DRAFT', 'READY', 'wrong-hash');
    const report = verifySubmissionAuditChain([first, second], 'READY', 2);
    expect(report.status).toBe('INVALID');
    expect(report.errors.some(error => error.includes('hash-chain break'))).toBe(true);
  });

  it('detects state mismatch between events', () => {
    const first = event(1, null, 'DRAFT', '');
    const second = event(2, 'READY', 'SUBMITTED', first.eventHash);
    const report = verifySubmissionAuditChain([first, second], 'SUBMITTED', 2);
    expect(report.status).toBe('INVALID');
    expect(report.errors.some(error => error.includes('state mismatch'))).toBe(true);
  });

  it('reports legacy submissions without immutable audit events', () => {
    const report = verifySubmissionAuditChain([], 'DRAFT', 1);
    expect(report.status).toBe('LEGACY_UNSEEDED');
    expect(report.eventCount).toBe(0);
  });

  it('verifies a legacy anchor as reconstructed rather than fully verified', () => {
    const anchor = buildSubmissionAuditEvent({
      submissionId: 'SUB-1',
      version: 4,
      from: null,
      to: 'SUBMITTED',
      note: 'Legacy anchor',
      occurredAt: '2026-10-08T15:00:04.000Z',
      previousHash: '',
      legacyAnchor: true
    });
    const report = verifySubmissionAuditChain([anchor], 'SUBMITTED', 4, anchor.eventHash);
    expect(report.status).toBe('LEGACY_RECONSTRUCTED');
    expect(report.latestVersion).toBe(4);
  });

  it('detects an audit head mismatch', () => {
    const first = event(1, null, 'DRAFT', '');
    const report = verifySubmissionAuditChain([first], 'DRAFT', 1, 'wrong-head');
    expect(report.status).toBe('INVALID');
    expect(report.errors.some(error => error.includes('audit head'))).toBe(true);
  });

  it('rejects an altered event hash', () => {
    const first = event(1, null, 'DRAFT', '');
    const altered = { ...first, eventHash: '0'.repeat(64) };
    const report = verifySubmissionAuditChain([altered], 'DRAFT', 1);
    expect(report.status).toBe('INVALID');
    expect(report.errors.some(error => error.includes('hash mismatch'))).toBe(true);
  });
});
