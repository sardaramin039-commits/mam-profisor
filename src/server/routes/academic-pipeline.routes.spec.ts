import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  executeAcademicPipeline: vi.fn()
}));

vi.mock('../services/academic-pipeline.service', () => ({
  executeAcademicPipeline: mocks.executeAcademicPipeline
}));

import { createAcademicPipelineRouter } from './academic-pipeline.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/academic-pipeline', createAcademicPipelineRouter());
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
  server = await startServer();
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('academic pipeline SSE route', () => {
  it('rejects invalid input before starting any model work', async () => {
    const response = await fetch(`${await baseUrl()}/api/academic-pipeline/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', level: 'unrecognized' })
    });

    expect(response.status).toBe(400);
    expect(mocks.executeAcademicPipeline).not.toHaveBeenCalled();
  });

  it('emits correctly framed SSE events and applies the default academic level', async () => {
    mocks.executeAcademicPipeline.mockImplementation(async function* () {
      yield { stage: 'grounding', progressPercent: 5, message: 'grounding' };
      yield { stage: 'completed', progressPercent: 100, message: 'completed' };
    });

    const response = await fetch(`${await baseUrl()}/api/academic-pipeline/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Research title' })
    });
    const body = await response.text();
    const records = body.split('\n\n').filter(Boolean);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(records).toHaveLength(2);
    expect(records.map(record => JSON.parse(record.replace(/^data: /u, '')))).toMatchObject([
      { stage: 'grounding', progressPercent: 5 },
      { stage: 'completed', progressPercent: 100 }
    ]);
    expect(mocks.executeAcademicPipeline).toHaveBeenCalledWith({
      title: 'Research title',
      level: 'phd'
    });
  });

  it('does not expose provider errors or secret-like values to clients', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.executeAcademicPipeline.mockImplementation(async function* () {
      yield { stage: 'grounding', progressPercent: 5, message: 'starting' };
      throw new Error('SECRET_PROVIDER_API_KEY=do-not-return');
    });

    const response = await fetch(`${await baseUrl()}/api/academic-pipeline/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Research title', level: 'phd' })
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"stage":"error"');
    expect(body).not.toContain('SECRET_PROVIDER_API_KEY');
    expect(body).not.toContain('do-not-return');
    expect(errorLog).toHaveBeenCalledOnce();
  });
});
