import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
vi.mock('../../middleware/auth', () => ({ requireAuth: authMocks.requireAuth }));

import { createPlagiarismRouter } from './plagiarism.routes';

let server: Server | undefined;
let generateContent: ReturnType<typeof vi.fn>;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api', createPlagiarismRouter(() => ({
    models: { generateContent }
  } as never)));
  const instance = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    instance.once('listening', resolve);
    instance.once('error', reject);
  });
  return instance;
}

async function baseUrl(): Promise<string> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(async () => {
  authMocks.requireAuth.mockImplementation((
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (req.headers.authorization !== 'Bearer test-token') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    (req as Request & { user?: { uid: string } }).user = { uid: 'test-user' };
    next();
  });
  generateContent = vi.fn().mockRejectedValue(new Error('provider unavailable'));
  server = await startServer();
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('plagiarism screening factuality', () => {
  it('never returns a numeric originality score without a real comparison corpus', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        originalityScore: 97,
        plagiarismRisk: 'نزم',
        matchesCount: 0,
        detailedAnalysis: 'AI qualitative commentary'
      })
    });

    const response = await fetch(`${await baseUrl()}/api/plagiarism_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        title: 'Test document',
        content: 'A sufficiently long academic text that is not compared against a verified corpus of source documents.'
      })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      status: 'qualitative-review-only',
      originalityScore: null,
      plagiarismRisk: 'نەپشکنراو',
      aiQualitativeRiskSuggestion: 'نزم',
      matchesCount: null,
      analysisMode: 'ai-qualitative-no-external-corpus',
      corpusCoverage: 0
    });
  });

  it('does not report a fabricated originality score when AI is unavailable and no corpus is connected', async () => {
    const response = await fetch(`${await baseUrl()}/api/plagiarism_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        title: 'Test document',
        content: 'A sufficiently long academic text that must not be labelled as original without comparing against any real reference corpus.'
      })
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      success: false,
      status: 'degraded',
      originalityScore: null,
      plagiarismRisk: 'نەپشکنراو',
      analysisMode: 'unavailable',
      corpusCoverage: 0
    });
  });
});
