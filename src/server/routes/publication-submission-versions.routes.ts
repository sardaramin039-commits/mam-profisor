import { Router } from 'express';
import { z } from 'zod';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { listSubmissionVersions, verifySubmissionVersionChain } from '../services/publication-submission-version.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/u);

export function createPublicationSubmissionVersionsRouter(): Router {
  const router = Router({ mergeParams: true });

  router.get('/:workspaceId/:submissionId/versions', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;
    if (!id.safeParse(workspaceId).success || !id.safeParse(submissionId).success) {
      res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
      return;
    }
  
    try {
      const submission = await publicationSubmissionLifecycleService.get(userId, submissionId);
      if (!submission || submission.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }
      const versions = await listSubmissionVersions(userId, submissionId);
      const report = verifySubmissionVersionChain(versions);
      const errors = [...report.errors];
      if (submission.versionCount !== versions.length) {
        errors.push('Lifecycle version count does not match stored versions.');
      }
      if (submission.versionCount > 0 && submission.currentVersionId !== versions.at(-1)?.id) {
        errors.push('Lifecycle currentVersionId does not match the latest version.');
      }
      if (submission.versionCount > 0 && submission.submissionFingerprint !== report.latestFingerprint) {
        errors.push('Lifecycle submission fingerprint does not match the latest version.');
      }
      const verified = errors.length === 0 && (
        submission.versionCount === 0
          ? report.status === 'EMPTY'
          : report.status === 'VERIFIED'
      );
      res.status(verified ? 200 : 409).json({
        success: verified,
        versions: report,
        consistencyErrors: errors,
        items: versions
      });
    } catch (error) {
      console.error('Submission version history read error:', error);
      res.status(500).json({ error: 'نەتوانرا مێژووی version ـەکانی submission بخوێندرێتەوە.' });
    }
  });
  return router;
}
