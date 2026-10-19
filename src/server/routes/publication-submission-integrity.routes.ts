import { Router } from 'express';
import { z } from 'zod';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from '../services/publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from '../services/publication-submission-integrity.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import { resolveServerVerifiedCitations } from '../services/publication-research-gate.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().trim().min(1).max(128);
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

const schema = z.object({
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

export function createPublicationSubmissionIntegrityRouter(): Router {
  const router = Router();

  router.post('/:workspaceId/integrity', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const workspaceId = req.params['workspaceId'];

    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    if (!id.safeParse(workspaceId).success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }

    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای submission integrity نادروستە.', issues: parsed.error.issues });
      return;
    }
    if (
      parsed.data.policy.minKeywords !== undefined &&
      parsed.data.policy.maxKeywords !== undefined &&
      parsed.data.policy.minKeywords > parsed.data.policy.maxKeywords
    ) {
      res.status(400).json({ error: 'کەمترین ژمارەی keyword نابێت لە زۆرترین ژمارە گەورەتر بێت.' });
      return;
    }

    try {
      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
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

      const blocked = control.gates.exportBlocked || !integrity.readyToSubmit;
      res.status(blocked ? 409 : 200).json({
        success: !blocked,
        exportBlocked: control.gates.exportBlocked,
        controlPlane: control,
        integrity,
        package: submission
      });
    } catch (error) {
      console.error('Publication submission integrity error:', error);
      res.status(500).json({ error: 'نەتوانرا submission integrity پشکنرێت.' });
    }
  });

  return router;
}
