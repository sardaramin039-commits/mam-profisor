import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { evidenceGroundingService } from '../services/evidence-grounding.service';
import { enrichSourcesWithFullText } from '../services/full-text-evidence.service';
import { sourceVerificationService } from '../services/source-verification.service';

const evidenceChunkSchema = z.object({
  sourceId: z.string().trim().min(1).max(200),
  sourceTitle: z.string().trim().min(1).max(1000),
  author: z.string().trim().max(500).optional(),
  year: z.union([z.string().trim(), z.number()]).optional(),
  claimText: z.string().trim().min(1).max(10_000),
  // Kept only for request compatibility. Caller-supplied text is never treated as verified evidence.
  chunkText: z.string().trim().min(10).max(100_000).optional(),
  evidenceType: z.enum(['abstract', 'snippet', 'full-text']).default('snippet'),
  provenance: z.enum([
    'server-verified-fulltext',
    'user-supplied-content',
    'unknown'
  ]).default('unknown'),
  sourceType: z.enum(['PubMed', 'Europe PMC', 'OpenAlex', 'DOAJ']).optional(),
  url: z.string().url().max(2048).optional(),
  pmid: z.string().trim().regex(/^\d{1,12}$/u).optional(),
  pmcid: z.string().trim().regex(/^PMC\d{1,10}$/iu).optional(),
  openAlexId: z.string().trim().regex(/^(?:https:\/\/openalex\.org\/)?W\d+$/iu).optional(),
  doi: z.string().trim().max(500).optional(),
  isbn: z.string().trim().max(32).optional(),
  issn: z.string().trim().max(32).optional(),
  publisher: z.string().trim().max(500).optional(),
  pageNumber: z.union([z.string(), z.number()]).optional()
}).strict();

const groundedGenerationSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  prompt: z.string().trim().min(1).max(20_000),
  // Bound outbound source lookups and per-request memory use.
  evidenceChunks: z.array(evidenceChunkSchema).min(1).max(10)
}).strict();

function toSourceCandidate(chunk: z.infer<typeof evidenceChunkSchema>) {
  return {
    id: chunk.sourceId,
    sourceId: chunk.sourceId,
    title: chunk.sourceTitle,
    author: chunk.author,
    year: chunk.year,
    claimText: chunk.claimText,
    sourceType: chunk.sourceType,
    url: chunk.url,
    pmid: chunk.pmid,
    pmcid: chunk.pmcid,
    openAlexId: chunk.openAlexId,
    doi: chunk.doi,
    isbn: chunk.isbn,
    issn: chunk.issn,
    publisher: chunk.publisher,
    pageNumber: chunk.pageNumber
  };
}

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
      // Retrieve open full text on the server, independently for each claim/source pair.
      // Never promote the request's chunkText or provenance flag to trusted evidence.
      const sourceCandidates = parsed.data.evidenceChunks.map(toSourceCandidate);
      const enrichedSources = await Promise.all(sourceCandidates.map(async (source) => {
        const [enriched] = await enrichSourcesWithFullText([source], [source.claimText]);
        return enriched ?? source;
      }));

      const verified = await sourceVerificationService.verifySources(
        enrichedSources,
        getGeminiClient
      );

      const groundedChunks = parsed.data.evidenceChunks.flatMap((chunk, index) => {
        const enriched = enrichedSources[index];
        const report = verified.citationEligibleSources.find(source =>
          source.sourceId === chunk.sourceId &&
          source.evidenceText === enriched?.evidenceText &&
          source.evidenceType === 'full-text' &&
          source.evidenceProvenance === 'server-verified-fulltext' &&
          Boolean(source.evidenceText?.trim())
        );

        if (!report?.evidenceText) return [];

        return [{
          sourceId: report.sourceId,
          sourceTitle: report.sourceTitle,
          chunkText: report.evidenceText,
          author: report.author,
          year: report.year,
          pageNumber: report.pageNumber != null ? String(report.pageNumber) : undefined,
          evidenceType: 'full-text' as const,
          provenance: 'server-verified-fulltext' as const,
          verificationStatus: 'verified' as const
        }];
      });

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
