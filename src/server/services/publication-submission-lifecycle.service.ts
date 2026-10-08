import { adminDb } from '../../lib/firebase-admin';
import { sha256 } from './text-sha256.service';
import {
  SubmissionLifecycleEvent,
  SubmissionLifecycleStatus,
  canTransition,
  normalizeExternalReference,
  normalizeTransitionNote,
  initialSubmissionStatus
} from './publication-submission-lifecycle.policy';

export interface CreateSubmissionLifecycleInput {
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  readyToSubmit: boolean;
}

export interface SubmissionLifecycleRecord {
  id: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  currentStatus: SubmissionLifecycleStatus;
  version: number;
  events: SubmissionLifecycleEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionTransitionInput {
  to: SubmissionLifecycleStatus;
  note?: string;
  externalReference?: string;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function validFingerprint(value: string): boolean {
  return /^[a-f0-9]{64}$/u.test(value);
}

class PublicationSubmissionLifecycleService {
  private ref(userId: string) {
    return adminDb.collection('publication_submission_lifecycle').doc(userId).collection('items');
  }

  async get(userId: string, submissionId: string): Promise<SubmissionLifecycleRecord | null> {
    const snapshot = await this.ref(userId).doc(submissionId).get();
    return snapshot.exists ? snapshot.data() as SubmissionLifecycleRecord : null;
  }

  async list(userId: string, workspaceId: string, limit = 50): Promise<SubmissionLifecycleRecord[]> {
    const snapshot = await this.ref(userId).limit(100).get();
    return snapshot.docs
      .map(doc => doc.data() as SubmissionLifecycleRecord)
      .filter(item => item.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, Math.min(Math.max(limit, 1), 100));
  }

  async create(
    userId: string,
    workspaceId: string,
    input: CreateSubmissionLifecycleInput
  ): Promise<SubmissionLifecycleRecord> {
    const journalName = clean(input.journalName);
    const manuscriptType = clean(input.manuscriptType) || 'article';
    const submissionFingerprint = clean(input.submissionFingerprint);

    if (!journalName) throw new Error('Journal name is required.');
    if (!validFingerprint(submissionFingerprint)) throw new Error('Submission fingerprint is invalid.');

    const now = new Date().toISOString();
    const seed = JSON.stringify({ userId, workspaceId, submissionFingerprint, now });
    const id = 'SUB-' + sha256(seed).slice(0, 32);
    const record: SubmissionLifecycleRecord = {
      id,
      userId,
      workspaceId,
      journalName,
      manuscriptType,
      submissionFingerprint,
      currentStatus: initialSubmissionStatus(input.readyToSubmit),
      version: 1,
      events: [],
      createdAt: now,
      updatedAt: now
    };

    await this.ref(userId).doc(id).set(record);
    return record;
  }

  async markReady(
    userId: string,
    submissionId: string,
    verifiedFingerprint: string
  ): Promise<SubmissionLifecycleRecord> {
    if (!validFingerprint(verifiedFingerprint)) throw new Error('Verified submission fingerprint is invalid.');
    const reference = this.ref(userId).doc(submissionId);

    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

      const current = snapshot.data() as SubmissionLifecycleRecord;
      if (current.currentStatus !== 'DRAFT') {
        throw new Error('Only a DRAFT submission can be promoted to READY.');
      }

      const occurredAt = new Date().toISOString();
      const eventSeed = JSON.stringify({
        submissionId,
        version: current.version + 1,
        from: current.currentStatus,
        to: 'READY',
        verifiedFingerprint,
        occurredAt
      });
      const event: SubmissionLifecycleEvent = {
        id: 'SEV-' + sha256(eventSeed).slice(0, 32),
        from: 'DRAFT',
        to: 'READY',
        note: 'P14 submission integrity gate passed.',
        occurredAt
      };
      const updated: SubmissionLifecycleRecord = {
        ...current,
        submissionFingerprint: verifiedFingerprint,
        currentStatus: 'READY',
        version: current.version + 1,
        events: [...current.events, event].slice(-100),
        updatedAt: occurredAt
      };

      transaction.set(reference, updated);
      return updated;
    });
  }

  async transition(
    userId: string,
    submissionId: string,
    input: SubmissionTransitionInput
  ): Promise<SubmissionLifecycleRecord> {
    const note = normalizeTransitionNote(input.note);
    const externalReference = normalizeExternalReference(input.externalReference);
    const reference = this.ref(userId).doc(submissionId);

    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

      const current = snapshot.data() as SubmissionLifecycleRecord;
      const decision = canTransition(current.currentStatus, input.to);
      if (!decision.allowed) throw new Error(decision.reason);

      const occurredAt = new Date().toISOString();
      const eventSeed = JSON.stringify({
        submissionId,
        version: current.version + 1,
        from: current.currentStatus,
        to: input.to,
        note,
        externalReference: externalReference || '',
        occurredAt
      });
      const event: SubmissionLifecycleEvent = {
        id: 'SEV-' + sha256(eventSeed).slice(0, 32),
        from: current.currentStatus,
        to: input.to,
        note,
        externalReference,
        occurredAt
      };
      const updated: SubmissionLifecycleRecord = {
        ...current,
        currentStatus: input.to,
        version: current.version + 1,
        events: [...current.events, event].slice(-100),
        updatedAt: occurredAt
      };

      transaction.set(reference, updated);
      return updated;
    });
  }
}

export const publicationSubmissionLifecycleService = new PublicationSubmissionLifecycleService();
