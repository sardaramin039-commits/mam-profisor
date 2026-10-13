import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateRequest } from '../../middleware/validate.middleware';
import { evidenceGroundingService } from '../services/evidence-grounding.service';
import { downgradeUntrustedEvidence } from '../services/untrusted-evidence';
import { groundedGenerationSchema } from '../utils/thesis-writing.schemas';

export function createGroundedGenerationRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.post('/grounded_generate', validateRequest(groundedGenerationSchema), async (req, res) => {
    try {
      const { topic, prompt, evidenceChunks } = req.body;
      if (!topic || !prompt) {
        res.status(400).json({ error: 'تەوەرە (topic) و داواکاری (prompt) پێویستن.' });
        return;
      }

      // Browser-provided text is only a candidate; never trust its verification flags.
      const safeEvidenceChunks = (Array.isArray(evidenceChunks) ? evidenceChunks : [])
        .filter((item: unknown): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object' && !Array.isArray(item))
        )
        .map((item: Record<string, unknown>) => {
          const source = downgradeUntrustedEvidence(item);
          return {
            sourceId: String(source['sourceId'] || ''),
            sourceTitle: String(source['sourceTitle'] || ''),
            chunkText: String(source['chunkText'] || ''),
            verificationStatus: 'unverified' as const,
            pageNumber: source['pageNumber'] == null ? undefined : String(source['pageNumber']),
            author: typeof source['author'] === 'string' ? source['author'] : undefined,
            year: source['year'] == null ? undefined : String(source['year']),
            evidenceType: 'snippet' as const,
            provenance: 'user-supplied-content' as const
          };
        })
        .filter((item: { sourceId: string; sourceTitle: string; chunkText: string }) =>
          item.sourceId.trim() !== '' &&
          item.sourceTitle.trim() !== '' &&
          item.chunkText.trim() !== ''
        );

      const result = await evidenceGroundingService.generateGroundedContent(
        topic,
        prompt,
        safeEvidenceChunks,
        getGeminiClient
      );
      res.json(result);
    } catch (err: unknown) {
      console.error('Grounded generate error:', err);
      res.status(500).json({ error: 'کێشەیەک لە دروستکردنی دەقی بنەماپێدراو لەسەر بەڵگەکان ڕوویدا.' });
    }
  });

  return router;
}
