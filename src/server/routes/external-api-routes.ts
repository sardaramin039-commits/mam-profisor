import { Router, Request, Response } from 'express';
import { apiConfigService, AiProvider } from '../services/api-config.service';
import { externalApiTester } from '../services/external-api-tester';
import { centralizedPromptsManager, AcademicToneVariant } from '../prompts/centralized-prompts-manager';

export function createExternalApiRouter(): Router {
  const router = Router();

  /**
   * GET /api/external-integrations/config-status
   * Returns current status and masked keys for all AI providers
   */
  router.get('/config-status', (_req: Request, res: Response) => {
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
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  /**
   * POST /api/external-integrations/test-single
   * Runs connectivity & health test on a single provider
   */
  router.post('/test-single', async (req: Request, res: Response) => {
    try {
      const provider = (req.body?.provider || 'gemini') as AiProvider;
      const testPrompt = req.body?.prompt || 'پرسیاری تاقیکاری زانستی: پوختەیەک بنووسە.';

      const result = await externalApiTester.testProvider(provider, testPrompt);
      res.json({
        success: result.success,
        result
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  /**
   * POST /api/external-integrations/test-all
   * Runs connectivity & health test on all 4 providers
   */
  router.post('/test-all', async (req: Request, res: Response) => {
    try {
      const results = await externalApiTester.testAllProviders();
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  /**
   * POST /api/external-integrations/set-ab-variant
   * Set or reset the manual A/B testing tone override
   */
  router.post('/set-ab-variant', (req: Request, res: Response) => {
    try {
      const variant = req.body?.variant as AcademicToneVariant | undefined;
      centralizedPromptsManager.setOverrideVariant(variant);

      res.json({
        success: true,
        message: variant ? `شێوازی تاقیگە گۆڕدرا بۆ: ${variant}` : 'شێواز گەڕایەوە بۆ هاوسەنگی خودکار (Auto Weighted A/B)',
        currentReport: centralizedPromptsManager.getABTestReport()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  return router;
}
