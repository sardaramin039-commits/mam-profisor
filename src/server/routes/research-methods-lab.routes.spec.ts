import express from 'express';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createResearchMethodsLabRouter } from './research-methods-lab.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/research-methods-lab', createResearchMethodsLabRouter());
  const instance = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    instance.once('listening', resolve);
    instance.once('error', reject);
  });
  return instance;
}

async function post(mode: string, payload: Record<string, unknown>): Promise<Response> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return fetch(`http://127.0.0.1:${address.port}/api/research-methods-lab/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload })
  });
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('Research Methods Lab API and statistical gate', () => {
  it('exposes a deterministic statistical integrity audit and blocks invalid values', async () => {
    server = await startServer();
    const response = await post('statistics_integrity', {
      sampleSize: 50, eventCount: 60, reportedPercent: 90,
      pValue: 1.2, alpha: 0
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result.valid).toBe(false);
    expect(body.result.calculationBlocked).toBe(true);
    const codes = body.result.issues.map((issue: { code: string }) => issue.code);
    expect(codes).toContain('events_exceed_sample');
    expect(codes).toContain('percentage_mismatch');
    expect(codes).toContain('invalid_p_value');
    expect(codes).toContain('invalid_alpha');
  });

  it('does not calculate power when an input would otherwise be silently clamped', async () => {
    server = await startServer();
    const response = await post('power', {
      design: 'two_group_t', effect: 0.5, alpha: 0, power: 0.8,
      mean1: 4, mean2: 5, sd1: 1, sd2: 1, n1: 30, n2: 30
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result.calculationBlocked).toBe(true);
    expect(body.result.issues.map((issue: { code: string }) => issue.code)).toContain('invalid_alpha');
    expect(body.result.estimatedTotalN).toBeUndefined();
  });

  it('returns a real approximate calculation when power parameters pass validation', async () => {
    server = await startServer();
    const response = await post('power', {
      design: 'two_group_t', effect: 0.5, alpha: 0.05, power: 0.8,
      mean1: 5, mean2: 5.5, sd1: 1, sd2: 1, n1: 30, n2: 30
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result.calculationBlocked).toBeUndefined();
    expect(Number(body.result.estimatedTotalN)).toBeGreaterThan(0);
    expect(body.generatedAt).toBeTruthy();
  });

  it('rejects unknown modes rather than returning synthetic fallback output', async () => {
    server = await startServer();
    const response = await post('invented_mode', {});
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('rejects unknown fields in statistical integrity mode', async () => {
    server = await startServer();
    const response = await post('statistics_integrity', {
      sampleSize: 20, madeUpPValue: 0.01
    });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.unknownKeys).toContain('madeUpPValue');
  });
});
