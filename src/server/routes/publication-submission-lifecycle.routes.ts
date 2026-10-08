import { Router } from 'express';
import { z } from 'zod';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from '../services/publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from '../services/publication-submission-integrity.service';
import { publicationSubmissionLifecycleService } from '../services/publication-submission-lifecycle.service';
import type { SubmissionLifecycleStatus } from '../services/publication-submission-lifecycle.policy';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/u);
const sectionType = z.enum(['abstract','research-question','methodology','chapter','conclusion']);
const chapter = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000),
  content: z.string().max(500_000),
  citationIds: z.array(id).max(500).default([])
}).strict();
const citation = z.object({
  citationId: id,
  sourceId: id,
  inText: z.string().trim().max(500),
  bibliography: z.string().trim().max(5000),
  verified: z.boolean(),
  evidenceId: id.optional()
}).strict();
const author = z.object({
  name: z.string().trim().min(1).max(500),
  affiliation: z.string().trim().max(500).optional(),
  email: z.string().email().max(320).optional(),
  orcid: z.string().trim().max(100).optional()
}).strict();
const policy = z.object({
  journalName: z.string().trim().min(1).max(1000),
  manuscriptType: z.enum(['article','review','thesis','book-chapter']).default('article'),
  maxWords: z.number().int().positive().max(2_000_000).optional(),
  maxAbstractWords: z.number().int().positive().max(50_000).optional(),
  minKeywords: z.number().int().min(0).max(100).optional(),
  maxKeywords: z.number().int().min(0).max(100).optional(),
  maxReferences: z.number().int().min(0).max(100_000).optional(),
  blindedReview: z.boolean().default(false),
  requiredSections: z.array(sectionType).max(10).optional(),
  requireCoverLetter: z.boolean().default(false),
  requireAuthorMetadata: z.boolean().default(false)
}).strict();
const packageSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  abstract: z.string().max(100_000).optional(),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  chapters: z.array(chapter).min(1).max(100),
  conclusion: z.string().max(100_000).optional(),
  citations: z.array(citation).max(500).default([]),
  keywords: z.array(z.string().trim().max(200)).max(100).default([]),
  authors: z.array(author).max(100).default([]),
  policy
}).strict();
const transitionSchema = z.object({
  submissionId: id,
  to: z.enum([
    'DRAFT','READY','SUBMITTED','UNDER_REVIEW','REVISION_REQUESTED',
    'RESUBMITTED','ACCEPTED','REJECTED','WITHDRAWN'
  ]),
  note: z.string().trim().max(5000).optional(),
  externalReference: z.string().trim().max(500).optional()
}).strict();

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

  router.get('/:workspaceId', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    if (!userId) return;
    if (!id.safeParse(workspaceId).success) {
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
    if (!id.safeParse(workspaceId).success) {
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
    if (!id.safeParse(workspaceId).success) {
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

  router.post('/:workspaceId/:submissionId/mark-ready', async (req: AuthRequest, res) => {
    const userId = requireUser(req, res);
    const workspaceId = req.params['workspaceId'];
    const submissionId = req.params['submissionId'];
    if (!userId) return;
    if (!id.safeParse(workspaceId).success || !id.safeParse(submissionId).success) {
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
