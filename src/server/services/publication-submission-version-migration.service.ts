import { adminDb } from '../../lib/firebase-admin';
import { buildSubmissionVersion } from './publication-submission-version.service';
import type { SubmissionVersion } from './publication-submission-version.service';

interface LegacyLifecycleRecord {
  id: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  currentStatus: 'DRAFT' | 'READY' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'RESUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  version?: number;
  versionCount?: number;
  currentVersionId?: string;
  auditHeadHash?: string;
  events?: unknown[];
  submissionReceiptId?: string;
  createdAt: string;
  updatedAt: string;
}

const fingerprint = /^[a-f0-9]{64}$/u;

function ref(userId: string, submissionId: string) {
  return adminDb.collection('publication_submission_lifecycle').doc(userId).collection('items').doc(submissionId);
}

export async function initializeLegacySubmissionVersion(
  userId: string,
  submissionId: string
): Promise<LegacyLifecycleRecord> {
  const reference = ref(userId, submissionId);
  return adminDb.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

    const current = snapshot.data() as LegacyLifecycleRecord;
    const currentVersionCount = Number.isInteger(current.versionCount) ? (current.versionCount as number) : 0;
    if (current.currentVersionId && currentVersionCount > 0) {
      return current;
    }
    if (current.currentStatus === 'DRAFT') {
      throw new Error('DRAFT submission has no verified publication version to migrate.');
    }
    if (!fingerprint.test(current.submissionFingerprint)) {
      throw new Error('Legacy submission fingerprint is invalid.');
    }

    const capturedAt = new Date().toISOString();
    const versionRecord: SubmissionVersion = buildSubmissionVersion({
      submissionId: current.id,
      cycle: 1,
      kind: 'LEGACY_READY',
      statusAtCapture: 'READY',
      packageFingerprint: current.submissionFingerprint,
      note: 'P18 legacy version anchor; original P15 manuscript payload was not stored here.',
      capturedAt
    });

    const updated: LegacyLifecycleRecord = {
      ...current,
      currentVersionId: versionRecord.id,
      versionCount: 1,
      updatedAt: capturedAt
    };
    transaction.create(reference.collection('versions').doc(versionRecord.id), versionRecord);
    transaction.set(reference, updated);
    return updated;
  });
}
