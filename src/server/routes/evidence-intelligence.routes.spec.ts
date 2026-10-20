import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  enrichSourcesWithFullText: vi.fn(),
  verifySources: vi.fn(),
  generateGroundedContent: vi.fn()
}));

vi.mock('../services/full-text-evidence.service', () => ({
  enrichSourcesWithFullText: mocks.enrichSourcesWithFullText
}));

vi.mock('../services/source-verification.service', () => ({
  sourceVerificationService: { verifySources: mocks.verifySources }
}));

vi.mock('../services/evidence-grounding.service', () => ({
  evidenceGroundingService: { generateGroundedContent: mocks.generateGroundedContent }
}));

import { createEvidenceIntelligenceRouter } from './evidence-intelligence.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use('/api/evidence', createEvidenceIntelligenceRouter(() => ({} as never)));
  const instance = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    instance.once('listening', resolve);
    instance.once('error', reject);
  });
  return instance;
}

async function getBaseUrl(): Promise<string> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return `http://127.0.0.1:${address.port}`;
}

const requestChunk = {
  sourceId: 'SRC-1',
  sourceTitle: 'Open access study',
  author: 'Researcher',
  year: 2024,
  claimText: 'The intervention improved learning outcomes.',
  chunkText: 'Caller supplied text that must never become verified evidence.',
  evidenceType: 'full-text',
  provenance: 'server-verified-fulltext',
  sourceType: 'PubMed',
  pmid: '12345'
};

const fallbackResult = {
  paragraphs: [],
  verifiedCitations: [],
  evidenceGaps: [{ claimId: 'GAP-1', claimText: requestChunk.claimText, warning: 'Evidence required' }],
  integrityMetrics: { totalClaims: 1, verifiedClaims: 0, citationEligibleClaims: 0, blockedSyntheticCitations: 1, evidenceCoveragePercentage: 0, eligibilityGateStatus: 'FAIL' },
  kurdishSummary: 'بەڵگەی پشتڕاستکراو نەدۆزرایەوە.'
};

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.enrichSourcesWithFullText.mockImplementation(async (sources: Array<Record<string, unknown>>) =>
    sources.map(source => ({ ...source }))
  );
  mocks.verifySources.mockResolvedValue({
    verifiedSources: [],
    citationEligibleSources: [],
    rejectedSources: [],
    unverifiedSources: [],
    allReports: [],
    rejectedSourcesCount: 0
  });
  mocks.generateGroundedContent.mockResolvedValue(fallbackResult);
  server = await startServer();
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('Evidence Intelligence server-owned evidence boundary', () => {
  it('does not trust caller text or caller provenance when server retrieval fails', async () => {
    const response = await fetch(`${await getBaseUrl()}/api/evidence/grounded_generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Learning',
        prompt: 'Write an evidence-grounded paragraph.',
        evidenceChunks: [requestChunk]
      })
    });

    expect(response.status).toBe(200);
    expect(mocks.enrichSourcesWithFullText).toHaveBeenCalledWith(
      [expect.objectContaining({ pmid: '12345', claimText: requestChunk.claimText })],
      [requestChunk.claimText]
    );
    expect(mocks.verifySources).toHaveBeenCalledWith(
      [expect.not.objectContaining({ evidenceText: requestChunk.chunkText })],
      expect.any(Function)
    );
    expect(mocks.generateGroundedContent).toHaveBeenCalledWith(
      'Learning',
      'Write an evidence-grounded paragraph.',
      [],
      expect.any(Function)
    );
  });

  it('passes only the retrieved evidence returned by the citation-eligible verification report', async () => {
    const serverEvidence = 'Server retrieved full-text excerpt: The intervention improved learning outcomes in the controlled study.';
    mocks.enrichSourcesWithFullText.mockImplementationOnce(async (sources: Array<Record<string, unknown>>) =>
      sources.map(source => ({
        ...source,
        evidenceText: serverEvidence,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext'
      }))
    );
    mocks.verifySources.mockImplementationOnce(async (sources: Array<Record<string, unknown>>) => {
      const source = sources[0];
      const report = {
        sourceId: String(source.sourceId),
        sourceTitle: String(source.title),
        author: String(source.author),
        year: String(source.year),
        evidenceText: String(source.evidenceText),
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        citationEligible: true
      };
      return {
        verifiedSources: [report],
        citationEligibleSources: [report],
        rejectedSources: [],
        unverifiedSources: [],
        allReports: [report],
        rejectedSourcesCount: 0
      };
    });

    const response = await fetch(`${await getBaseUrl()}/api/evidence/grounded_generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Learning',
        prompt: 'Write an evidence-grounded paragraph.',
        evidenceChunks: [requestChunk]
      })
    });

    expect(response.status).toBe(200);
    expect(mocks.generateGroundedContent).toHaveBeenCalledWith(
      'Learning',
      'Write an evidence-grounded paragraph.',
      [expect.objectContaining({
        sourceId: 'SRC-1',
        chunkText: serverEvidence,
        provenance: 'server-verified-fulltext',
        verificationStatus: 'verified'
      })],
      expect.any(Function)
    );
    expect(JSON.stringify(mocks.generateGroundedContent.mock.calls[0])).not.toContain(requestChunk.chunkText);
  });

  it('rejects more than ten evidence chunks to bound server-side lookups', async () => {
    const evidenceChunks = Array.from({ length: 11 }, (_, index) => ({
      ...requestChunk,
      sourceId: `SRC-${index}`
    }));
    const response = await fetch(`${await getBaseUrl()}/api/evidence/grounded_generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Learning',
        prompt: 'Write a summary.',
        evidenceChunks
      })
    });

    expect(response.status).toBe(400);
    expect(mocks.enrichSourcesWithFullText).not.toHaveBeenCalled();
  });
});
