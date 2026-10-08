import { adminDb } from '../../lib/firebase-admin';
import { sha256 } from './text-sha256.service';
import type { SubmissionLifecycleStatus } from './publication-submission-lifecycle.policy';

export interface SubmissionAuditEvent {
  id: string;
  submissionId: string;
  version: number;
  from: SubmissionLifecycleStatus | null;
  to: SubmissionLifecycleStatus;
  note: string;
  externalReference?: string;
  receiptId?: string;
  occurredAt: string;
  previousHash: string;
  eventHash: string;
  legacyAnchor?: boolean;
}

export type SubmissionAuditStatus = 'VERIFIED' | 'INVALID' | 'LEGACY_UNSEEDED';

export interface SubmissionAuditReport {
  status: SubmissionAuditStatus;
  eventCount: number;
  latestVersion: number;
  latestHash: string;
  errors: string[];
}

export interface BuildSubmissionAuditEventInput {
  submissionId: string;
  version: number;
  from: SubmissionLifecycleStatus | null;
  to: SubmissionLifecycleStatus;
  note: string;
  externalReference?: string;
  receiptId?: string;
  occurredAt: string;
  previousHash: string;
  legacyAnchor?: boolean;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function eventPayload(input: BuildSubmissionAuditEventInput): string {
  return JSON.stringify({
    submissionId: clean(input.submissionId),
    version: input.version,
    from: input.from ?? null,
    to: input.to,
    note: clean(input.note),
    externalReference: clean(input.externalReference),
    receiptId: clean(input.receiptId),
    occurredAt: clean(input.occurredAt),
    previousHash: clean(input.previousHash),
    legacyAnchor: input.legacyAnchor === true
  });
}

export function buildSubmissionAuditEvent(input: BuildSubmissionAuditEventInput): SubmissionAuditEvent {
  if (input.version < 1 || !Number.isInteger(input.version)) throw new Error('Audit version is invalid.');
  if (!clean(input.submissionId) || !clean(input.occurredAt)) throw new Error('Audit identity is incomplete.');
  if (input.from === null && !input.legacyAnchor && input.version !== 1) {
    throw new Error('Only the first audit event may have a null previous status.');
  }

  const eventHash = sha256(eventPayload(input));
  return {
    id: 'AUD-' + eventHash.slice(0, 32),
    submissionId: clean(input.submissionId),
    version: input.version,
    from: input.from,
    to: input.to,
    note: clean(input.note),
    ...(input.externalReference ? { externalReference: clean(input.externalReference) } : {}),
    ...(input.receiptId ? { receiptId: clean(input.receiptId) } : {}),
    occurredAt: clean(input.occurredAt),
    previousHash: clean(input.previousHash),
    eventHash,
    ...(input.legacyAnchor ? { legacyAnchor: true } : {})
  };
}

function verifyEvent(event: SubmissionAuditEvent, expectedPreviousHash: string, expectedVersion: number): string | null {
  if (event.version !== expectedVersion) return `Audit version mismatch at ${event.id}.`;
  if (event.previousHash !== expectedPreviousHash) return `Audit hash-chain break at ${event.id}.`;
  const expected = buildSubmissionAuditEvent({
    submissionId: event.submissionId,
    version: event.version,
    from: event.from,
    to: event.to,
    note: event.note,
    externalReference: event.externalReference,
    receiptId: event.receiptId,
    occurredAt: event.occurredAt,
    previousHash: event.previousHash,
    legacyAnchor: event.legacyAnchor
  });
  return expected.eventHash === event.eventHash ? null : `Audit event hash mismatch at ${event.id}.`;
}

export function verifySubmissionAuditChain(
  events: SubmissionAuditEvent[],
  currentStatus: SubmissionLifecycleStatus,
  currentVersion: number,
  expectedHeadHash = ''
): SubmissionAuditReport {
  if (!events.length) {
    return { status: 'LEGACY_UNSEEDED', eventCount: 0, latestVersion: 0, latestHash: '', errors: ['No immutable audit events exist for this submission.'] };
  }
  const ordered = [...events].sort((a, b) => a.version - b.version);
  const errors: string[] = [];
  let previousHash = '';
  let previousStatus: SubmissionLifecycleStatus | null = null;
  ordered.forEach((event, index) => {
    const expectedVersion = index + 1;
    const error = verifyEvent(event, previousHash, expectedVersion);
    if (error) errors.push(error);
    if (index === 0 && event.from !== null) errors.push('The first audit event must start from null.');
    if (index > 0 && event.from !== previousStatus) errors.push(`Audit state mismatch at version ${event.version}.`);
    previousHash = event.eventHash;
    previousStatus = event.to;
  });
  if (ordered.at(-1)?.to !== currentStatus) errors.push('Latest audit state does not match the lifecycle record.');
  if (ordered.at(-1)?.version !== currentVersion) errors.push('Latest audit version does not match the lifecycle record.');
  if (expectedHeadHash && ordered.at(-1)?.eventHash !== expectedHeadHash) {
    errors.push('Latest audit hash does not match the lifecycle audit head.');
  }
  const legacyOnly = ordered.length === 1 && ordered[0].legacyAnchor === true;
  return {
    status: errors.length ? 'INVALID' : legacyOnly ? 'LEGACY_UNSEEDED' : 'VERIFIED',
    eventCount: ordered.length,
    latestVersion: ordered.at(-1)?.version ?? 0,
    latestHash: ordered.at(-1)?.eventHash ?? '',
    errors
  };
}

export async function listSubmissionAuditEvents(userId: string, submissionId: string): Promise<SubmissionAuditEvent[]> {
  const snapshot = await adminDb.collection('publication_submission_lifecycle').doc(userId)
    .collection('items').doc(submissionId).collection('audit').orderBy('version').limit(500).get();
  return snapshot.docs.map(doc => doc.data() as SubmissionAuditEvent);
}