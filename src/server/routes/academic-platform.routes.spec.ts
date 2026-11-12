import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock('../../middleware/auth', () => ({
  requireAuth: mocks.requireAuth
}));

import { createAcademicPlatformRouter } from './academic-platform.routes';

let server: Server | undefined;

async function buildServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/platform', createAcademicPlatformRouter(() => {
    throw new Error('AI provider must not be called in this authentication test');
  }));

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
  vi.resetAllMocks();
  mocks.requireAuth.mockImplementation((
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (req.headers.authorization !== 'Bearer verified-test-token') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    (req as Request & { user?: { uid: string } }).user = { uid: 'verified-test-user' };
    next();
  });
  server = await buildServer();
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('academic platform authentication boundary', () => {
  it('rejects anonymous evidence-generation requests before running a handler', async () => {
    const response = await fetch(`${await baseUrl()}/api/platform/evidence-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'test topic', draftText: '', sources: [] })
    });

    expect(response.status).toBe(401);
  });

  it('rejects anonymous academic-review requests before invoking model services', async () => {
    const response = await fetch(`${await baseUrl()}/api/platform/academic-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'test topic', draftText: 'test draft', verifiedSources: [] })
    });

    expect(response.status).toBe(401);
  });
});
