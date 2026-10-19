import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  indexDocument: vi.fn(),
  searchSimilarDocuments: vi.fn(),
  verifySources: vi.fn(),
  requireAuth: vi.fn()
}));

vi.mock('../../middleware/auth', () => ({ requireAuth: mocks.requireAuth }));

vi.mock('../../services/vector-store.service', () => ({
  vectorStoreService: { indexDocument: mocks.indexDocument, searchSimilarDocuments: mocks.searchSimilarDocuments }
}));

vi.mock('../services/source-verification.service', () => ({
  sourceVerificationService: { verifySources: mocks.verifySources }
}));

import { createRagRouter } from './rag.routes';

let server: Server | undefined;

async function buildServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/rag', createRagRouter(() => ({} as never)));

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
  mocks.requireAuth.mockImplementation((req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization !== 'Bearer test-token') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    (req as Request & { user?: { uid: string } }).user = { uid: 'test-user' };
    next();
  });
  mocks.searchSimilarDocuments.mockResolvedValue([]);
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
  it('rejects requests without authentication before invoking source verification or storage', async () => {
    const response = await fetch(`${await baseUrl()}/api/rag/index-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthenticated document',
        content: 'This content must not be passed to source verification or storage when no token is present.'
      })
    });

    expect(response.status).toBe(401);
    expect(mocks.verifySources).not.toHaveBeenCalled();
    expect(mocks.indexDocument).not.toHaveBeenCalled();
  });

  it('scopes retrieval to the authenticated owner and never implies a source is verified by relevance', async () => {
    const response = await fetch(`${await baseUrl()}/api/rag/hybrid-retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ query: 'climate change' })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      retrievalStatus: 'no-matching-indexed-content',
      verificationPolicy: 'retrieval-relevance-does-not-imply-source-verification'
    });
    expect(mocks.searchSimilarDocuments).toHaveBeenCalledWith(
      'climate change',
      'test-user',
      5,
      undefined
    );
  });

  it('does not mark caller-uploaded content verified just because source identity metadata matched', async () => {
    const response = await fetch(`${await baseUrl()}/api/rag/index-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
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
