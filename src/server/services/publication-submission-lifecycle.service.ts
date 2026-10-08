import { adminDb } from '../../lib/firebase-admin';
import { sha256 } from './text-sha256.service';
import { buildSubmissionReceipt } from './publication-submission-receipt.service';
import { buildSubmissionAuditEvent } from './publication-submission-audit.service';
import { buildSubmissionVersion } from './publication-submission-version.service';
import type { SubmissionVersion } from './publication-submission-version.service';
import type { SubmissionReceipt } from './publication-submission-receipt.service';
import {
  canTransition,
  normalizeExternalReference,
  normalizeTransitionNote,
  initialSubmissionStatus
} from './publication-submission-lifecycle.policy';
import type {
  SubmissionLifecycleEvent,
  SubmissionLifecycleStatus
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
  submissionReceiptId?: string;
  auditHeadHash: string;
  currentVersionId?: string;
  versionCount: number;
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

  async getReceipt(
    userId: string,
    submissionId: string,
    receiptId: string
  ): Promise<SubmissionReceipt | null> {
    const reference = this.ref(userId).doc(submissionId).collection('receipts').doc(receiptId);
    const snapshot = await reference.get();
    return snapshot.exists ? snapshot.data() as SubmissionReceipt : null;
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
    const currentStatus = initialSubmissionStatus(input.readyToSubmit);
    const initialVersion = input.readyToSubmit ? buildSubmissionVersion({
      submissionId: id,
      cycle: 1,
      kind: 'READY',
      statusAtCapture: 'READY',
      packageFingerprint: submissionFingerprint,
      capturedAt: now
    }) : null;
    const auditEvent = buildSubmissionAuditEvent({
      submissionId: id,
      version: 1,
      from: null,
      to: currentStatus,
      note: 'Submission lifecycle created.',
      occurredAt: now,
      previousHash: ''
    });
    const record: SubmissionLifecycleRecord = {
      id,
      userId,
      workspaceId,
      journalName,
      manuscriptType,
      submissionFingerprint,
      currentStatus,
      version: 1,
      events: [],
      auditHeadHash: auditEvent.eventHash,
      ...(initialVersion ? { currentVersionId: initialVersion.id } : {}),
      versionCount: initialVersion ? 1 : 0,
      createdAt: now,
      updatedAt: now
    };
    const reference = this.ref(userId).doc(id);
    const auditReference = reference.collection('audit').doc(auditEvent.id);

    await adminDb.runTransaction(async transaction => {
      transaction.create(reference, record);
      transaction.create(auditReference, auditEvent);
      if (initialVersion) transaction.create(reference.collection('versions').doc(initialVersion.id), initialVersion);
    });
    return record;
  }

  async initializeLegacyAudit(
    userId: string,
    submissionId: string
  ): Promise<SubmissionLifecycleRecord> {
    const reference = this.ref(userId).doc(submissionId);
    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

      const current = snapshot.data() as SubmissionLifecycleRecord;
      if (current.auditHeadHash) return current;

      const occurredAt = new Date().toISOString();
      const auditEvent = buildSubmissionAuditEvent({
        submissionId: current.id,
        version: current.version,
        from: null,
        to: current.currentStatus,
        note: 'P17 legacy audit anchor; prior lifecycle history is not verified.',
        occurredAt,
        previousHash: '',
        legacyAnchor: true
      });
      const updated: SubmissionLifecycleRecord = {
        ...current,
        auditHeadHash: auditEvent.eventHash,
        updatedAt: occurredAt
      };

      transaction.create(reference.collection('audit').doc(auditEvent.id), auditEvent);
      if (versionRecord) {
        transaction.create(reference.collection('versions').doc(versionRecord.id), versionRecord);
      }
      transaction.set(reference, updated);
      return updated;
    });
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
      if (!current.auditHeadHash) {
        throw new Error('Submission predates P17 audit chain and cannot be promoted safely.');
      }

      const occurredAt = new Date().toISOString();
      let versionRecord: SubmissionVersion | null = null;
      if (current.versionCount === 0 || current.submissionFingerprint !== verifiedFingerprint) {
        versionRecord = buildSubmissionVersion({
          submissionId: current.id,
          cycle: current.versionCount + 1,
          kind: 'READY',
          statusAtCapture: 'READY',
          packageFingerprint: verifiedFingerprint,
          previousFingerprint: current.versionCount > 0 ? current.submissionFingerprint : undefined,
          note: 'P14 submission integrity gate passed.',
          capturedAt: occurredAt
        });
      }
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
      const auditEvent = buildSubmissionAuditEvent({
        submissionId: current.id,
        version: current.version + 1,
        from: current.currentStatus,
        to: 'READY',
        note: 'P14 submission integrity gate passed.',
        occurredAt,
        previousHash: current.auditHeadHash
      });
      const updated: SubmissionLifecycleRecord = {
        ...current,
        submissionFingerprint: verifiedFingerprint,
        currentStatus: 'READY',
        version: current.version + 1,
        events: [...current.events, event].slice(-100),
        auditHeadHash: auditEvent.eventHash,
        ...(versionRecord ? {
          currentVersionId: versionRecord.id,
          versionCount: current.versionCount + 1
        } : {}),
        updatedAt: occurredAt
      };

      transaction.create(reference.collection('audit').doc(auditEvent.id), auditEvent);
      transaction.set(reference, updated);
      return updated;
    });
  }

  async submit(
    userId: string,
    submissionId: string,
    submissionFingerprint: string,
    input: { note?: string; externalReference?: string }
  ): Promise<SubmissionLifecycleRecord> {
    if (!validFingerprint(submissionFingerprint)) {
      throw new Error('Submission fingerprint is invalid.');
    }
    const note = normalizeTransitionNote(input.note);
    const externalReference = normalizeExternalReference(input.externalReference);
    if (!note && !externalReference) {
      throw new Error('A submission note or external reference is required.');
    }
    const reference = this.ref(userId).doc(submissionId);
    const receiptCollection = reference.collection('receipts');

    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

      const current = snapshot.data() as SubmissionLifecycleRecord;
      if (current.currentStatus !== 'READY') {
        throw new Error('Only a READY submission can be submitted.');
      }
      if (!current.auditHeadHash) {
        throw new Error('Submission predates P17 audit chain and cannot be submitted safely.');
      }
      if (current.submissionFingerprint !== submissionFingerprint) {
        throw new Error('Submission fingerprint does not match the READY package.');
      }

      const submittedAt = new Date().toISOString();
      const receipt = buildSubmissionReceipt({
        submissionId: current.id,
        userId,
        workspaceId: current.workspaceId,
        journalName: current.journalName,
        manuscriptType: current.manuscriptType,
        submissionFingerprint,
        note,
        externalReference,
        submittedAt
      });
      const event: SubmissionLifecycleEvent = {
        id: 'SEV-' + sha256(JSON.stringify({
          submissionId,
          version: current.version + 1,
          from: current.currentStatus,
          to: 'SUBMITTED',
          receiptId: receipt.id,
          submittedAt
        })).slice(0, 32),
        from: 'READY',
        to: 'SUBMITTED',
        note: note || 'Submission recorded.',
        ...(externalReference ? { externalReference } : {}),
        occurredAt: submittedAt
      };
      const auditEvent = buildSubmissionAuditEvent({
        submissionId: current.id,
        version: current.version + 1,
        from: current.currentStatus,
        to: 'SUBMITTED',
        note: note || 'Submission recorded.',
        externalReference,
        receiptId: receipt.id,
        occurredAt: submittedAt,
        previousHash: current.auditHeadHash
      });
      const updated: SubmissionLifecycleRecord = {
        ...current,
        currentStatus: 'SUBMITTED',
        submissionReceiptId: receipt.id,
        version: current.version + 1,
        events: [...current.events, event].slice(-100),
        auditHeadHash: auditEvent.eventHash,
        updatedAt: submittedAt
      };

      transaction.create(receiptCollection.doc(receipt.id), receipt);
      transaction.create(reference.collection('audit').doc(auditEvent.id), auditEvent);
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
    if (input.to === 'SUBMITTED' && !note && !externalReference) {
      throw new Error('A submission note or external reference is required for SUBMITTED status.');
    }
    const reference = this.ref(userId).doc(submissionId);

    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');

      const current = snapshot.data() as SubmissionLifecycleRecord;
      if (!current.auditHeadHash) {
        throw new Error('Submission predates P17 audit chain and cannot transition safely.');
      }
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
        ...(externalReference ? { externalReference } : {}),
        occurredAt
      };
      const auditEvent = buildSubmissionAuditEvent({
        submissionId: current.id,
        version: current.version + 1,
        from: current.currentStatus,
        to: input.to,
        note,
        externalReference,
        occurredAt,
        previousHash: current.auditHeadHash
      });
      const updated: SubmissionLifecycleRecord = {
        ...current,
        currentStatus: input.to,
        version: current.version + 1,
        events: [...current.events, event].slice(-100),
        auditHeadHash: auditEvent.eventHash,
        updatedAt: occurredAt
      };

      transaction.create(reference.collection('audit').doc(auditEvent.id), auditEvent);
      transaction.set(reference, updated);
      return updated;
    });
  }
}

export const publicationSubmissionLifecycleService = new PublicationSubmissionLifecycleService();
