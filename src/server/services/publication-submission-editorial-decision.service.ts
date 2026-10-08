import { adminDb } from '../../lib/firebase-admin';
import { sha256 } from './text-sha256.service';
import { buildSubmissionAuditEvent } from './publication-submission-audit.service';
import type { SubmissionReceipt } from './publication-submission-receipt.service';
import { canTransition } from './publication-submission-lifecycle.policy';
import { publicationSubmissionLifecycleService } from './publication-submission-lifecycle.service';
import type { SubmissionLifecycleRecord, SubmissionLifecycleStatus } from './publication-submission-lifecycle.service';
export type EditorialDecisionType = 'MINOR_REVISION' | 'MAJOR_REVISION' | 'ACCEPT' | 'REJECT' | 'WITHDRAW';
import {
  computeRevisionPlanStatus,
  requiredRevisionTasksComplete,
  revisionPlanHash,
  verifyRevisionPlan
} from './publication-submission-revision.policy';
import type { RevisionPlan, RevisionScope, RevisionTask, RevisionTaskStatus } from './publication-submission-revision.policy';
export interface EditorialDecision {
  id: string;
  submissionId: string;
  userId: string;
  workspaceId: string;
  decisionType: EditorialDecisionType;
  resultingStatus: SubmissionLifecycleStatus;
  submissionVersionId: string;
  receiptId?: string;
  revisionPlanId?: string;
  note: string;
  externalReference?: string;
  lifecycleVersion: number;
  decidedAt: string;
  immutableHash: string;
}
export interface RecordEditorialDecisionInput {
  decisionType: EditorialDecisionType;
  note?: string;
  externalReference?: string;
  tasks?: Array<{
    title: string;
    details: string;
    scope: RevisionScope;
    required: boolean;
    dueAt?: string;
  }>;
}
export interface RevisionGateReport {
  ready: boolean;
  plan: RevisionPlan | null;
  pendingRequiredTasks: RevisionTask[];
  reason?: string;
}
function clean(value: unknown): string {
  return String(value ?? '').trim();
}
function validId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/u.test(value);
}
function validHash(value: string): boolean {
  return /^[a-f0-9]{64}$/u.test(value);
}
function isRevision(type: EditorialDecisionType): boolean {
  return type === 'MINOR_REVISION' || type === 'MAJOR_REVISION';
}
function resultingStatus(type: EditorialDecisionType): SubmissionLifecycleStatus {
  if (type === 'MINOR_REVISION' || type === 'MAJOR_REVISION') return 'REVISION_REQUESTED';
  if (type === 'ACCEPT') return 'ACCEPTED';
  if (type === 'REJECT') return 'REJECTED';
  return 'WITHDRAWN';
}
function allowedDecisionStatus(status: SubmissionLifecycleStatus): boolean {
  return status === 'SUBMITTED' || status === 'UNDER_REVIEW' ||
    status === 'RESUBMITTED' || status === 'REVISION_REQUESTED';
}
function validIsoDate(value: string | undefined): boolean {
  if (!value) return true;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}
