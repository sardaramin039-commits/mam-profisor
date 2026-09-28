import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { ExtendedAuthRequest, requireRole } from '../middleware/rbac.middleware';
import { claimEvidenceGraphService } from '../services/claim-evidence-graph.service';
import { sourceVerificationService } from '../services/source-verification.service';
import { academicWritingEngineService } from '../services/academic-writing-engine.service';
import { academicReviewerService } from '../services/academic-reviewer.service';
import { academicQAGateService } from '../services/academic-qa-gate.service';
import { kurdishAcademicLanguageService } from '../services/kurdish-academic-language.service';
import { kurdishKnowledgeGraphService } from '../services/kurdish-knowledge-graph.service';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';
import { observabilityService } from '../services/observability.service';
import { aiModelRouterService } from '../services/ai-model-router.service';
import { z } from 'zod';

const textField = (max: number) => z.string().trim().min(1).max(max);
const sourceSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  author: z.string().max(500).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  doi: z.string().max(500).optional(),
  publisher: z.string().max(500).optional()
}).passthrough();
const sourceArray = z.array(sourceSchema).max(100);

const evidenceGraphSchema = z.object({ topic: textField(500), draftText: z.string().max(250_000).default(''), sources: sourceArray.default([]) }).strict();
const sourceVerificationSchema = z.object({ sources: sourceArray.default([]) }).strict();
const academicReviewSchema = z.object({ draftText: textField(250_000), topic: textField(500) }).strict();
const qaGateSchema = z.object({ documentText: textField(250_000), sources: sourceArray.default([]) }).strict();
const kurdishLanguageSchema = z.object({ text: textField(250_000) }).strict();
const knowledgeGraphSchema = z.object({ query: textField(500) }).strict();
const argumentBuilderSchema = z.object({ topic: textField(500), discipline: textField(200) }).strict();
const orchestrationSchema = z.object({
  topic: textField(500),
  discipline: textField(200),
  draftText: z.string().max(250_000).default(''),
  rawSources: sourceArray.default([])
}).strict();
const modelRouterSchema = z.object({ taskType: z.enum(['fast', 'reasoning', 'long_context', 'embedding']).default('fast'), textLength: z.coerce.number().int().min(0).max(1_000_000).default(0) }).strict();

