import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiConfigService } from '../services/api-config.service';
import { externalApiTester } from '../services/external-api-tester';
import {
  centralizedPromptsManager,
  AcademicToneVariant
} from '../prompts/centralized-prompts-manager';
import { requireRole } from '../middleware/rbac.middleware';

const testSingleSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'claude', 'perplexity']).default('gemini'),
  prompt: z.string().trim().min(1).max(5000).default('پرسیاری تاقیکاری زانستی: پوختەیەک بنووسە.')
}).strict();

const variantSchema = z.object({
  variant: z.union([
    z.enum([
      'formal_academic',
      'literary_sorani',
      'simplified_pedagogical',
      'harvard_standard'
    ]),
    z.null()
  ]).optional()
}).strict();

export function createExternalApiRouter(): Router {
  const router = Router();

  router.get(
    '/config-status',
    requireRole('admin', 'professor'),
    (_req: Request, res: Response) => {
      try {
        const providersConfig = apiConfigService.getAllProvidersConfig();
        const abReport = centralizedPromptsManager.getABTestReport();
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          providers: providersConfig,
          abTestReport: abReport
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'هەڵەی نەناسراوی ڕێکخستنی provider.';
        res.status(500).json({ success: false, error: errorMsg });
      }
    }
  );

  router.post(
    '/test-single',
    requireRole('admin', 'professor'),
    async (req: Request, res: Response) => {
      const parsed = testSingleSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'داتای تاقیکردنەوەی provider نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      try {
        const result = await externalApiTester.testProvider(
          parsed.data.provider,
          parsed.data.prompt
        );
        res.json({ success: result.success, result });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'هەڵەی نەناسراوی تاقیکردنەوەی provider.';
        res.status(500).json({ success: false, error: errorMsg });
      }
    }
  );

  router.post(
    '/test-all',
    requireRole('admin', 'professor'),
    async (_req: Request, res: Response) => {
      try {
        const results = await externalApiTester.testAllProviders();
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          results
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'هەڵەی نەناسراوی تاقیکردنەوەی provider ـەکان.';
        res.status(500).json({ success: false, error: errorMsg });
      }
    }
  );

  router.post(
    '/set-ab-variant',
    requireRole('admin', 'professor'),
    (req: Request, res: Response) => {
      const parsed = variantSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'شێوازی A/B نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      try {
        const variant = parsed.data.variant ?? undefined;
        centralizedPromptsManager.setOverrideVariant(variant as AcademicToneVariant | undefined);
        res.json({
          success: true,
          message: variant
            ? `شێوازی تاقیگە گۆڕدرا بۆ: ${variant}`
            : 'شێواز گەڕایەوە بۆ هاوسەنگی خودکار.',
          currentReport: centralizedPromptsManager.getABTestReport()
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'هەڵەی نەناسراوی گۆڕینی شێوازی A/B.';
        res.status(500).json({ success: false, error: errorMsg });
      }
    }
  );

  return router;
}
