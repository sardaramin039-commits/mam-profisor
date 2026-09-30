import { Router } from 'express';
import { z } from 'zod';
import { researchDecisionLedgerService } from '../services/research-decision-ledger.service';
import type { AuthRequest } from '../../middleware/auth';

const decisionSchema = z.object({
  kind: z.enum(['research_question','methodology','source_selection','evidence_interpretation','analysis','writing','citation','revision','other']),
  decision: z.string().trim().min(3).max(5000),
  rationale: z.string().trim().max(10000).default(''),
  evidenceIds: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  conflictingEvidence: z.array(z.string().trim().max(1000)).max(100).default([]),
  impact: z.string().trim().max(5000).default(''),
  actor: z.enum(['user','ai_assistant','reviewer']).default('user')
});

export function createResearchDecisionLedgerRouter(): Router {
  const router = Router();

  router.get('/:projectId', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const projectId = req.params.projectId;
    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    if (!projectId || projectId.length > 128) {
      res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
      return;
    }
    try {
      res.json({ decisions: await researchDecisionLedgerService.list(userId, projectId) });
    } catch (error) {
      console.error('Decision ledger list error:', error);
      res.status(500).json({ error: 'نەتوانرا مێژووی بڕیارەکانی توێژینەوە بخوێندرێتەوە.' });
    }
  });

  router.post('/:projectId', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const projectId = req.params.projectId;
    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    if (!projectId || projectId.length > 128) {
      res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
      return;
    }
    const parsed = decisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای بڕیار نادروستە.', issues: parsed.error.issues });
      return;
    }
    try {
      const decision = await researchDecisionLedgerService.add(userId, projectId, parsed.data);
      res.status(201).json(decision);
    } catch (error) {
      console.error('Decision ledger add error:', error);
      res.status(500).json({ error: 'نەتوانرا بڕیارەکە تۆمار بکرێت.' });
    }
  });

  return router;
}