export function createAcademicPlatformRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  // 1. Claim-Evidence Graph Engine
  router.post('/evidence-graph', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const evidenceGraphSchemaParsed = evidenceGraphSchema.safeParse(req.body ?? {});
      if (!evidenceGraphSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: evidenceGraphSchemaParsed.error.issues });
        return;
      }
      const { topic, draftText, sources } = evidenceGraphSchemaParsed.data;
      const graph = await claimEvidenceGraphService.buildGraph(
        topic || 'تێزی زانستی',
        draftText || '',
        sources || [],
        getGeminiClient
      );
      res.json({ success: true, graph });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای دروستکردنی گرافی بەڵگەکان' });
    }
  });

  // 2. Academic Source Verification 2.0
  router.post('/source-verification', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const sourceVerificationSchemaParsed = sourceVerificationSchema.safeParse(req.body ?? {});
      if (!sourceVerificationSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: sourceVerificationSchemaParsed.error.issues });
        return;
      }
      const { sources } = sourceVerificationSchemaParsed.data;
      const result = await sourceVerificationService.verifySources(sources || [], getGeminiClient);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای پشکنینی سەرچاوەکان' });
    }
  });

  // 3. Argument Architecture Generator
  router.post('/argument-builder', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const argumentBuilderSchemaParsed = argumentBuilderSchema.safeParse(req.body ?? {});
      if (!argumentBuilderSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ دروستکردنی ئارگومێنت نادروستە.', details: argumentBuilderSchemaParsed.error.issues });
        return;
      }
      const { topic, discipline } = argumentBuilderSchemaParsed.data;
      const plan = await academicWritingEngineService.generateArgumentArchitecture(
        topic || 'بابەتی زانستی',
        discipline || 'توێژینەوەی گشتی',
        getGeminiClient
      );
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای دروستکردنی ئارگومێنت' });
    }
  });

  // 4. Academic Reviewer Engine (AI Professor)
  router.post('/academic-review', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const academicReviewSchemaParsed = academicReviewSchema.safeParse(req.body ?? {});
      if (!academicReviewSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: academicReviewSchemaParsed.error.issues });
        return;
      }
      const { draftText, topic } = academicReviewSchemaParsed.data;
      const report = await academicReviewerService.evaluateThesis(
        draftText || '',
        topic || 'تێز',
        getGeminiClient
      );
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای هەڵسەنگاندنی ئەکادیمی' });
    }
  });

  // 5. Automated QA Gate
  router.post('/qa-gate', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const qaGateSchemaParsed = qaGateSchema.safeParse(req.body ?? {});
      if (!qaGateSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: qaGateSchemaParsed.error.issues });
        return;
      }
      const { documentText, sources } = qaGateSchemaParsed.data;

      // Never trust a client-provided verification flag. Re-run authoritative
      // source verification on the server before allowing the QA gate to pass.
      const verification = await sourceVerificationService.verifySources(
        sources || [],
        getGeminiClient
      );

      const qa = await academicQAGateService.runQAGate(
        documentText || '',
        verification.verifiedSources,
        getGeminiClient
      );

      res.json({
        success: true,
        qa,
        sourceVerification: {
          verifiedSources: verification.verifiedSources,
          unverifiedSources: verification.unverifiedSources,
          rejectedSources: verification.rejectedSources
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای ئامێری QA' });
    }
  });

  // 6. Kurdish Academic Language Engine
  router.post('/kurdish-language', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const kurdishLanguageSchemaParsed = kurdishLanguageSchema.safeParse(req.body ?? {});
      if (!kurdishLanguageSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: kurdishLanguageSchemaParsed.error.issues });
        return;
      }
      const { text } = kurdishLanguageSchemaParsed.data;
      const analysis = await kurdishAcademicLanguageService.analyzeAndRefineLanguage(
        text || '',
        getGeminiClient
      );
      res.json({ success: true, analysis });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای شیکاری زمانی کوردی' });
    }
  });

  // 7. Kurdish Academic Knowledge Graph Search
  router.post('/kurdish-knowledge-graph', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const knowledgeGraphSchemaParsed = knowledgeGraphSchema.safeParse(req.body ?? {});
      if (!knowledgeGraphSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: knowledgeGraphSchemaParsed.error.issues });
        return;
      }
      const { query } = knowledgeGraphSchemaParsed.data;
      const entries = await kurdishKnowledgeGraphService.searchKnowledgeGraph(query || '', getGeminiClient);
      res.json({ success: true, entries });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای گەڕانی فەرهەنگی ئەکادیمی' });
    }
  });

  // 8. Full Multi-Agent Orchestrator Pipeline
  router.post('/multi-agent-orchestrate', requireRole('student', 'researcher', 'professor', 'reviewer', 'admin'), async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const orchestrationSchemaParsed = orchestrationSchema.safeParse(req.body ?? {});
      if (!orchestrationSchemaParsed.success) {
        res.status(400).json({ error: 'داتای ناردراو بۆ ئەم کارە نادروستە.', details: orchestrationSchemaParsed.error.issues });
        return;
      }
      const { topic, discipline, draftText, rawSources } = orchestrationSchemaParsed.data;
      const result = await multiAgentOrchestratorService.executePipeline(
        { topic, discipline, draftText, rawSources },
        getGeminiClient
      );
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای ئۆرکێستراکردنی بەشەکانی ژیریی دەستکرد' });
    }
  });

  // 9. Observability & Telemetry API
  router.get('/telemetry', requireRole('admin', 'professor'), (_req: ExtendedAuthRequest, res: Response): void => {
    const summary = observabilityService.getSummary();
    res.json({ success: true, telemetry: summary });
  });

  // 10. AI Model Router Config API
  router.post('/model-router', (req: ExtendedAuthRequest, res: Response): void => {
    const parsed = modelRouterSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای model-router نادروستە.', details: parsed.error.issues });
      return;
    }
    const config = aiModelRouterService.selectModelForTask(parsed.data.taskType, parsed.data.textLength);
    res.json({ success: true, config });
  });

  return router;
}
