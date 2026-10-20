import express, { type Request, type Response } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assembleManuscript: vi.fn(),
  persistAssembledManuscript: vi.fn(),
  hydrateProjectState: vi.fn(),
  snapshot: vi.fn()
}));

vi.mock('../services/manuscript-assembly.service', () => ({
  assembleManuscript: mocks.assembleManuscript,
  persistAssembledManuscript: mocks.persistAssembledManuscript
}));
vi.mock('../services/research-memory.service', () => ({
  researchMemoryService: { hydrateProjectState: mocks.hydrateProjectState }
}));
vi.mock('../services/research-control-plane.service', () => ({
  researchControlPlaneService: { snapshot: mocks.snapshot }
}));

import { createManuscriptAssemblyRouter } from './manuscript-assembly.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next) => {
    (req as Request & { user?: { uid: string } }).user = { uid: 'USER-1' };
    next();
  });
  app.use('/api/manuscript', createManuscriptAssemblyRouter());
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

async function postManuscript(payload: Record<string, unknown>): Promise<Response> {
  return fetch(`${await baseUrl()}/api/manuscript/WS-1/assemble`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

const validPayload = {
  title: 'Education research',
  methodology: 'A descriptive methodology is used.',
  chapters: [{
    id: 'chapter-1',
    title: 'Introduction',
    order: 1,
    content: 'This chapter describes the research context.',
    citationIds: ['CIT-1']
  }],
  citations: [{
    citationId: 'CIT-1',
    sourceId: 'SRC-1',
    inText: '(Researcher, 2024)',
    bibliography: 'Researcher. (2024). Verified study.',
    verified: true,
    evidenceId: 'EVI-1'
  }]
};

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.hydrateProjectState.mockResolvedValue({
    memoryItems: [{
      type: 'evidence',
      metadata: { verified: true, evidenceId: 'EVI-1', sourceId: 'SRC-1' }
    }]
  });
  mocks.snapshot.mockResolvedValue({ gates: { exportBlocked: false } });
  mocks.assembleManuscript.mockImplementation((input: { projectId: string; title: string; chapters: unknown[]; citations: unknown[] }) => ({
    projectId: input.projectId,
    title: input.title,
    sections: [],
    citations: input.citations,
    bibliography: [],
    integrity: {
      structuralStatus: 'PASS',
      errors: [],
      warnings: [],
      chapterCount: input.chapters.length,
      citationCount: input.citations.length,
      verifiedCitationCount: input.citations.length,
      referencedCitationCount: 1,
      bibliographyCount: 1,
      fingerprint: 'test-fingerprint'
    }
  }));
  mocks.persistAssembledManuscript.mockResolvedValue({
    fingerprint: 'test-fingerprint',
    path: 'research_manuscripts/USER-1/workspaces/WS-1'
  });
  server = await startServer();
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('manuscript assembly integrity export gate', () => {
  it('persists a clean manuscript only after server-verified citation resolution', async () => {
    const response = await postManuscript(validPayload);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.assemblyIntegrity.readyForExport).toBe(true);
    expect(mocks.persistAssembledManuscript).toHaveBeenCalledTimes(1);
  });

  it('blocks export when a manuscript contains unresolved placeholders', async () => {
    const payload = {
      ...validPayload,
      chapters: [{
        ...validPayload.chapters[0],
        content: 'The result should be supplied later [citation needed].'
      }]
    };
    const response = await postManuscript(payload);
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.exportBlocked).toBe(true);
    expect(body.assemblyIntegrity.readyForExport).toBe(false);
    expect(body.assemblyIntegrity.issues.some((issue: { code: string }) => issue.code === 'placeholder_text')).toBe(true);
    expect(mocks.persistAssembledManuscript).not.toHaveBeenCalled();
  });

  it('does not trust a caller-supplied verified boolean without matching stored evidence', async () => {
    mocks.hydrateProjectState.mockResolvedValueOnce({ memoryItems: [] });
    const response = await postManuscript(validPayload);
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.assemblyIntegrity.issues.some((issue: { code: string }) => issue.code === 'unverified_citation')).toBe(true);
    expect(mocks.persistAssembledManuscript).not.toHaveBeenCalled();
  });
});
