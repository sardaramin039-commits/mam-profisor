import { sha256 } from './text-sha256.service';

export interface SubmissionReceiptInput {
  submissionId: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  submissionVersionId?: string;
  note?: string;
  externalReference?: string;
  submittedAt: string;
}

export interface SubmissionReceipt {
  id: string;
  submissionId: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  submissionVersionId?: string;
  note: string;
  externalReference?: string;
  submittedAt: string;
  /** Version 2 explicitly identifies this as a user-reported internal receipt, not journal confirmation. */
  receiptVersion?: 2;
  submissionConfirmation?: 'USER_REPORTED_UNVERIFIED';
  immutableHash: string;
}

const FINGERPRINT = /^[a-f0-9]{64}$/u;

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function receiptCanonical(receipt: SubmissionReceipt): string {
  const canonical = {
    submissionId: clean(receipt.submissionId),
    userId: clean(receipt.userId),
    workspaceId: clean(receipt.workspaceId),
    journalName: clean(receipt.journalName),
    manuscriptType: clean(receipt.manuscriptType) || 'article',
    submissionFingerprint: clean(receipt.submissionFingerprint),
    submissionVersionId: clean(receipt.submissionVersionId),
    note: clean(receipt.note),
    externalReference: clean(receipt.externalReference),
    submittedAt: clean(receipt.submittedAt)
  };
  // Preserve old receipt hashes; only explicitly versioned receipts use the v2 fields.
  return receipt.receiptVersion === 2
    ? JSON.stringify({
        ...canonical,
        receiptVersion: receipt.receiptVersion,
        submissionConfirmation: receipt.submissionConfirmation
      })
    : JSON.stringify(canonical);
}

export interface SubmissionReceiptVerification {
  status: 'VERIFIED' | 'INVALID';
  expectedHash: string;
  errors: string[];
  verificationScope: 'INTERNAL_RECEIPT_INTEGRITY_ONLY';
  externalSubmissionVerified: false;
  submissionConfirmation: 'USER_REPORTED_UNVERIFIED' | 'LEGACY_CONFIRMATION_SCOPE_UNKNOWN';
}

export function verifySubmissionReceipt(
  receipt: SubmissionReceipt,
  expected?: {
    submissionId?: string;
    workspaceId?: string;
    submissionFingerprint?: string;
    submissionVersionId?: string;
    userId?: string;
  }
): SubmissionReceiptVerification {
  const errors: string[] = [];
  const expectedHash = sha256(receiptCanonical(receipt));
  const expectedId = 'REC-' + expectedHash.slice(0, 32);
  if (expectedHash !== receipt.immutableHash) {
    errors.push('Submission receipt immutable hash mismatch.');
  }
  if (expectedId !== clean(receipt.id)) {
    errors.push('Submission receipt id does not match its immutable hash.');
  }
  if (receipt.receiptVersion !== undefined && receipt.receiptVersion !== 2) {
    errors.push('Submission receipt version is unsupported.');
  }
  if (receipt.receiptVersion === 2 &&
      receipt.submissionConfirmation !== 'USER_REPORTED_UNVERIFIED') {
    errors.push('Submission receipt confirmation scope is invalid.');
  }

  const checks: Array<[string, string | undefined]> = [
    ['submissionId', expected?.submissionId],
    ['userId', expected?.userId],
    ['workspaceId', expected?.workspaceId],
    ['submissionFingerprint', expected?.submissionFingerprint],
    ['submissionVersionId', expected?.submissionVersionId]
  ];
  for (const [field, value] of checks) {
    if (value !== undefined && clean(receipt[field as keyof SubmissionReceipt]) !== clean(value)) {
      errors.push(`Submission receipt ${field} binding mismatch.`);
    }
  }

  return {
    status: errors.length ? 'INVALID' : 'VERIFIED',
    expectedHash,
    errors,
    verificationScope: 'INTERNAL_RECEIPT_INTEGRITY_ONLY',
    externalSubmissionVerified: false,
    submissionConfirmation: receipt.receiptVersion === 2
      ? 'USER_REPORTED_UNVERIFIED'
      : 'LEGACY_CONFIRMATION_SCOPE_UNKNOWN'
  };
}

export function buildSubmissionReceipt(input: SubmissionReceiptInput): SubmissionReceipt {
  const submissionId = clean(input.submissionId);
  const userId = clean(input.userId);
  const workspaceId = clean(input.workspaceId);
  const journalName = clean(input.journalName);
  const manuscriptType = clean(input.manuscriptType) || 'article';
  const submissionFingerprint = clean(input.submissionFingerprint);
  const note = clean(input.note);
  const externalReference = clean(input.externalReference);
  const submittedAt = clean(input.submittedAt);

  if (!submissionId || !userId || !workspaceId || !journalName) {
    throw new Error('Submission receipt identity is incomplete.');
  }
  if (!FINGERPRINT.test(submissionFingerprint)) {
    throw new Error('Submission receipt fingerprint is invalid.');
  }
  if (!submittedAt) throw new Error('Submission receipt timestamp is required.');
  if (!note && !externalReference) {
    throw new Error('Submission receipt requires a note or external reference.');
  }

  const receiptVersion = 2 as const;
  const submissionConfirmation = 'USER_REPORTED_UNVERIFIED' as const;
  const canonical = JSON.stringify({
    submissionId,
    userId,
    workspaceId,
    journalName,
    manuscriptType,
    submissionFingerprint,
    submissionVersionId: clean(input.submissionVersionId),
    note,
    externalReference,
    submittedAt,
    receiptVersion,
    submissionConfirmation
  });
  const immutableHash = sha256(canonical);
  return {
    id: 'REC-' + immutableHash.slice(0, 32),
    submissionId,
    userId,
    workspaceId,
    journalName,
    manuscriptType,
    submissionFingerprint,
    ...(input.submissionVersionId ? { submissionVersionId: clean(input.submissionVersionId) } : {}),
    note,
    ...(externalReference ? { externalReference } : {}),
    submittedAt,
    receiptVersion,
    submissionConfirmation,
    immutableHash
  };
}