import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchOpenAlex: vi.fn(),
  searchCrossRef: vi.fn()
}));

vi.mock('../services/academic-search.service', () => ({
  academicSearchService: {
    searchOpenAlex: mocks.searchOpenAlex,
    searchCrossRef: mocks.searchCrossRef,
    searchGoogleBooks: vi.fn(),
    checkApisHealth: vi.fn()
  }
}));

vi.mock('../services/vector-store.service', () => ({
  vectorStoreService: { searchSimilarDocuments: vi.fn(), indexDocument: vi.fn() }
}));

import { academicRouter } from './academic.router';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/scholarly', academicRouter);
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
  mocks.searchOpenAlex.mockResolvedValue([]);
  mocks.searchCrossRef.mockResolvedValue([]);
  server = await startServer();
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('academic search query validation', () => {
  it('accepts a normal numeric limit query parameter', async () => {
    const response = await fetch(
      `${await baseUrl()}/api/scholarly/search?q=education&limit=10`
    );

    expect(response.status).toBe(200);
    expect(mocks.searchOpenAlex).toHaveBeenCalledWith('education', 10);
    expect(mocks.searchCrossRef).toHaveBeenCalledWith('education', 10);
  });
});
