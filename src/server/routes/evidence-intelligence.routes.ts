import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { evidenceGroundingService } from '../services/evidence-grounding.service';
import { sourceVerificationService } from '../services/source-verification.service';

const evidenceChunkSchema = z.object({
  sourceId: z.string().trim().min(1).max(200),
  sourceTitle: z.string().trim().min(1).max(1000),
  author: z.string().trim().max(500).optional(),
  year: z.union([z.string().trim(), z.number()]).optional(),
  claimText: z.string().trim().min(1).max(10_000),
  chunkText: z.string().trim().min(10).max(100_000),
  evidenceType: z.enum(['abstract', 'snippet', 'full-text']).default('snippet'),
  // Client requests may describe provenance, but cannot claim server verification.
  provenance: z.enum(['user-supplied-content', 'unknown']).default('unknown'),
  doi: z.string().trim().max(500).optional(),
  isbn: z.string().trim().max(32).optional(),
  issn: z.string().trim().max(32).optional(),
  publisher: z.string().trim().max(500).optional(),
  pageNumber: z.union([z.string(), z.number()]).optional()
}).strict();

const groundedGenerationSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  prompt: z.string().trim().min(1).max(20_000),
  evidenceChunks: z.array(evidenceChunkSchema).max(100)
}).strict();

export function createEvidenceIntelligenceRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.post('/grounded_generate', async (req, res: Response): Promise<void> => {
    const parsed = groundedGenerationSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای Evidence Intelligence نادروستە.',
        details: parsed.error.issues
      });
      return;
    }

    try {
      const verified = await sourceVerificationService.verifySources(
        parsed.data.evidenceChunks.map(chunk => ({
          id: chunk.sourceId,
          sourceId: chunk.sourceId,
          title: chunk.sourceTitle,
          author: chunk.author,
          year: chunk.year,
          claimText: chunk.claimText,
          evidenceText: chunk.chunkText,
          chunkText: chunk.chunkText,
          evidenceType: chunk.evidenceType,
          evidenceProvenance: chunk.provenance,
          doi: chunk.doi,
          isbn: chunk.isbn,
          issn: chunk.issn,
          publisher: chunk.publisher,
          pageNumber: chunk.pageNumber
        })),
        getGeminiClient
      );

      const verifiedIds = new Set(
        verified.citationEligibleSources.map(source => source.sourceId)
      );

      const groundedChunks = parsed.data.evidenceChunks
        .filter(chunk => verifiedIds.has(chunk.sourceId))
        .map(chunk => ({
          ...chunk,
          pageNumber: chunk.pageNumber != null ? String(chunk.pageNumber) : undefined,
          year: chunk.year != null ? String(chunk.year) : undefined,
          verificationStatus: 'unverified' as const,
          evidenceType: 'snippet' as const,
          provenance: 'user-supplied-content' as const
        }));

      const result = await evidenceGroundingService.generateGroundedContent(
        parsed.data.topic,
        parsed.data.prompt,
        groundedChunks,
        getGeminiClient
      );

      res.json({
        success: true,
        ...result,
        sourceVerification: {
          identityVerifiedSources: verified.verifiedSources,
          citationEligibleSources: verified.citationEligibleSources,
          unverifiedSources: verified.unverifiedSources,
          rejectedSources: verified.rejectedSources
        }
      });
    } catch (error) {
      console.error('Evidence Intelligence route error:', error);
      res.status(500).json({
        error: 'نەتوانرا Evidence Intelligence بە شێوەیەکی پارێزراو جێبەجێ بکرێت.'
      });
    }
  });

  return router;
}
