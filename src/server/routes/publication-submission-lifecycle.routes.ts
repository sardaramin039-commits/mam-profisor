import { Router } from 'express';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from '../services/publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from '../services/publication-submission-integrity.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import { resolveServerVerifiedCitations } from '../services/publication-research-gate.service';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import { createPublicationSubmissionAuditRouter } from './publication-submission-audit.routes';
import { createPublicationSubmissionResubmitRouter } from './publication-submission-resubmit.routes';
import { createPublicationSubmissionVersionsRouter } from './publication-submission-versions.routes';
import { lifecycleId, packageSchema, transitionSchema } from './publication-submission-lifecycle.schemas';
import type { SubmissionLifecycleStatus } from '../services/publication-submission-lifecycle.policy';
import type { AuthRequest } from '../../middleware/auth';

function requireUser(req: AuthRequest, res: import('express').Response): string | null {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
    return null;
  }
  return userId;
}

export function createPublicationSubmissionLifecycleRouter(): Router {
  const router = Router();

  router.use('/:workspaceId/:submissionId', createPublicationSubmissionAuditRouter());
  router.use('/:workspaceId/:submissionId', createPublicationSubmissionVersionsRouter());
  router.use('/:workspaceId/:submissionId', createPublicationSubmissionResubmitRouter());

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
      const items = await publicationSubmissionLifecycleService.list(
        userId,
        workspaceId,
        Number.isFinite(limit) ? limit : 50
      );
      res.json({ submissions: items });
    } catch (error) {
      console.error('Submission lifecycle list error:', error);
      res.status(500).json({ error: 'نەتوانرا مێژووی submission بخوێندرێتەوە.' });
    }
  });

  router.post('/:workspaceId/create', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }
    const parsed = packageSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای submission نادروستە.', issues: parsed.error.issues });
      return;
    }
    const { minKeywords, maxKeywords } = parsed.data.policy;
    if (minKeywords !== undefined && maxKeywords !== undefined && minKeywords > maxKeywords) {
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
          error: 'P9 research validation ـەکە هێشتا ڕێگەی submission نادات.'
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

      if (integrity.status === 'BLOCKED') {
        res.status(409).json({ success: false, integrity, package: submission });
        return;
      }

      const record = await publicationSubmissionLifecycleService.create(userId, workspaceId, {
        journalName: submission.journalName,
        manuscriptType: submission.manuscriptType,
        submissionFingerprint: submission.fingerprint,
        readyToSubmit: integrity.readyToSubmit
      });
      res.status(201).json({ success: true, submission: record, integrity, package: submission });
    } catch (error) {
      console.error('Submission lifecycle create error:', error);
      res.status(500).json({ error: 'نەتوانرا submission lifecycle دروست بکرێت.' });
    }
  });

  router.post('/:workspaceId/transition', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }
    const parsed = transitionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای transition نادروستە.', issues: parsed.error.issues });
      return;
    }

    try {
      const current = await publicationSubmissionLifecycleService.get(userId, parsed.data.submissionId);
      if (!current || current.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }

      if (parsed.data.to === 'READY') {
        res.status(400).json({
          error: 'READY تەنها دوای پشکنینی P14 دەتوانرێت بێت.',
          action: 'P14 integrity gate دوبارە جێبەجێ بکە.'
        });
        return;
      }

      if (parsed.data.to === 'RESUBMITTED') {
        res.status(400).json({
          error: 'RESUBMITTED تەنها لە endpoint ـی تایبەت و دوای P14 دەتوانرێت بێت.',
          action: 'endpoint ـی /resubmit بەکاربهێنە.'
        });
        return;
      }

      if (parsed.data.to === 'SUBMITTED') {
        if (!parsed.data.submissionFingerprint) {
          res.status(400).json({
            error: 'submissionFingerprint بۆ ناردنی package پێویستە.',
            action: 'fingerprint ـی package ـی READY بنێرە.'
          });
          return;
        }
        const submission = await publicationSubmissionLifecycleService.submit(
          userId,
          parsed.data.submissionId,
          parsed.data.submissionFingerprint,
          {
            note: parsed.data.note,
            externalReference: parsed.data.externalReference
          }
        );
        res.json({ success: true, submission });
        return;
      }

      const submission = await publicationSubmissionLifecycleService.transition(
        userId,
        parsed.data.submissionId,
        {
          to: parsed.data.to as SubmissionLifecycleStatus,
          note: parsed.data.note,
          externalReference: parsed.data.externalReference
        }
      );
      res.json({ success: true, submission });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transition failed.';
      res.status(409).json({ success: false, error: message });
    }
  });

  router.post('/:workspaceId/:submissionId/initialize-audit', async (req: AuthRequest, res) => {
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
      const submission = await publicationSubmissionLifecycleService.initializeLegacyAudit(userId, submissionId);
      res.json({
        success: true,
        submission,
        message: current.auditHeadHash
          ? 'submission ـەکە پێشتر audit chain ـی هەبوو.'
          : 'legacy audit anchor دروست کرا؛ مێژووی پێش P17 بە تەواوی verified نییە.'
      });
    } catch (error) {
      console.error('Legacy submission audit initialization error:', error);
      res.status(500).json({ error: 'نەتوانرا legacy audit anchor دروست بکرێت.' });
    }
  });

  router.get('/:workspaceId/:submissionId/receipt', async (req: AuthRequest, res) => {
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
      if (!submission.submissionReceiptId) {
        res.status(404).json({ error: 'receipt ـی ناردن هێشتا بوونی نییە.' });
        return;
      }
      const receipt = await publicationSubmissionLifecycleService.getReceipt(
        userId,
        submissionId,
        submission.submissionReceiptId
      );
      if (!receipt) {
        res.status(404).json({ error: 'receipt ـی ناردن نەدۆزرایەوە.' });
        return;
      }

      const verification = verifySubmissionReceipt(receipt, {
        submissionId: submission.id,
        userId,
        workspaceId,
        submissionFingerprint: submission.submissionFingerprint,
        submissionVersionId: submission.currentVersionId
      });
      res.status(verification.status === 'VERIFIED' ? 200 : 409).json({
        success: verification.status === 'VERIFIED',
        receipt,
        verification
      });
    } catch (error) {
      console.error('Submission receipt read error:', error);
      res.status(500).json({ error: 'نەتوانرا receipt ـی ناردن بخوێندرێتەوە.' });
    }
  });

  router.post('/:workspaceId/:submissionId/mark-ready', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;
    if (!lifecycleId.safeParse(workspaceId).success || !lifecycleId.safeParse(submissionId).success) {
      res.status(400).json({ error: 'ناسنامەی submission یان workspace نادروستە.' });
      return;
    }
    const parsed = packageSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای نوێکردنەوەی integrity نادروستە.', issues: parsed.error.issues });
      return;
    }
    const { minKeywords, maxKeywords } = parsed.data.policy;
    if (minKeywords !== undefined && maxKeywords !== undefined && minKeywords > maxKeywords) {
      res.status(400).json({ error: 'کەمترین ژمارەی keyword نابێت لە زۆرترین ژمارە گەورەتر بێت.' });
      return;
    }

    try {
      const current = await publicationSubmissionLifecycleService.get(userId, submissionId);
      if (!current || current.workspaceId !== workspaceId) {
        res.status(404).json({ error: 'submission نەدۆزرایەوە.' });
        return;
      }

      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
      if (control.gates.exportBlocked) {
        res.status(409).json({
          success: false,
          exportBlocked: true,
          controlPlane: control,
          error: 'P9 research validation ـەکە هێشتا ڕێگەی READY نادات.'
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
      if (submission.journalName !== current.journalName || submission.manuscriptType !== current.manuscriptType) {
        res.status(409).json({
          success: false,
          error: 'journal یان جۆری manuscript لە submission ـی هەنووکەیی جیاوازە. submission ـی نوێ دروست بکە.'
        });
        return;
      }

      const record = await publicationSubmissionLifecycleService.markReady(
        userId,
        submissionId,
        submission.fingerprint
      );
      res.json({ success: true, submission: record, integrity, package: submission });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ready promotion failed.';
      res.status(409).json({ success: false, error: message });
    }
  });

  return router;
}
