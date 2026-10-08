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
  immutableHash: string;
}

const FINGERPRINT = /^[a-f0-9]{64}$/u;

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function receiptCanonical(receipt: SubmissionReceipt): string {
  return JSON.stringify({
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
  });
}

export interface SubmissionReceiptVerification {
  status: 'VERIFIED' | 'INVALID';
  expectedHash: string;
  errors: string[];
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
    errors
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
    submittedAt
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
    immutableHash
  };
}