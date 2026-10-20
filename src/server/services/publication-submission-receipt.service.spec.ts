import { describe, expect, it } from 'vitest';
import { sha256 } from './text-sha256.service';
import {
  buildSubmissionReceipt,
  verifySubmissionReceipt
} from './publication-submission-receipt.service';

const base = {
  submissionId: 'SUB-1',
  userId: 'USER-1',
  workspaceId: 'WS-1',
  journalName: 'Test Journal',
  manuscriptType: 'article',
  submissionFingerprint: 'a'.repeat(64),
  note: 'User reports submitting through the journal portal.',
  externalReference: 'EXT-123',
  submittedAt: '2026-10-08T15:00:00.000Z'
};

describe('P16 immutable submission receipt', () => {
  it('creates a deterministic receipt with a 64-character hash', () => {
    const first = buildSubmissionReceipt(base);
    const second = buildSubmissionReceipt(base);
    expect(first.id).toBe(second.id);
    expect(first.immutableHash).toHaveLength(64);
    expect(first.immutableHash).toBe(second.immutableHash);
  });

  it('changes the immutable hash when receipt evidence changes', () => {
    const first = buildSubmissionReceipt(base);
    const changed = buildSubmissionReceipt({ ...base, externalReference: 'EXT-456' });
    expect(first.immutableHash).not.toBe(changed.immutableHash);
  });

  it('binds the receipt hash to the submission version id', () => {
    const first = buildSubmissionReceipt({ ...base, submissionVersionId: 'VER-1' });
    const changed = buildSubmissionReceipt({ ...base, submissionVersionId: 'VER-2' });
    expect(first.submissionVersionId).toBe('VER-1');
    expect(first.immutableHash).not.toBe(changed.immutableHash);
  });

  it('rejects a receipt without submission evidence', () => {
    expect(() => buildSubmissionReceipt({ ...base, note: '', externalReference: '' }))
      .toThrow('requires a note or external reference');
  });

  it('rejects malformed fingerprints', () => {
    expect(() => buildSubmissionReceipt({ ...base, submissionFingerprint: 'bad' }))
      .toThrow('fingerprint is invalid');
  });

  it('verifies an untampered receipt and its submission binding', () => {
    const receipt = buildSubmissionReceipt({
      ...base,
      submissionVersionId: 'VER-1'
    });
    const result = verifySubmissionReceipt(receipt, {
      submissionId: 'SUB-1',
      workspaceId: 'WS-1',
      submissionFingerprint: base.submissionFingerprint,
      submissionVersionId: 'VER-1'
    });
    expect(result.status).toBe('VERIFIED');
    expect(result.errors).toHaveLength(0);
  });

  it('marks new receipts as user-reported and never as externally verified', () => {
    const receipt = buildSubmissionReceipt(base);
    const verification = verifySubmissionReceipt(receipt);
    expect(receipt.receiptVersion).toBe(2);
    expect(receipt.submissionConfirmation).toBe('USER_REPORTED_UNVERIFIED');
    expect(verification.status).toBe('VERIFIED');
    expect(verification.verificationScope).toBe('INTERNAL_RECEIPT_INTEGRITY_ONLY');
    expect(verification.externalSubmissionVerified).toBe(false);
    expect(verification.submissionConfirmation).toBe('USER_REPORTED_UNVERIFIED');
  });

  it('rejects a modified submission-confirmation scope', () => {
    const receipt = buildSubmissionReceipt(base);
    const result = verifySubmissionReceipt({
      ...receipt,
      submissionConfirmation: 'EXTERNALLY_CONFIRMED' as never
    });
    expect(result.status).toBe('INVALID');
    expect(result.externalSubmissionVerified).toBe(false);
    expect(result.errors.some(error => error.includes('hash mismatch'))).toBe(true);
    expect(result.errors.some(error => error.includes('confirmation scope'))).toBe(true);
  });

  it('continues to verify a legacy receipt with its original hash format', () => {
    const legacyCanonical = JSON.stringify({
      submissionId: base.submissionId,
      userId: base.userId,
      workspaceId: base.workspaceId,
      journalName: base.journalName,
      manuscriptType: base.manuscriptType,
      submissionFingerprint: base.submissionFingerprint,
      submissionVersionId: '',
      note: base.note,
      externalReference: base.externalReference,
      submittedAt: base.submittedAt
    });
    const hash = sha256(legacyCanonical);
    const legacyReceipt = {
      id: 'REC-' + hash.slice(0, 32),
      ...base,
      immutableHash: hash
    };
    const result = verifySubmissionReceipt(legacyReceipt);
    expect(result.status).toBe('VERIFIED');
    expect(result.submissionConfirmation).toBe('LEGACY_CONFIRMATION_SCOPE_UNKNOWN');
    expect(result.externalSubmissionVerified).toBe(false);
  });

  it('rejects a tampered receipt hash', () => {
    const receipt = buildSubmissionReceipt(base);
    const result = verifySubmissionReceipt({
      ...receipt,
      note: 'tampered'
    });
    expect(result.status).toBe('INVALID');
    expect(result.errors.some(error => error.includes('hash mismatch'))).toBe(true);
  });
});