export function buildEditorialDecision(input: Omit<EditorialDecision, 'id' | 'immutableHash'>): EditorialDecision {
  if (!validId(clean(input.submissionId)) || !clean(input.userId) || !clean(input.workspaceId)) {
    throw new Error('Editorial decision identity is incomplete.');
  }
  if (!validId(clean(input.submissionVersionId))) {
    throw new Error('Editorial decision version binding is invalid.');
  }
  if (input.resultingStatus !== resultingStatus(input.decisionType)) {
    throw new Error('Editorial decision result does not match the decision type.');
  }
  if (!clean(input.note) && !clean(input.externalReference)) {
    throw new Error('Editorial decision requires a note or external reference.');
  }
  if (!clean(input.decidedAt)) throw new Error('Editorial decision timestamp is required.');
  const canonical = JSON.stringify({
    submissionId: input.submissionId,
    userId: input.userId,
    workspaceId: input.workspaceId,
    decisionType: input.decisionType,
    resultingStatus: input.resultingStatus,
    submissionVersionId: input.submissionVersionId,
    receiptId: clean(input.receiptId),
    revisionPlanId: clean(input.revisionPlanId),
    note: clean(input.note),
    externalReference: clean(input.externalReference),
    lifecycleVersion: input.lifecycleVersion,
    decidedAt: input.decidedAt
  });
  const stableKey = JSON.stringify({
    submissionId: input.submissionId,
    userId: input.userId,
    workspaceId: input.workspaceId,
    decisionType: input.decisionType,
    resultingStatus: input.resultingStatus,
    submissionVersionId: input.submissionVersionId,
    lifecycleVersion: input.lifecycleVersion
  });
  const immutableHash = sha256(canonical);
  return {
    ...input,
    id: 'DEC-' + sha256(stableKey).slice(0, 32),
    note: clean(input.note),
    ...(input.receiptId ? { receiptId: clean(input.receiptId) } : {}),
    ...(input.revisionPlanId ? { revisionPlanId: clean(input.revisionPlanId) } : {}),
    ...(input.externalReference ? { externalReference: clean(input.externalReference) } : {}),
    immutableHash
  };
}
export function buildRevisionPlan(
  decisionId: string,
  submissionId: string,
  submissionVersionId: string,
  severity: 'MINOR' | 'MAJOR',
  tasks: RecordEditorialDecisionInput['tasks'],
  createdAt: string
): RevisionPlan {
  const normalized = tasks ?? [];
  if (!normalized.length) throw new Error('Revision decision requires at least one revision task.');
  if (normalized.length > 50) throw new Error('A revision plan cannot contain more than 50 tasks.');
  const baseId = 'RVP-' + sha256(JSON.stringify({ submissionId, submissionVersionId, decisionId })).slice(0, 32);
  const items: RevisionTask[] = normalized.map((task, index) => {
    const title = clean(task.title);
    const details = clean(task.details);
    const dueAt = clean(task.dueAt);
    if (!title || !details) throw new Error('Every revision task requires a title and details.');
    if (!validIsoDate(dueAt || undefined)) throw new Error('Revision task due date is invalid.');
    if (task.required !== true && task.required !== false) throw new Error('Revision task required flag is invalid.');
    const itemSeed = JSON.stringify({ baseId, order: index + 1, title, details, scope: task.scope });
    return {
      id: 'RVT-' + sha256(itemSeed).slice(0, 32),
      order: index + 1,
      title,
      details,
      scope: task.scope,
      required: task.required,
      status: 'OPEN',
      ...(dueAt ? { dueAt } : {}),
      updatedAt: createdAt
    };
  });
  const base: Omit<RevisionPlan, 'planHash'> = {
    id: baseId,
    submissionId,
    decisionId,
    submissionVersionId,
    severity,
    status: 'OPEN',
    tasks: items,
    createdAt,
    updatedAt: createdAt
  };
  return { ...base, planHash: revisionPlanHash(base) };
}
function planReference(userId: string, submissionId: string) {
  return adminDb.collection('publication_submission_lifecycle').doc(userId)
    .collection('items').doc(submissionId).collection('revision-plans');
}
function decisionReference(userId: string, submissionId: string) {
  return adminDb.collection('publication_submission_lifecycle').doc(userId)
    .collection('items').doc(submissionId).collection('editorial-decisions');
}
async function latestRevisionPlan(userId: string, submissionId: string): Promise<RevisionPlan | null> {
  const snapshot = await planReference(userId, submissionId).limit(100).get();
  const plans = snapshot.docs.map(doc => doc.data() as RevisionPlan)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return plans[0] ?? null;
}
function assertDecisionPreconditions(
  current: SubmissionLifecycleRecord,
  input: RecordEditorialDecisionInput
): void {
  if (!allowedDecisionStatus(current.currentStatus)) {
    throw new Error('Editorial decision is only available after submission reaches an active editorial state.');
  }
  if (!current.auditHeadHash || !validHash(current.auditHeadHash)) {
    throw new Error('P17 audit chain is required before recording an editorial decision.');
  }
  if (!current.currentVersionId || !Number.isInteger(current.versionCount) || current.versionCount < 1) {
    throw new Error('P18 submission version snapshot is required before an editorial decision.');
  }
  const transition = canTransition(current.currentStatus, resultingStatus(input.decisionType));
  if (!transition.allowed) throw new Error(transition.reason ?? 'Editorial decision transition is not allowed.');
  if (isRevision(input.decisionType) && !(input.tasks?.length)) {
    throw new Error('A revision decision must include at least one structured revision task.');
  }
}
async function loadDecisionReceipt(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  submissionId: string,
  current: SubmissionLifecycleRecord
): Promise<SubmissionReceipt | null> {
  if (!current.submissionReceiptId) return null;
  const reference = adminDb.collection('publication_submission_lifecycle').doc(userId)
    .collection('items').doc(submissionId).collection('receipts').doc(current.submissionReceiptId);
  const snapshot = await transaction.get(reference);
  return snapshot.exists ? snapshot.data() as SubmissionReceipt : null;
}
class PublicationSubmissionEditorialDecisionService {
function buildDecisionArtifacts(
  current: SubmissionLifecycleRecord,
  userId: string,
  workspaceId: string,
  input: RecordEditorialDecisionInput,
  receipt: SubmissionReceipt | null,
  now: string
): {
  decision: EditorialDecision;
  revisionPlan?: RevisionPlan;
  auditEvent: ReturnType<typeof buildSubmissionAuditEvent>;
  event: SubmissionLifecycleRecord['events'][number];
  submission: SubmissionLifecycleRecord;
} {
  const targetStatus = resultingStatus(input.decisionType);
  const versionId = current.currentVersionId!;
  const lifecycleVersion = current.version + 1;
  const decisionKey = JSON.stringify({
    submissionId: current.id, userId, workspaceId, lifecycleVersion,
    decisionType: input.decisionType, resultingStatus: targetStatus, submissionVersionId: versionId
  });
  const decisionId = 'DEC-' + sha256(decisionKey).slice(0, 32);
  const revisionPlan = isRevision(input.decisionType)
    ? buildRevisionPlan(
      decisionId, current.id, versionId,
      input.decisionType === 'MAJOR_REVISION' ? 'MAJOR' : 'MINOR',
      input.tasks, now
    )
    : undefined;
  const note = clean(input.note) || 'Editorial decision recorded.';
  const decision = buildEditorialDecision({
    submissionId: current.id, userId, workspaceId,
    decisionType: input.decisionType, resultingStatus: targetStatus,
    submissionVersionId: versionId,
    ...(receipt ? { receiptId: receipt.id } : {}),
    ...(revisionPlan ? { revisionPlanId: revisionPlan.id } : {}),
    note,
    ...(input.externalReference ? { externalReference: clean(input.externalReference) } : {}),
    lifecycleVersion, decidedAt: now
  });
  const auditEvent = buildSubmissionAuditEvent({
    submissionId: current.id, version: lifecycleVersion,
    from: current.currentStatus, to: targetStatus,
    note: `Editorial decision: ${input.decisionType}. ${note}`,
    externalReference: input.externalReference, receiptId: receipt?.id,
    occurredAt: now, previousHash: current.auditHeadHash
  });
  const event: SubmissionLifecycleRecord['events'][number] = {
    id: 'SEV-' + sha256(JSON.stringify({ submissionId: current.id, lifecycleVersion, decisionId: decision.id, occurredAt: now })).slice(0, 32),
    from: current.currentStatus, to: targetStatus, note: decision.note,
    ...(input.externalReference ? { externalReference: clean(input.externalReference) } : {}), occurredAt: now
  };
  const events = Array.isArray(current.events) ? current.events : [];
  const submission: SubmissionLifecycleRecord = {
    ...current, currentStatus: targetStatus, version: lifecycleVersion,
    events: [...events, event].slice(-100), auditHeadHash: auditEvent.eventHash, updatedAt: now
  };
  return { decision, ...(revisionPlan ? { revisionPlan } : {}), auditEvent, event, submission };
}
  async record(
    userId: string,
    workspaceId: string,
    submissionId: string,
    input: RecordEditorialDecisionInput
  ): Promise<{ decision: EditorialDecision; submission: SubmissionLifecycleRecord; revisionPlan?: RevisionPlan }> {
    const reference = adminDb.collection('publication_submission_lifecycle').doc(userId)
      .collection('items').doc(submissionId);
    const now = new Date().toISOString();
    return adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Submission lifecycle record was not found.');
      const current = snapshot.data() as SubmissionLifecycleRecord;
      if (current.workspaceId !== workspaceId) throw new Error('Submission does not belong to this workspace.');
      assertDecisionPreconditions(current, input);
      const requiresReceipt = input.decisionType === 'ACCEPT' || input.decisionType === 'REJECT';
      const receipt = requiresReceipt
        ? await loadDecisionReceipt(transaction, userId, submissionId, current)
        : null;
      if (requiresReceipt && !receipt) {
        throw new Error('Accepted or rejected submissions require a recorded submission receipt.');
      }
      if (receipt && current.currentStatus === 'SUBMITTED' && receipt.submissionVersionId !== current.currentVersionId) {
        throw new Error('The submission receipt is not bound to the current submitted version.');
      }
      const artifacts = buildDecisionArtifacts(current, userId, workspaceId, input, receipt, now);
      const decisions = decisionReference(userId, submissionId);
      const plans = planReference(userId, submissionId);
      transaction.create(decisions.doc(artifacts.decision.id), artifacts.decision);
      if (artifacts.revisionPlan) transaction.create(plans.doc(artifacts.revisionPlan.id), artifacts.revisionPlan);
      transaction.create(reference.collection('audit').doc(artifacts.auditEvent.id), artifacts.auditEvent);
      transaction.set(reference, artifacts.submission);
      return {
        decision: artifacts.decision,
        submission: artifacts.submission,
        ...(artifacts.revisionPlan ? { revisionPlan: artifacts.revisionPlan } : {})
      };
    });
  }
  async listDecisions(userId: string, workspaceId: string, submissionId: string): Promise<EditorialDecision[]> {
    const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
    if (!current || current.workspaceId !== workspaceId) throw new Error('Submission was not found.');
    const snapshot = await decisionReference(userId, submissionId).limit(100).get();
    return snapshot.docs.map(doc => doc.data() as EditorialDecision)
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  }
  async getRevisionPlan(userId: string, workspaceId: string, submissionId: string): Promise<RevisionPlan | null> {
    const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
    if (!current || current.workspaceId !== workspaceId) throw new Error('Submission was not found.');
    return latestRevisionPlan(userId, submissionId);
  }
  async updateRevisionTask(
    userId: string,
    workspaceId: string,
    submissionId: string,
    taskId: string,
    status: RevisionTaskStatus,
    completionNote?: string
  ): Promise<RevisionPlan> {
    const lifecycleReference = adminDb.collection('publication_submission_lifecycle').doc(userId)
      .collection('items').doc(submissionId);
    const plan = await latestRevisionPlan(userId, submissionId);
    if (!plan) throw new Error('No revision plan exists for this submission.');
    if (plan.tasks.every(task => task.status === 'DONE' || task.status === 'WAIVED') && status === 'OPEN') {
      throw new Error('A completed revision plan cannot reopen a task.');
    }
    return adminDb.runTransaction(async transaction => {
      const lifecycleSnapshot = await transaction.get(lifecycleReference);
      if (!lifecycleSnapshot.exists) throw new Error('Submission lifecycle record was not found.');
      const current = lifecycleSnapshot.data() as SubmissionLifecycleRecord;
      if (current.workspaceId !== workspaceId) throw new Error('Submission does not belong to this workspace.');
      if (current.currentStatus !== 'REVISION_REQUESTED') {
        throw new Error('Revision tasks can only be updated while revision is requested.');
      }
      const planReferenceValue = planReference(userId, submissionId).doc(plan.id);
      const planSnapshot = await transaction.get(planReferenceValue);
      if (!planSnapshot.exists) throw new Error('Revision plan was not found.');
      const stored = planSnapshot.data() as RevisionPlan;
      const integrityErrors = verifyRevisionPlan(stored);
      if (integrityErrors.length) throw new Error('Revision plan integrity check failed.');
      const taskIndex = stored.tasks.findIndex(task => task.id === taskId);
      if (taskIndex < 0) throw new Error('Revision task was not found.');
      if (status === 'WAIVED' && !clean(completionNote)) {
        throw new Error('A waived revision task requires a completion note.');
      }
      const updatedAt = new Date().toISOString();
      const updatedTasks = stored.tasks.map((task, index) => {
        if (index !== taskIndex) return task;
        const updatedTask: RevisionTask = { ...task, status, updatedAt };
        const note = clean(completionNote);
        if (note) updatedTask.completionNote = note;
        else delete updatedTask.completionNote;
        return updatedTask;
      });
      const base: Omit<RevisionPlan, 'planHash'> = {
        ...stored,
        tasks: updatedTasks,
        status: computeRevisionPlanStatus(updatedTasks),
        updatedAt
      };
      const updated: RevisionPlan = { ...base, planHash: revisionPlanHash(base) };
      transaction.set(planReferenceValue, updated);
      return updated;
    });
  }
  async assertResubmissionGate(
    userId: string,
    workspaceId: string,
    submissionId: string
  ): Promise<RevisionGateReport> {
    const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
    if (!current || current.workspaceId !== workspaceId) {
      throw new Error('Submission was not found.');
    }
    if (current.currentStatus !== 'REVISION_REQUESTED') {
      return { ready: false, plan: null, pendingRequiredTasks: [], reason: 'Submission is not awaiting revision.' };
    }
    const plan = await latestRevisionPlan(userId, submissionId);
    if (!plan) {
      return { ready: false, plan: null, pendingRequiredTasks: [], reason: 'No structured revision plan exists.' };
    }
    const integrityErrors = verifyRevisionPlan(plan);
    if (integrityErrors.length) {
      return { ready: false, plan, pendingRequiredTasks: [], reason: 'Revision plan integrity verification failed.' };
    }
    const pendingRequiredTasks = plan.tasks.filter(task =>
      task.required && task.status !== 'DONE' && task.status !== 'WAIVED'
    );
    return pendingRequiredTasks.length
      ? { ready: false, plan, pendingRequiredTasks, reason: 'Required revision tasks are not complete.' }
      : { ready: true, plan, pendingRequiredTasks: [] };
  }
}
export const publicationSubmissionEditorialDecisionService =
  new PublicationSubmissionEditorialDecisionService();
