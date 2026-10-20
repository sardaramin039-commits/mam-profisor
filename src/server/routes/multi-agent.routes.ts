import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';
import { AgentStageExecutionError } from '../services/multi-agent-execution-policy.service';

const orchestrationSchema = z.object({
  topic: z.string().trim().min(2).max(500),
  discipline: z.string().trim().max(200).default('گشتی'),
  draftText: z.string().max(250_000).default(''),
  rawSources: z.array(z.record(z.string(), z.unknown())).max(100).default([]),
  citationStyle: z.enum(['APA7', 'MLA9', 'ChicagoAD', 'ChicagoNB', 'Harvard', 'IEEE']).default('APA7')
}).strict();

export function createMultiAgentRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.post('/orchestrate', async (req, res) => {
    const parsed = orchestrationSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ئۆرکێستراکردنی Multi-Agent نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    const controller = new AbortController();
    const abortIfDisconnected = () => {
      if (!res.writableEnded) controller.abort(new Error('client disconnected'));
    };
    req.once('aborted', abortIfDisconnected);
    res.once('close', abortIfDisconnected);

    try {
      const result = await multiAgentOrchestratorService.executePipeline(
        parsed.data,
        getGeminiClient,
        controller.signal
      );
      if (!res.destroyed && !res.headersSent) res.json({ success: true, result });
    } catch (err: unknown) {
      if (err instanceof AgentStageExecutionError) {
        if (!res.destroyed && !res.headersSent) {
          res.status(err.httpStatus).json({
            error: err.receipt.status === 'timed_out'
              ? 'یەکێک لە قۆناغەکانی بریکارەکان کاتی پێویستی تێپەڕاند.'
              : err.receipt.status === 'cancelled'
                ? 'داواکاریی بریکارەکان هەڵوەشایەوە.'
                : 'قۆناغێکی بریکار شکستی هێنا.',
            executionReceipt: err.receipt
          });
        }
      } else {
        console.error('MultiAgent Route Error:', err);
        if (!res.destroyed && !res.headersSent) {
          res.status(500).json({
            error: 'کێشەیەک لە ڕێکخستنی بریکارەکاندا دروست بوو.'
          });
        }
      }
    } finally {
      req.removeListener('aborted', abortIfDisconnected);
      res.removeListener('close', abortIfDisconnected);
    }
  });

  return router;
}
