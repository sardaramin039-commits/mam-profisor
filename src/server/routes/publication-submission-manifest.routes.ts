import { Router, Response } from 'express';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from '../services/publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from '../services/publication-submission-integrity.service';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import { resolveServerVerifiedCitations } from '../services/publication-research-gate.service';
import { listSubmissionAuditEvents, verifySubmissionAuditChain } from '../services/publication-submission-audit.service';
import { listSubmissionVersions, verifySubmissionVersionChain } from '../services/publication-submission-version.service';
import {
  buildSubmissionManifest,
  getSubmissionManifest,
  listSubmissionManifests,
  saveSubmissionManifest,
  verifySubmissionManifest
} from '../services/publication-submission-manifest.service';
import { lifecycleId, packageSchema } from './publication-submission-lifecycle.schemas';
import type { AuthRequest } from '../../middleware/auth';

function requireUser(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
    return null;
  }
  return userId;
}

function invalidKeywordRange(minKeywords: number | undefined, maxKeywords: number | undefined): boolean {
  return minKeywords !== undefined && maxKeywords !== undefined && minKeywords > maxKeywords;
}

export function createPublicationSubmissionManifestRouter(): Router {
  const router = Router();

  router.get('/:workspaceId', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }
    try {
      const limit = Number(req.query['limit'] ?? 50);
      const manifests = await listSubmissionManifests(userId, workspaceId, Number.isFinite(limit) ? limit : 50);
      res.json({ manifests });
    } catch (error) {
      console.error('Submission manifest list failed because authoritative storage is unavailable:', error);
      res.status(503).json({
        success: false,
        degraded: true,
        status: 'SUBMISSION_STORAGE_UNAVAILABLE',
        error: 'نەتوانرا manifest ـەکان لە داتابەیسی سەرەکی بخوێندرێنەوە.'
      });
    }
  });

  router.get('/:workspaceId/:manifestId', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const manifestId = req.params['manifestId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success || !lifecycleId.safeParse(manifestId).success) {
      res.status(400).json({ error: 'ناسنامەی manifest یان workspace نادروستە.' });
      return;
    }
    try {
      const manifest = await getSubmissionManifest(userId, manifestId);
      if (!manifest || manifest.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'manifest نەدۆزرایەوە.' });
        return;
      }
      const verification = verifySubmissionManifest(manifest);
      res.status(verification.status === 'INVALID' ? 409 : 200).json({
        success: verification.status === 'VERIFIED',
        manifest,
        verification
      });
    } catch (error) {
      console.error('Submission manifest get failed because authoritative storage is unavailable:', error);
      res.status(503).json({
        success: false,
        degraded: true,
        status: 'SUBMISSION_STORAGE_UNAVAILABLE',
        error: 'نەتوانرا manifest لە داتابەیسی سەرەکی پشکنرێت.'
      });
    }
  });

  router.post('/:workspaceId/capture', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }

    const parsed = packageSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای manifest نادروستە.', issues: parsed.error.issues });
      return;
    }
    if (invalidKeywordRange(parsed.data.policy.minKeywords, parsed.data.policy.maxKeywords)) {
      res.status(400).json({ error: 'کەمترین ژمارەی keyword نابێت لە زۆرترین ژمارە گەورەتر بێت.' });
      return;
    }

    try {
      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
      if (control.gates.exportBlocked) {
        res.status(409).json({
          success: false,
          exportBlocked: true,
          controlPlane: control,
          error: 'P9 research validation ـەکە هێشتا ڕێگەی manifest نادات.'
        });
        return;
      }

      const citations = await resolveServerVerifiedCitations(
        userId,
        workspaceId,
        parsed.data.citations
      );
      const manuscript = assembleManuscript({
        projectId: workspaceId,
        title: parsed.data.title,
        abstract: parsed.data.abstract,
        researchQuestion: parsed.data.researchQuestion,
        methodology: parsed.data.methodology,
        chapters: parsed.data.chapters,
        conclusion: parsed.data.conclusion,
        citations
      });
      const submission = buildPublicationSubmissionPackage({
        manuscript,
        policy: parsed.data.policy,
        keywords: parsed.data.keywords,
        authors: parsed.data.authors
      });
      const integrity = verifyPublicationSubmissionIntegrity({ package: submission });
      if (!integrity.readyToSubmit) {
        res.status(409).json({ success: false, integrity });
        return;
      }

      const lifecycle = await publicationSubmissionLifecycleService.getByWorkspaceAndFingerprint(
        userId,
        workspaceId,
        submission.fingerprint
      );
      if (!lifecycle) {
        res.status(404).json({
          error: 'lifecycle ـێکی هاوتا بۆ ئەم package ـە نەدۆزرایەوە.',
          action: 'پێش manifest، submission lifecycle دروست بکە.'
        });
        return;
      }
      if (!['READY', 'SUBMITTED', 'RESUBMITTED'].includes(lifecycle.currentStatus)) {
        res.status(409).json({ error: 'تەنها submission ـی READY یان نێردراو دەتوانرێت manifest ـی جێگیر هەبێت.' });
        return;
      }
      if (!lifecycle.currentVersionId || lifecycle.versionCount < 1) {
        res.status(409).json({ error: 'P18 version snapshot نییە.' });
        return;
      }

      const auditEvents = await listSubmissionAuditEvents(userId, lifecycle.id);
      const audit = verifySubmissionAuditChain(
        auditEvents,
        lifecycle.currentStatus,
        lifecycle.version,
        lifecycle.auditHeadHash
      );
      const versions = await listSubmissionVersions(userId, lifecycle.id);
      const versionReport = verifySubmissionVersionChain(versions, lifecycle.id);
      const versionConsistencyErrors = [
        ...(lifecycle.versionCount !== versions.length
          ? ['Lifecycle version count does not match stored versions.']
          : []),
        ...(lifecycle.currentVersionId !== versions.at(-1)?.id
          ? ['Lifecycle current version id does not match the latest stored version.']
          : []),
        ...(lifecycle.submissionFingerprint !== versionReport.latestFingerprint
          ? ['Lifecycle fingerprint does not match the latest stored version.']
          : [])
      ];

      if (
        audit.status !== 'VERIFIED' ||
        versionReport.status !== 'VERIFIED' ||
        versionConsistencyErrors.length > 0
      ) {
        res.status(409).json({
          success: false,
          error: 'audit یان version chain پێش manifest تەواو verified نییە.',
          audit,
          versions: versionReport,
          consistencyErrors: versionConsistencyErrors
        });
        return;
      }

      const capturedAt = new Date().toISOString();
      const manifest = buildSubmissionManifest({
        submissionId: lifecycle.id,
        userId,
        workspaceId,
        policy: parsed.data.policy,
        package: submission,
        integrity,
        versionId: lifecycle.currentVersionId,
        auditHeadHash: lifecycle.auditHeadHash,
        capturedAt
      });
      try {
        await saveSubmissionManifest(manifest);
      } catch (storageError) {
        console.error('Submission manifest could not be durably persisted:', storageError);
        res.status(503).json({
          success: false,
          degraded: true,
          status: 'SUBMISSION_STORAGE_UNAVAILABLE',
          error: 'مانفێستی submission لە داتابەیسی سەرەکی پاشەکەوت نەکرا؛ بە سەرکەوتوو دانەنرا.'
        });
        return;
      }
      res.status(201).json({ success: true, manifest });
    } catch (error) {
      console.error('Submission manifest capture error:', error);
      const message = error instanceof Error ? error.message : 'Manifest capture failed.';
      res.status(409).json({ success: false, error: message });
    }
  });

  return router;
}
