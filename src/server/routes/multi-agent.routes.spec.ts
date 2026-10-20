import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ executePipeline: vi.fn() }));
vi.mock('../services/multi-agent-orchestrator.service', () => ({
  multiAgentOrchestratorService: { executePipeline: mocks.executePipeline }
}));

import { AgentStageExecutionError, type AgentStageReceipt } from '../services/multi-agent-execution-policy.service';
import { createMultiAgentRouter } from './multi-agent.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/multi-agent', createMultiAgentRouter(() => ({} as never)));
  const instance = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    instance.once('listening', resolve);
    instance.once('error', reject);
  });
  return instance;
}

async function post(body: Record<string, unknown>): Promise<Response> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return fetch(`http://127.0.0.1:${address.port}/api/multi-agent/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('multi-agent orchestration control plane route', () => {
  it('passes an AbortSignal into the bounded orchestrator', async () => {
    server = await startServer();
    mocks.executePipeline.mockResolvedValueOnce({
      executionReceipts: [],
      agentHandoffs: [],
      finalThesisDraftKurdish: 'ڕەشنووس'
    });
    const response = await post({ topic: 'AI in education' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.executePipeline).toHaveBeenCalledTimes(1);
    expect(mocks.executePipeline.mock.calls[0][2]).toBeInstanceOf(AbortSignal);
  });

  it('returns a typed 504 receipt for timed-out stages instead of an opaque 500', async () => {
    server = await startServer();
    const receipt: AgentStageReceipt = {
      stageId: 'professor_review',
      agentName: 'Professor Reviewer Agent',
      status: 'timed_out',
      attempts: 1,
      retryCount: 0,
      timeoutMs: 90_000,
      durationMs: 90_000,
      startedAt: '2026-10-20T00:00:00.000Z',
      finishedAt: '2026-10-20T00:01:30.000Z',
      inputFingerprint: 'a'.repeat(64),
      errorCode: 'timeout'
    };
    mocks.executePipeline.mockRejectedValueOnce(new AgentStageExecutionError(receipt));
    const response = await post({ topic: 'AI in education' });
    const body = await response.json();
    expect(response.status).toBe(504);
    expect(body.executionReceipt).toMatchObject({
      stageId: 'professor_review',
      status: 'timed_out',
      errorCode: 'timeout'
    });
  });

  it('rejects unknown orchestration fields', async () => {
    server = await startServer();
    const response = await post({ topic: 'AI in education', fakeApproval: true });
    expect(response.status).toBe(400);
    expect(mocks.executePipeline).not.toHaveBeenCalled();
  });
});
