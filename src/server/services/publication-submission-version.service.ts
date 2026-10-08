import { adminDb } from '../../lib/firebase-admin';
import { sha256 } from './text-sha256.service';
import type { SubmissionLifecycleStatus } from './publication-submission-lifecycle.policy';

export type SubmissionVersionKind = 'READY' | 'RESUBMISSION';

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  cycle: number;
  kind: SubmissionVersionKind;
  statusAtCapture: SubmissionLifecycleStatus;
  packageFingerprint: string;
  previousFingerprint?: string;
  note: string;
  externalReference?: string;
  capturedAt: string;
  immutableHash: string;
}

export interface SubmissionVersionInput {
  submissionId: string;
  cycle: number;
  kind: SubmissionVersionKind;
  statusAtCapture: SubmissionLifecycleStatus;
  packageFingerprint: string;
  previousFingerprint?: string;
  note?: string;
  externalReference?: string;
  capturedAt: string;
}

export interface SubmissionVersionReport {
  status: 'VERIFIED' | 'INVALID' | 'EMPTY';
  versionCount: number;
  latestCycle: number;
  latestFingerprint: string;
  errors: string[];
}

const FINGERPRINT = /^[a-f0-9]{64}$/u;

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

export function buildSubmissionVersion(input: SubmissionVersionInput): SubmissionVersion {
  const submissionId = clean(input.submissionId);
  const packageFingerprint = clean(input.packageFingerprint);
  const previousFingerprint = clean(input.previousFingerprint);
  const note = clean(input.note);
  const externalReference = clean(input.externalReference);
  const capturedAt = clean(input.capturedAt);
  if (!submissionId || !capturedAt) throw new Error('Submission version identity is incomplete.');
  if (!FINGERPRINT.test(packageFingerprint)) throw new Error('Submission version fingerprint is invalid.');
  if (input.cycle < 1 || !Number.isInteger(input.cycle)) throw new Error('Submission version cycle is invalid.');
  if (previousFingerprint && !FINGERPRINT.test(previousFingerprint)) throw new Error('Previous submission fingerprint is invalid.');

  const canonical = JSON.stringify({
    submissionId,
    cycle: input.cycle,
    kind: input.kind,
    statusAtCapture: input.statusAtCapture,
    packageFingerprint,
    previousFingerprint,
    note,
    externalReference,
    capturedAt
  });
  const immutableHash = sha256(canonical);
  return {
    id: 'VER-' + immutableHash.slice(0, 32),
    submissionId,
    cycle: input.cycle,
    kind: input.kind,
    statusAtCapture: input.statusAtCapture,
    packageFingerprint,
    ...(previousFingerprint ? { previousFingerprint } : {}),
    note,
    ...(externalReference ? { externalReference } : {}),
    capturedAt,
    immutableHash
  };
}

export async function listSubmissionVersions(userId: string, submissionId: string): Promise<SubmissionVersion[]> {
  const snapshot = await adminDb.collection('publication_submission_lifecycle').doc(userId)
    .collection('items').doc(submissionId).collection('versions').orderBy('cycle').limit(100).get();
  return snapshot.docs.map(doc => doc.data() as SubmissionVersion);
}

function verifyVersion(version: SubmissionVersion, expectedCycle: number, previousFingerprint = ''): string[] {
  const errors: string[] = [];
  if (version.cycle !== expectedCycle) errors.push(`Version cycle mismatch at ${version.id}.`);
  if (version.previousFingerprint !== (previousFingerprint || undefined)) {
    errors.push(`Version fingerprint chain break at ${version.id}.`);
  }
  try {
    const rebuilt = buildSubmissionVersion({
      submissionId: version.submissionId,
      cycle: version.cycle,
      kind: version.kind,
      statusAtCapture: version.statusAtCapture,
      packageFingerprint: version.packageFingerprint,
      previousFingerprint: version.previousFingerprint,
      note: version.note,
      externalReference: version.externalReference,
      capturedAt: version.capturedAt
    });
    if (rebuilt.id !== version.id || rebuilt.immutableHash !== version.immutableHash) {
      errors.push(`Version hash mismatch at ${version.id}.`);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : `Invalid version ${version.id}.`);
  }
  return errors;
}

export function verifySubmissionVersionChain(versions: SubmissionVersion[]): SubmissionVersionReport {
  if (!versions.length) return { status: 'EMPTY', versionCount: 0, latestCycle: 0, latestFingerprint: '', errors: [] };
  const ordered = [...versions].sort((a, b) => a.cycle - b.cycle);
  const errors: string[] = [];
  let previousFingerprint = '';
  ordered.forEach((version, index) => {
    errors.push(...verifyVersion(version, index + 1, previousFingerprint));
    previousFingerprint = version.packageFingerprint;
  });
  const latest = ordered.at(-1)!;
  return {
    status: errors.length ? 'INVALID' : 'VERIFIED',
    versionCount: ordered.length,
    latestCycle: latest.cycle,
    latestFingerprint: latest.packageFingerprint,
    errors
  };
}