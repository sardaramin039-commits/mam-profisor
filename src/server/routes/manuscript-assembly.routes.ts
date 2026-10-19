import { Router } from 'express';
import { z } from 'zod';
import {
  assembleManuscript,
  persistAssembledManuscript
} from '../services/manuscript-assembly.service';
import { ResearchMemoryItem, researchMemoryService } from '../services/research-memory.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().trim().min(1).max(128);

const chapterSchema = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000),
  content: z.string().max(500_000),
  citationIds: z.array(id).max(500).default([])
}).strict();

const citationSchema = z.object({
  citationId: id,
  sourceId: id,
  inText: z.string().trim().max(500),
  bibliography: z.string().trim().max(5000),
  verified: z.boolean(),
  evidenceId: id.optional()
}).strict();

const assembleSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  abstract: z.string().max(100_000).optional(),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  chapters: z.array(chapterSchema).min(1).max(100),
  conclusion: z.string().max(100_000).optional(),
  citations: z.array(citationSchema).max(500).default([])
}).strict();

async function resolveServerVerifiedCitations(
  userId: string,
  workspaceId: string,
  citations: z.infer<typeof citationSchema>[]
): Promise<z.infer<typeof citationSchema>[]> {
  const memory = await researchMemoryService.hydrateProjectState(userId, workspaceId);
  const evidenceById = new Map<string, ResearchMemoryItem>(
    memory.memoryItems
      .filter(item => item.type === 'evidence' && item.metadata?.['verified'] === true)
      .map((item): [string, ResearchMemoryItem] => [
        String(item.metadata?.['evidenceId'] || ''),
        item
      ])
      .filter(([evidenceId]) => Boolean(evidenceId))
  );

  return citations.map(citation => {
    const evidence = citation.evidenceId ? evidenceById.get(citation.evidenceId) : undefined;
    const sourceMatches = evidence
      ? String(evidence.metadata?.['sourceId'] || '') === citation.sourceId
      : false;
    return {
      ...citation,
      verified: Boolean(evidence && sourceMatches)
    };
  });
}

export function createManuscriptAssemblyRouter(): Router {
  const router = Router();

  router.post('/:workspaceId/assemble', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const workspaceId = req.params['workspaceId'];

    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }

    const idCheck = id.safeParse(workspaceId);
    if (!idCheck.success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }

    const parsed = assembleSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای manuscript نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
      const serverVerifiedCitations = await resolveServerVerifiedCitations(
        userId,
        workspaceId,
        parsed.data.citations
      );
      const manuscript = assembleManuscript({
        projectId: workspaceId,
        ...parsed.data,
        citations: serverVerifiedCitations
      });

      const exportBlocked = control.gates.exportBlocked || manuscript.integrity.structuralStatus !== 'PASS';
      if (exportBlocked) {
        res.status(409).json({
          success: false,
          exportBlocked: true,
          controlPlane: control,
          manuscript
        });
        return;
      }

      try {
        const persisted = await persistAssembledManuscript(userId, manuscript);
        res.status(200).json({
          success: true,
          exportBlocked: false,
          persisted,
          controlPlane: control,
          manuscript
        });
      } catch (persistenceError: unknown) {
        console.error('Manuscript persistence error:', persistenceError);
        res.status(503).json({
          success: false,
          exportBlocked: true,
          persistenceRequired: true,
          error: 'پاشەکەوتکردنی manuscript ـی پشتڕاستکراو سەرکەوتوو نەبوو؛ export بە شێوەی پارێزراو داخراوە.',
          controlPlane: control,
          manuscript
        });
      }
    } catch (error) {
      console.error('Manuscript assembly error:', error);
      res.status(500).json({ error: 'نەتوانرا manuscript کۆبکرێتەوە.' });
    }
  });

  return router;
}
