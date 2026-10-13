import { adminDb } from '../../lib/firebase-admin';
import { submissionMemoryStore } from './publication-submission-memory-store';
import { sha256 } from './text-sha256.service';
import type { PublicationSubmissionPolicy, PublicationSubmissionPackage } from './publication-submission.service';
import type { SubmissionIntegrityReport } from './publication-submission-integrity.service';

export interface SubmissionManifestInput {
  submissionId: string;
  userId: string;
  workspaceId: string;
  policy: PublicationSubmissionPolicy;
  package: PublicationSubmissionPackage;
  integrity: SubmissionIntegrityReport;
  versionId: string;
  auditHeadHash: string;
  capturedAt: string;
}

export interface SubmissionManifest {
  id: string;
  submissionId: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  policy: PublicationSubmissionPolicy;
  policyFingerprint: string;
  packageFingerprint: string;
  manuscriptFingerprint: string;
  integrityFingerprint: string;
  integrityStatus: SubmissionIntegrityReport['status'];
  versionId: string;
  auditHeadHash: string;
  wordCount: number;
  abstractWordCount: number;
  keywordCount: number;
  referenceCount: number;
  capturedAt: string;
  immutableHash: string;
}

export interface SubmissionManifestVerification {
  status: 'VERIFIED' | 'INVALID';
  errors: string[];
  immutableHash: string;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function sortedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortedValue(item)]));
  }
  return value;
}

function canonical(value: unknown): string {
  return JSON.stringify(sortedValue(value));
}

function validHash(value: string): boolean {
  return /^[a-f0-9]{64}$/u.test(value);
}

export function submissionPolicyFingerprint(policy: PublicationSubmissionPolicy): string {
  return sha256(canonical(policy));
}

export function buildSubmissionManifest(input: SubmissionManifestInput): SubmissionManifest {
  const submissionId = clean(input.submissionId);
  const userId = clean(input.userId);
  const workspaceId = clean(input.workspaceId);
  const journalName = clean(input.package.journalName);
  const manuscriptType = clean(input.package.manuscriptType) || 'article';
  const versionId = clean(input.versionId);
  const auditHeadHash = clean(input.auditHeadHash);
  const capturedAt = clean(input.capturedAt);

  if (!submissionId || !userId || !workspaceId || !journalName || !versionId || !capturedAt) {
    throw new Error('Submission manifest identity is incomplete.');
  }
  if (!validHash(input.package.fingerprint) || !validHash(input.package.mainManuscript.integrity.fingerprint)) {
    throw new Error('Submission manifest package fingerprint is invalid.');
  }
  if (!validHash(input.integrity.fingerprint) || !validHash(auditHeadHash)) {
    throw new Error('Submission manifest integrity hash is invalid.');
  }
  if (!input.integrity.readyToSubmit || input.integrity.status !== 'READY') {
    throw new Error('Only a READY integrity package can be frozen into a manifest.');
  }

  const policyFingerprint = submissionPolicyFingerprint(input.policy);
  const payload = {
    submissionId, userId, workspaceId, journalName, manuscriptType,
    policyFingerprint, packageFingerprint: input.package.fingerprint,
    manuscriptFingerprint: input.package.mainManuscript.integrity.fingerprint,
    integrityFingerprint: input.integrity.fingerprint, versionId, auditHeadHash,
    wordCount: input.package.wordCount, abstractWordCount: input.package.abstractWordCount,
    keywordCount: input.package.keywordCount, referenceCount: input.package.referenceCount, capturedAt
  };
  const immutableHash = sha256(canonical(payload));
  return {
    id: 'MAN-' + immutableHash.slice(0, 32),
    submissionId, userId, workspaceId, journalName, manuscriptType,
    policy: input.policy, policyFingerprint, packageFingerprint: input.package.fingerprint,
    manuscriptFingerprint: input.package.mainManuscript.integrity.fingerprint,
    integrityFingerprint: input.integrity.fingerprint, integrityStatus: input.integrity.status,
    versionId, auditHeadHash, wordCount: input.package.wordCount,
    abstractWordCount: input.package.abstractWordCount, keywordCount: input.package.keywordCount,
    referenceCount: input.package.referenceCount, capturedAt, immutableHash
  };
}

