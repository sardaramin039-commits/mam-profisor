import { Router } from 'express';
import { z } from 'zod';
import { defenseRehearsalService } from '../services/defense-rehearsal.service';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import { resolveServerVerifiedCitations } from '../services/publication-research-gate.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().trim().min(1).max(128);
const chapter = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000),
  content: z.string().max(500_000),
  citationIds: z.array(id).max(500).default([])
}).strict();

const answer = z.object({
  questionId: id,
  answer: z.string().max(20_000).default('')
}).strict();

const citation = z.object({
  citationId: id,
  sourceId: id,
  inText: z.string().trim().max(500),
  bibliography: z.string().trim().max(5000),
  verified: z.boolean(),
  evidenceId: id.optional()
}).strict();

const schema = z.object({
  topic: z.string().trim().min(2).max(500),
  title: z.string().trim().min(1).max(1000),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  conclusion: z.string().max(100_000).optional(),
  limitations: z.string().max(50_000).optional(),
  contribution: z.string().max(50_000).optional(),
  evidenceSummary: z.string().max(50_000).optional(),
  chapters: z.array(chapter).min(1).max(100),
  citations: z.array(citation).max(500).default([]),
  referencedCitationCount: z.number().int().min(0).max(500),
  verifiedCitationCount: z.number().int().min(0).max(500),
  bibliographyCount: z.number().int().min(0).max(500),
  structuralStatus: z.enum(['PASS', 'REJECT']),
  exportBlocked: z.boolean(),
  answers: z.array(answer).max(20).default([])
}).strict();

export function createDefenseRehearsalRouter(): Router {
  const router = Router();

  router.post('/:workspaceId', async (req: AuthRequest, res) => {
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
      res.status(400).json({ error: 'داتای سێشنی بەرگری نادروستە.', issues: parsed.error.issues });
      return;
    }
    try {
      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
      const citations = await resolveServerVerifiedCitations(
        userId,
        workspaceId,
        parsed.data.citations ?? []
      );
      const manuscript = assembleManuscript({
        projectId: workspaceId,
        title: parsed.data.title,
        researchQuestion: parsed.data.researchQuestion,
        methodology: parsed.data.methodology,
        conclusion: parsed.data.conclusion,
        chapters: parsed.data.chapters,
        citations
      });
      const session = defenseRehearsalService.prepare({
        topic: parsed.data.topic,
        title: manuscript.title,
        researchQuestion: manuscript.sections.find(section => section.type === 'research-question')?.content,
        methodology: manuscript.sections.find(section => section.type === 'methodology')?.content,
        conclusion: manuscript.sections.find(section => section.type === 'conclusion')?.content,
        limitations: parsed.data.limitations,
        contribution: parsed.data.contribution,
        evidenceSummary: parsed.data.evidenceSummary,
        chapterTitles: manuscript.sections
          .filter(section => section.type === 'chapter')
          .sort((a, b) => a.order - b.order)
          .map(item => item.title),
        referencedCitationCount: manuscript.integrity.referencedCitationCount,
        verifiedCitationCount: manuscript.integrity.verifiedCitationCount,
        bibliographyCount: manuscript.integrity.bibliographyCount,
        structuralStatus: manuscript.integrity.structuralStatus,
        exportBlocked: control.gates.exportBlocked || manuscript.integrity.structuralStatus !== 'PASS'
      });

      const questionMap = new Map(session.questions.map(question => [question.id, question]));
      const assessments = parsed.data.answers
        .map(item => questionMap.get(item.questionId) ? defenseRehearsalService.assess(questionMap.get(item.questionId)!, item.answer) : null)
        .filter(Boolean);
      const scores = assessments.map(item => item!.score);
      const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
      const blocked =
        control.gates.exportBlocked ||
        session.readiness.defenseStatus === 'BLOCKED' ||
        session.readiness.publicationStatus === 'BLOCKED';

      res.status(blocked ? 409 : 200).json({
        success: !blocked,
        controlPlane: control,
        readiness: session.readiness,
        questions: session.questions,
        assessments,
        answerSummary: { attempted: assessments.length, averageScore, status: averageScore >= 80 ? 'STRONG' : averageScore >= 55 ? 'ADEQUATE' : 'NEEDS_REHEARSAL' }
      });
    } catch (error) {
      console.error('Defense rehearsal error:', error);
      res.status(500).json({ error: 'نەتوانرا سێشنی بەرگری هەڵسەنگێنرێت.' });
    }
  });

  return router;
}
