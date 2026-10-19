export type SubmissionLifecycleStatus =
  | 'DRAFT'
  | 'READY'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'RESUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface SubmissionLifecycleEvent {
  id: string;
  from: SubmissionLifecycleStatus;
  to: SubmissionLifecycleStatus;
  note: string;
  externalReference?: string;
  occurredAt: string;
}

export interface SubmissionTransitionResult {
  allowed: boolean;
  reason?: string;
}

const transitions: Record<SubmissionLifecycleStatus, SubmissionLifecycleStatus[]> = {
  DRAFT: ['WITHDRAWN'],
  READY: ['SUBMITTED', 'DRAFT', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  REVISION_REQUESTED: ['RESUBMITTED', 'WITHDRAWN'],
  RESUBMITTED: ['UNDER_REVIEW', 'REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: []
};

export function canTransition(
  from: SubmissionLifecycleStatus,
  to: SubmissionLifecycleStatus
): SubmissionTransitionResult {
  if (from === to) return { allowed: false, reason: 'Submission status is already set to the requested value.' };
  if (!transitions[from].includes(to)) {
    return { allowed: false, reason: `Invalid submission lifecycle transition: ${from} -> ${to}.` };
  }
  return { allowed: true };
}

export function normalizeTransitionNote(value: unknown): string {
  return String(value ?? '').trim().slice(0, 5000);
}

export function normalizeExternalReference(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim().slice(0, 500);
  return normalized || undefined;
}

export function isTerminalSubmissionStatus(status: SubmissionLifecycleStatus): boolean {
  return transitions[status].length === 0;
}

export function initialSubmissionStatus(readyToSubmit: boolean): SubmissionLifecycleStatus {
  return readyToSubmit ? 'READY' : 'DRAFT';
}

export function allowedNextStatuses(status: SubmissionLifecycleStatus): SubmissionLifecycleStatus[] {
  return [...transitions[status]];
}