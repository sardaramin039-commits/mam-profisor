import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  indexDocument: vi.fn(),
  verifySources: vi.fn()
}));

vi.mock('../../services/vector-store.service', () => ({
  vectorStoreService: { indexDocument: mocks.indexDocument, searchSimilarDocuments: vi.fn() }
}));

vi.mock('../services/source-verification.service', () => ({
  sourceVerificationService: { verifySources: mocks.verifySources }
}));

import { createRagRouter } from './rag.routes';

let server: Server | undefined;

async function buildServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/rag', (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user?: { uid: string } }).user = { uid: 'test-user' };
    next();
  }, createRagRouter(() => ({} as never)));

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
  mocks.verifySources.mockResolvedValue({
    verifiedSources: [{ sourceId: 'doi:10.1234/example', identityStatus: 'verified' }],
    citationEligibleSources: [],
    rejectedSources: [],
    unverifiedSources: [],
    allReports: [],
    rejectedSourcesCount: 0
  });
  mocks.indexDocument.mockResolvedValue({
    id: 'indexed-doc-1',
    title: 'Trusted metadata, caller-supplied text',
    retrievalStatus: 'in-memory-index',
    embedding: [],
    documentId: 'indexed-doc-1',
    chunkCount: 1
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

describe('RAG content verification boundary', () => {
  it('does not mark caller-uploaded content verified just because source identity metadata matched', async () => {
    const response = await fetch(`${await baseUrl()}/api/rag/index-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Trusted metadata, caller-supplied text',
        content: 'This text was uploaded by a caller and has not been fetched from an authoritative full text.',
        author: 'Test Author',
        year: 2024,
        doi: '10.1234/example'
      })
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      verificationStatus: 'unverified',
      sourceIdentityStatus: 'verified'
    });
    expect(mocks.indexDocument).toHaveBeenCalledWith(expect.objectContaining({
      verificationStatus: 'unverified',
      userId: 'test-user'
    }));
  });
});
