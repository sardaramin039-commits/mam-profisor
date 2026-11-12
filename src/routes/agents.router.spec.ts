import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runAgent: vi.fn(),
  requireAuth: vi.fn()
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: mocks.requireAuth
}));

vi.mock('../services/academic-agents.service', () => ({
  academicAgentsService: { runAgent: mocks.runAgent },
  ACADEMIC_AGENTS_LIST: [{
    id: 'literature-review',
    name: 'پێداچوونەوەی ئەدەبیات',
    category: 'توێژینەوە',
    description: 'تاقیکردنەوە'
  }]
}));

import { agentsRouter } from './agents.router';

let server: Server | undefined;

async function buildTestServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/agents', agentsRouter);

  const listeningServer = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    listeningServer.once('listening', resolve);
    listeningServer.once('error', reject);
  });
  return listeningServer;
}

async function baseUrl(): Promise<string> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(): Promise<void> {
  if (!server) return;
  await new Promise<void>((resolve, reject) =>
    server!.close(error => error ? reject(error) : resolve())
  );
  server = undefined;
}

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.requireAuth.mockImplementation((
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
  mocks.runAgent.mockResolvedValue({ status: 'generated', content: 'وەڵامی تاقیکراو' });
  server = await buildTestServer();
});

afterEach(async () => {
  await closeServer();
});

describe('Academic agent API protection', () => {
  it('rejects agent execution without authentication', async () => {
    const response = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'literature-review', prompt: 'پرسیاری تاقیکردنەوە' })
    });

    expect(response.status).toBe(401);
    expect(mocks.runAgent).not.toHaveBeenCalled();
  });

  it('rejects unknown agents and oversized inputs before calling the AI provider', async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' };
    const unknownAgent = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agentId: 'not-an-agent', prompt: 'پرسیاری تاقیکردنەوە' })
    });
    const oversizedPrompt = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agentId: 'literature-review', prompt: 'پ'.repeat(20_001) })
    });
    const oversizedContext = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId: 'literature-review',
        prompt: 'پرسیاری تاقیکردنەوە',
        context: 'پ'.repeat(40_001)
      })
    });

    expect(unknownAgent.status).toBe(400);
    expect(oversizedPrompt.status).toBe(400);
    expect(oversizedContext.status).toBe(400);
    expect(mocks.runAgent).not.toHaveBeenCalled();
  });

  it('reports generated and degraded states separately', async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' };
    const generated = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agentId: 'literature-review', prompt: 'پرسیاری تاقیکردنەوە' })
    });
    expect(generated.status).toBe(200);
    expect(await generated.json()).toMatchObject({ success: true, status: 'generated' });

    mocks.runAgent.mockResolvedValue({
      status: 'degraded',
      content: 'وەڵامی AI بەردەست نییە'
    });
    const degraded = await fetch(`${await baseUrl()}/api/agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agentId: 'literature-review', prompt: 'پرسیاری تاقیکردنەوە' })
    });
    expect(degraded.status).toBe(503);
    expect(await degraded.json()).toMatchObject({ success: false, status: 'degraded' });
  });
});
