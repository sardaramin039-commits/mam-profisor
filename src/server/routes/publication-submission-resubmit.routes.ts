import { Router, Response } from 'express';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from '../services/publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from '../services/publication-submission-integrity.service';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { publicationSubmissionEditorialDecisionService } from '../services/publication-submission-editorial-decision.service';
import { listSubmissionManifests, submissionPolicyFingerprint, verifySubmissionManifest } from '../services/publication-submission-manifest.service';
import { lifecycleId, resubmitSchema } from './publication-submission-lifecycle.schemas';
import type { AuthRequest } from '../../middleware/auth';

function requireUser(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
    return null;
  }
  return userId;
}

function invalidKeywordRange(
  minKeywords: number | undefined,
  maxKeywords: number | undefined
): boolean {
  return minKeywords !== undefined &&
    maxKeywords !== undefined &&
    minKeywords > maxKeywords;
}

export function createPublicationSubmissionResubmitRouter(): Router {
  const router = Router({ mergeParams: true });

  router.post('/resubmit', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;

    if (!lifecycleId.safeParse(workspaceId).success || !lifecycleId.safeParse(submissionId).success) {
      res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
      return;
    }

    const parsed = resubmitSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای resubmission نادروستە.', issues: parsed.error.issues });
      return;
    }

    const { minKeywords, maxKeywords } = parsed.data.policy;
    if (invalidKeywordRange(minKeywords, maxKeywords)) {
      res.status(400).json({ error: 'کەمترین ژمارەی keyword نابێت لە زۆرترین ژمارە گەورەتر بێت.' });
      return;
    }

    try {
      const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
      if (!current || current.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }
      if (current.currentStatus !== 'REVISION_REQUESTED') {
        res.status(409).json({
          error: 'تەنها submission ـێکی REVISION_REQUESTED دەتوانرێت resubmit بکرێت.'
        });
        return;
      }

      if (!current.currentVersionId) {
        res.status(409).json({ success: false, error: 'Current submission version is required before resubmission.' });
        return;
      }
      const manifests = await listSubmissionManifests(userId, workspaceId, 100);
      const lockedManifest = manifests.find(manifest => manifest.versionId === current.currentVersionId);
      if (!lockedManifest) {
        res.status(409).json({
          success: false,
          error: 'P19 policy manifest for the current submitted version was not found; resubmission is blocked.'
        });
        return;
      }
      const manifestVerification = verifySubmissionManifest(lockedManifest);
      if (manifestVerification.status !== 'VERIFIED') {
        res.status(409).json({
          success: false,
          error: 'P19 policy manifest integrity verification failed; resubmission is blocked.',
          verification: manifestVerification
        });
        return;
      }
      if (submissionPolicyFingerprint(parsed.data.policy) !== lockedManifest.policyFingerprint) {
        res.status(409).json({
          success: false,
          error: 'Resubmission policy must match the verified P19 policy manifest.'
        });
        return;
      }
      const revisionGate = await publicationSubmissionEditorialDecisionService.assertResubmissionGate(
        userId,
        workspaceId,
        submissionId
      );
      if (!revisionGate.ready) {
        res.status(409).json({
          success: false,
          error: revisionGate.reason ?? 'پلانەکانی revision هێشتا تەواو نەکراون.',
          revisionPlan: revisionGate.plan,
          pendingRequiredTasks: revisionGate.pendingRequiredTasks
        });
        return;
      }

      const manuscript = assembleManuscript({
        projectId: workspaceId,
        title: parsed.data.title,
        abstract: parsed.data.abstract,
        researchQuestion: parsed.data.researchQuestion,
        methodology: parsed.data.methodology,
        chapters: parsed.data.chapters,
        conclusion: parsed.data.conclusion,
        citations: parsed.data.citations
      });
      const submission = buildPublicationSubmissionPackage({
        manuscript,
        policy: parsed.data.policy,
        keywords: parsed.data.keywords,
        authors: parsed.data.authors
      });
      const integrity = verifyPublicationSubmissionIntegrity({ package: submission });

      if (!integrity.readyToSubmit) {
        res.status(409).json({ success: false, integrity, package: submission });
        return;
      }
      if (
        submission.journalName !== current.journalName ||
        submission.manuscriptType !== current.manuscriptType
      ) {
        res.status(409).json({
          success: false,
          error: 'journal یان جۆری manuscript جیاوازە؛ submission ـێکی نوێ دروست بکە.'
        });
        return;
      }

      const record = await publicationSubmissionLifecycleService.resubmit(
        userId,
        submissionId,
        submission.fingerprint,
        {
          note: parsed.data.note,
          externalReference: parsed.data.externalReference,
          revisionPlanId: revisionGate.plan!.id
        }
      );
      res.json({
        success: true,
        submission: record,
        integrity,
        package: submission,
        submissionConfirmation: 'USER_REPORTED_UNVERIFIED',
        externalSubmissionVerified: false,
        message: 'ئەم کارە تەنها وەشانی نوێی package ـەکە لە lifecycle ـی ناوخۆیی تۆمار دەکات؛ گۆڤار هیچ ناردنێکی دەرەکیی لەلایەن ئەپەوە وەرنەگرتووە.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resubmission failed.';
      res.status(409).json({ success: false, error: message });
    }
  });

  return router;
}
