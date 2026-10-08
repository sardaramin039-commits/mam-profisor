import { sha256 } from './text-sha256.service';

export interface SubmissionReceiptInput {
  submissionId: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
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
  note: string;
  externalReference?: string;
  submittedAt: string;
  immutableHash: string;
}

const FINGERPRINT = /^[a-f0-9]{64}$/u;

function clean(value: unknown): string {
  return String(value ?? '').trim();
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
    note,
    ...(externalReference ? { externalReference } : {}),
    submittedAt,
    immutableHash
  };
}