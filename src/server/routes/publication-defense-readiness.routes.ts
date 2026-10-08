import { Router } from 'express';
import { z } from 'zod';
import { evaluatePublicationDefenseReadiness } from '../services/publication-defense-readiness.service';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().trim().min(1).max(128);
const chapter = z.object({ id, title: z.string().trim().min(1).max(500), order: z.number().int().min(1).max(1000), content: z.string().max(500_000), citationIds: z.array(id).max(500).default([]) }).strict();
const citation = z.object({ citationId: id, sourceId: id, inText: z.string().trim().max(500), bibliography: z.string().trim().max(5000), verified: z.boolean(), evidenceId: id.optional() }).strict();
const schema = z.object({
  title: z.string().trim().min(1).max(1000),
  abstract: z.string().max(100_000).optional(),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  chapters: z.array(chapter).min(1).max(100),
  conclusion: z.string().max(100_000).optional(),
  citations: z.array(citation).max(500).default([]),
  overallQAScore: z.number().min(0).max(100).optional(),
  criticalViolationsCount: z.number().int().min(0).max(1000).optional(),
  topic: z.string().trim().max(500).optional()
}).strict();

export function createPublicationDefenseReadinessRouter(): Router {
  const router = Router();

  router.post('/:workspaceId/readiness', async (req: AuthRequest, res) => {
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
      res.status(400).json({ error: 'داتای readiness نادروستە.', issues: parsed.error.issues });
      return;
    }
    try {
      const manuscript = assembleManuscript({ projectId: workspaceId, ...parsed.data });
      const report = evaluatePublicationDefenseReadiness({
        title: manuscript.title,
        abstract: manuscript.sections.find(section => section.type === 'abstract')?.content,
        researchQuestion: manuscript.sections.find(section => section.type === 'research-question')?.content,
        methodology: manuscript.sections.find(section => section.type === 'methodology')?.content,
        conclusion: manuscript.sections.find(section => section.type === 'conclusion')?.content,
        chapterCount: manuscript.integrity.chapterCount,
        referencedCitationCount: manuscript.integrity.referencedCitationCount,
        verifiedCitationCount: manuscript.integrity.verifiedCitationCount,
        bibliographyCount: manuscript.integrity.bibliographyCount,
        structuralStatus: manuscript.integrity.structuralStatus,
        exportBlocked: manuscript.integrity.structuralStatus !== 'PASS',
        overallQAScore: parsed.data.overallQAScore,
        criticalViolationsCount: parsed.data.criticalViolationsCount,
        topic: parsed.data.topic || manuscript.title
      });
      const blocked = report.publicationStatus === 'BLOCKED';
      res.status(blocked ? 409 : 200).json({ success: !blocked, report, manuscriptIntegrity: manuscript.integrity });
    } catch (error) {
      console.error('Publication defense readiness error:', error);
      res.status(500).json({ error: 'نەتوانرا ئاستی ئامادەبوونی بەرگری و بڵاوکردنەوە هەڵسەنگێنرێت.' });
    }
  });

  return router;
}
