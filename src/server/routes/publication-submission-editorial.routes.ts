import { Router, Response } from 'express';
import { z } from 'zod';
import { lifecycleId } from './publication-submission-lifecycle.schemas';
import { publicationSubmissionEditorialDecisionService } from '../services/publication-submission-editorial-decision.service';
import { requireEditorialRole } from '../../middleware/auth';
import type { AuthRequest } from '../../middleware/auth';

const decisionSchema = z.object({
  decisionType: z.enum(['MINOR_REVISION','MAJOR_REVISION','ACCEPT','REJECT','WITHDRAW']),
  note: z.string().trim().max(5000).optional(),
  externalReference: z.string().trim().max(500).optional(),
  tasks: z.array(z.object({
    title: z.string().trim().min(1).max(500),
    details: z.string().trim().min(1).max(5000),
    scope: z.enum(['MANUSCRIPT','SECTION','CITATION','FORMATTING','OTHER']),
    required: z.boolean(),
    dueAt: z.string().trim().max(100).optional()
  }).strict()).max(50).optional()
}).strict();

const revisionTaskUpdateSchema = z.object({
  status: z.enum(['OPEN','IN_PROGRESS','DONE','WAIVED']),
  completionNote: z.string().trim().max(5000).optional()
}).strict();

function requireUser(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
    return null;
  }
  return userId;
}

function validParams(workspaceId: string, submissionId: string): boolean {
  return lifecycleId.safeParse(workspaceId).success && lifecycleId.safeParse(submissionId).success;
}

async function handleDecision(req: AuthRequest, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  const workspaceId = req.params['workspaceId'];
  const submissionId = req.params['submissionId'];
  if (!userId) return;
  if (!requireEditorialRole(req, res)) return;
  if (!validParams(workspaceId, submissionId)) {
    res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
    return;
  }
  const parsed = decisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'داتای editorial decision نادروستە.', issues: parsed.error.issues });
    return;
  }
  try {
    const result = await publicationSubmissionEditorialDecisionService.record(
      userId, workspaceId, submissionId, parsed.data
    );
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Editorial decision failed.';
    res.status(409).json({ success: false, error: message });
  }
}

async function handleDecisionList(req: AuthRequest, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  const workspaceId = req.params['workspaceId'];
  const submissionId = req.params['submissionId'];
  if (!userId) return;
  if (!validParams(workspaceId, submissionId)) {
    res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
    return;
  }
  try {
    const decisions = await publicationSubmissionEditorialDecisionService.listDecisions(
      userId, workspaceId, submissionId
    );
    res.json({ success: true, decisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Editorial decision history failed.';
    res.status(404).json({ success: false, error: message });
  }
}

async function handleRevisionRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  const workspaceId = req.params['workspaceId'];
  const submissionId = req.params['submissionId'];
  if (!userId) return;
  if (!validParams(workspaceId, submissionId)) {
    res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
    return;
  }
  try {
    const [plan, gate] = await Promise.all([
      publicationSubmissionEditorialDecisionService.getRevisionPlan(userId, workspaceId, submissionId),
      publicationSubmissionEditorialDecisionService.assertResubmissionGate(userId, workspaceId, submissionId)
    ]);
    res.json({ success: true, plan, gate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revision plan read failed.';
    res.status(404).json({ success: false, error: message });
  }
}

async function handleRevisionTaskUpdate(req: AuthRequest, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  const workspaceId = req.params['workspaceId'];
  const submissionId = req.params['submissionId'];
  const taskId = req.params['taskId'];
  if (!userId) return;
  if (!validParams(workspaceId, submissionId) || !lifecycleId.safeParse(taskId).success) {
    res.status(400).json({ error: 'ناسنامەی revision task یان submission نادروستە.' });
    return;
  }
  const parsed = revisionTaskUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'داتای نوێکردنەوەی revision نادروستە.', issues: parsed.error.issues });
    return;
  }
  try {
    const plan = await publicationSubmissionEditorialDecisionService.updateRevisionTask(
      userId, workspaceId, submissionId, taskId,
      parsed.data.status, parsed.data.completionNote
    );
    res.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revision task update failed.';
    res.status(409).json({ success: false, error: message });
  }
}

export function createPublicationSubmissionEditorialRouter(): Router {
  const router = Router();
  router.post('/:workspaceId/:submissionId/decision', handleDecision);
  router.get('/:workspaceId/:submissionId/decisions', handleDecisionList);
  router.get('/:workspaceId/:submissionId/revision', handleRevisionRead);
  router.patch('/:workspaceId/:submissionId/revision/:taskId', handleRevisionTaskUpdate);
  return router;
}
