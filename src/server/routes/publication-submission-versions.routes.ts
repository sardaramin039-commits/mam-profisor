import { Router, Response } from 'express';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { listSubmissionVersions, verifySubmissionVersionChain } from '../services/publication-submission-version.service';
import { initializeLegacySubmissionVersion } from '../services/publication-submission-version-migration.service';
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

export function createPublicationSubmissionVersionsRouter(): Router {
  const router = Router({ mergeParams: true });

  router.get('/versions', async (req: AuthRequest, res) => {
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
      const versions = await listSubmissionVersions(userId, submissionId);
      const report = verifySubmissionVersionChain(versions, submission.id);
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
      const chainVerified = report.status === 'VERIFIED' || report.status === 'LEGACY_RECONSTRUCTED';
      const verified = errors.length === 0 && (
        submission.versionCount === 0
          ? report.status === 'EMPTY'
          : chainVerified
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
  router.post('/initialize', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success || !lifecycleId.safeParse(submissionId).success) {
      res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
      return;
    }

    try {
      const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
      if (!current || current.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }
      const submission = await initializeLegacySubmissionVersion(userId, submissionId);
      const items = await listSubmissionVersions(userId, submissionId);
      const report = verifySubmissionVersionChain(items);
      res.status(201).json({
        success: report.status !== 'INVALID',
        submission,
        versions: report,
        items
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Version migration failed.';
      res.status(409).json({ success: false, error: message });
    }
  });

  return router;
}
