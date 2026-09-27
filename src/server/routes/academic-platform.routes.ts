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

export function createAcademicPlatformRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  // 1. Claim-Evidence Graph Engine
  router.post('/evidence-graph', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const { topic, draftText, sources } = req.body;
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
      const { sources } = req.body;
      const result = await sourceVerificationService.verifySources(sources || [], getGeminiClient);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای پشکنینی سەرچاوەکان' });
    }
  });

  // 3. Argument Architecture Generator
  router.post('/argument-builder', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const { topic, discipline } = req.body;
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
      const { draftText, topic } = req.body;
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
      const { documentText, sources } = req.body;
      const qa = await academicQAGateService.runQAGate(
        documentText || '',
        sources || [],
        getGeminiClient
      );
      res.json({ success: true, qa });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای ئامێری QA' });
    }
  });

  // 6. Kurdish Academic Language Engine
  router.post('/kurdish-language', async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
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
      const { query } = req.body;
      const entries = await kurdishKnowledgeGraphService.searchKnowledgeGraph(query || '', getGeminiClient);
      res.json({ success: true, entries });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خەتای گەڕانی فەرهەنگی ئەکادیمی' });
    }
  });

  // 8. Full Multi-Agent Orchestrator Pipeline
  router.post('/multi-agent-orchestrate', requireRole('student', 'researcher', 'professor', 'reviewer', 'admin'), async (req: ExtendedAuthRequest, res: Response): Promise<void> => {
    try {
      const { topic, discipline, draftText, rawSources } = req.body;
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
    const { taskType, textLength } = req.body;
    const config = aiModelRouterService.selectModelForTask(taskType || 'fast', textLength || 0);
    res.json({ success: true, config });
  });

  return router;
}
