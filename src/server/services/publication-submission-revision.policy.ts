import { sha256 } from './text-sha256.service';
export type RevisionTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'WAIVED';
export type RevisionScope = 'MANUSCRIPT' | 'SECTION' | 'CITATION' | 'FORMATTING' | 'OTHER';
export interface RevisionTask {
  id: string;
  order: number;
  title: string;
  details: string;
  scope: RevisionScope;
  required: boolean;
  status: RevisionTaskStatus;
  dueAt?: string;
  completionNote?: string;
  updatedAt: string;
}
export interface RevisionPlan {
  id: string;
  submissionId: string;
  decisionId: string;
  submissionVersionId: string;
  severity: 'MINOR' | 'MAJOR';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  tasks: RevisionTask[];
  createdAt: string;
  updatedAt: string;
  planHash: string;
}
function taskPayload(task: RevisionTask): Record<string, unknown> {
  return {
    id: task.id,
    order: task.order,
    title: task.title,
    details: task.details,
    scope: task.scope,
    required: task.required,
    status: task.status,
    dueAt: task.dueAt || '',
    completionNote: task.completionNote || '',
    updatedAt: task.updatedAt
  };
}
export function revisionPlanHash(plan: Omit<RevisionPlan, 'planHash'>): string {
  return sha256(JSON.stringify({
    id: plan.id, submissionId: plan.submissionId, decisionId: plan.decisionId,
    submissionVersionId: plan.submissionVersionId, severity: plan.severity,
    status: plan.status, tasks: plan.tasks.map(taskPayload),
    createdAt: plan.createdAt, updatedAt: plan.updatedAt
  }));
}
export function computeRevisionPlanStatus(tasks: RevisionTask[]): RevisionPlan['status'] {
  if (tasks.length > 0 && tasks.every(task =>
    !task.required || task.status === 'DONE' || task.status === 'WAIVED'
  )) return 'COMPLETED';
  return tasks.some(task => task.status !== 'OPEN') ? 'IN_PROGRESS' : 'OPEN';
}
export function verifyRevisionPlan(plan: RevisionPlan): string[] {
  const base: Omit<RevisionPlan, 'planHash'> = {
    id: plan.id, submissionId: plan.submissionId, decisionId: plan.decisionId,
    submissionVersionId: plan.submissionVersionId, severity: plan.severity,
    status: plan.status, tasks: plan.tasks, createdAt: plan.createdAt, updatedAt: plan.updatedAt
  };
  const errors: string[] = [];
  if (!/^[A-Za-z0-9_-]{1,128}$/u.test(plan.id) ||
      !/^[A-Za-z0-9_-]{1,128}$/u.test(plan.submissionId) ||
      !/^[A-Za-z0-9_-]{1,128}$/u.test(plan.decisionId) ||
      !/^[A-Za-z0-9_-]{1,128}$/u.test(plan.submissionVersionId)) {
    errors.push('Revision plan identity is invalid.');
  }
  if (!plan.tasks.length || plan.tasks.length > 50) {
    errors.push('Revision plan task count is invalid.');
  }
  const seenTaskIds = new Set<string>();
  plan.tasks.forEach((task, index) => {
    if (seenTaskIds.has(task.id)) errors.push(`Duplicate revision task id: ${task.id}.`);
    seenTaskIds.add(task.id);
    if (task.order !== index + 1) errors.push(`Revision task order is invalid at ${task.id}.`);
    if (!task.title.trim() || !task.details.trim()) {
      errors.push(`Revision task content is incomplete at ${task.id}.`);
    }
    if (task.required !== true && task.required !== false) {
      errors.push(`Revision task required flag is invalid at ${task.id}.`);
    }
  });
  if (revisionPlanHash(base) !== plan.planHash) errors.push('Revision plan hash mismatch.');
  if (computeRevisionPlanStatus(plan.tasks) !== plan.status) {
    errors.push('Revision plan status does not match its tasks.');
  }
  return errors;
}
export function requiredRevisionTasksComplete(plan: RevisionPlan): boolean {
  return plan.tasks.every(task => !task.required || task.status === 'DONE' || task.status === 'WAIVED');
}
