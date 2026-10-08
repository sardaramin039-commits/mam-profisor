import { Router, Response } from 'express';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { listSubmissionAuditEvents, verifySubmissionAuditChain } from '../services/publication-submission-audit.service';
import { lifecycleId } from './publication-submission-lifecycle.schemas';
import type { AuthRequest } from '../../middleware/auth';

function requireUser(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
    return null;
  }
  return userId;
}

export function createPublicationSubmissionAuditRouter(): Router {
  const router = Router({ mergeParams: true });

  router.get('/audit', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success || !lifecycleId.safeParse(submissionId).success) {
      res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
      return;
    }

    try {
      const submission = await publicationSubmissionLifecycleService.get(userId, submissionId);
      if (!submission || submission.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }

      const events = await listSubmissionAuditEvents(userId, submissionId);
      const report = verifySubmissionAuditChain(
        events,
        submission.currentStatus,
        submission.version,
        submission.auditHeadHash,
        submission.id
      );
      res.status(report.status === 'INVALID' ? 409 : 200).json({
        success: report.status !== 'INVALID',
        audit: report,
        events
      });
    } catch (error) {
      console.error('Submission audit read error:', error);
      res.status(500).json({ error: 'نەتوانرا audit ـی submission پشکنرێت.' });
    }
  });

  return router;
}