export function verifySubmissionManifest(manifest: SubmissionManifest): SubmissionManifestVerification {
  const errors: string[] = [];
  const policyFingerprint = submissionPolicyFingerprint(manifest.policy);
  if (policyFingerprint !== manifest.policyFingerprint) errors.push('Policy fingerprint mismatch.');
  const payload = {
    submissionId: manifest.submissionId, userId: manifest.userId, workspaceId: manifest.workspaceId,
    journalName: manifest.journalName, manuscriptType: manifest.manuscriptType,
    policyFingerprint, packageFingerprint: manifest.packageFingerprint,
    manuscriptFingerprint: manifest.manuscriptFingerprint, integrityFingerprint: manifest.integrityFingerprint,
    versionId: manifest.versionId, auditHeadHash: manifest.auditHeadHash,
    wordCount: manifest.wordCount, abstractWordCount: manifest.abstractWordCount,
    keywordCount: manifest.keywordCount, referenceCount: manifest.referenceCount, capturedAt: manifest.capturedAt
  };
  const immutableHash = sha256(canonical(payload));
  const expectedId = 'MAN-' + immutableHash.slice(0, 32);
  if (immutableHash !== manifest.immutableHash) errors.push('Manifest immutable hash mismatch.');
  if (clean(manifest.id) !== expectedId) errors.push('Manifest id does not match its immutable hash.');
  return { status: errors.length ? 'INVALID' : 'VERIFIED', errors, immutableHash };
}

function ref(userId: string, workspaceId: string) {
  return adminDb.collection('publication_submission_manifests').doc(userId).collection('items').where('workspaceId', '==', workspaceId);
}

export async function saveSubmissionManifest(manifest: SubmissionManifest): Promise<void> {
  const reference = adminDb.collection('publication_submission_manifests').doc(manifest.userId)
    .collection('items').doc(manifest.id);

  try {
    await reference.create(manifest);
    submissionMemoryStore.saveManifest(manifest);
    return;
  } catch (error: unknown) {
    const code = error && typeof error === 'object'
      ? String((error as { code?: unknown }).code ?? '')
      : '';
    if (!['6', 'already-exists', 'ALREADY_EXISTS'].includes(code)) throw error;

    // Deterministic IDs make retries idempotent only when the stored immutable
    // manifest matches. Never treat an in-memory copy as a durable submission receipt.
    const snapshot = await reference.get();
    if (!snapshot.exists) throw error;
    const existing = snapshot.data() as SubmissionManifest;
    const verification = verifySubmissionManifest(existing);
    if (verification.status !== 'VERIFIED' || existing.immutableHash !== manifest.immutableHash) {
      throw new Error('An immutable manifest with this ID already exists but does not match.');
    }
    submissionMemoryStore.saveManifest(existing);
  }
}

export async function listSubmissionManifests(userId: string, workspaceId: string, limit = 50): Promise<SubmissionManifest[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 100) : 50;
  const snapshot = await ref(userId, workspaceId).limit(safeLimit).get();
  const items = snapshot.docs.map(doc => doc.data() as SubmissionManifest)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  for (const item of items) submissionMemoryStore.saveManifest(item);
  return items;
}

export async function getSubmissionManifest(userId: string, manifestId: string): Promise<SubmissionManifest | null> {
  const snapshot = await adminDb.collection('publication_submission_manifests').doc(userId)
    .collection('items').doc(manifestId).get();
  if (!snapshot.exists) return null;
  const item = snapshot.data() as SubmissionManifest;
  submissionMemoryStore.saveManifest(item);
  return item;
}