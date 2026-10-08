import express, { type Request, type Response } from 'express';
import { createServer, type Server } from 'node:http';
import { describe, expect, it, vi } from 'vitest';

const policy = { journalName: 'Journal of Kurdish Studies', manuscriptType: 'article' as const };
const manifest = {
  id: 'MAN-1',
  versionId: 'VER-1',
  policy,
  journalName: policy.journalName,
  manuscriptType: policy.manuscriptType,
  policyFingerprint: 'policy-hash'
};
const manuscript = {
  projectId: 'WS-1',
  title: 'Revised study',
  sections: [{ type: 'abstract', title: 'Abstract', content: 'A revised abstract.', order: 1 }],
  citations: [],
  bibliography: [],
  integrity: {
    structuralStatus: 'PASS',
    errors: [],
    warnings: [],
    chapterCount: 1,
    citationCount: 0,
    verifiedCitationCount: 0,
    referencedCitationCount: 0,
    bibliographyCount: 0,
    fingerprint: 'a'.repeat(64)
  }
};
const submissionPackage = {
  journalName: policy.journalName,
  manuscriptType: policy.manuscriptType,
  status: 'READY',
  checks: [],
  wordCount: 3,
  abstractWordCount: 3,
  keywordCount: 0,
  referenceCount: 0,
  mainManuscript: manuscript,
  titlePage: { title: manuscript.title, authors: [] },
  coverLetterTemplate: null,
  blindedReview: false,
  fingerprint: 'b'.repeat(64)
};

vi.mock('../services/manuscript-assembly.service', () => ({
  assembleManuscript: vi.fn().mockReturnValue(manuscript)
}));
vi.mock('../services/publication-submission.service', () => ({
  buildPublicationSubmissionPackage: vi.fn().mockReturnValue(submissionPackage)
}));
vi.mock('../services/publication-submission-integrity.service', () => ({
  verifyPublicationSubmissionIntegrity: vi.fn().mockReturnValue({
    status: 'READY',
    readyToSubmit: true,
    checks: [],
    manifest: {
      journalName: policy.journalName,
      manuscriptType: policy.manuscriptType,
      blindedReview: false,
      manuscriptFingerprint: 'a'.repeat(64),
      packageFingerprint: 'b'.repeat(64),
      wordCount: 3,
      abstractWordCount: 3,
      keywordCount: 0,
      referenceCount: 0,
      checkCount: 0
    },
    fingerprint: 'c'.repeat(64)
  })
}));
vi.mock('../services/publication-submission-lifecycle.service', () => ({
  publicationSubmissionLifecycleService: {
    get: vi.fn().mockResolvedValue({
      id: 'SUB-1',
      workspaceId: 'WS-1',
      currentStatus: 'REVISION_REQUESTED',
      currentVersionId: 'VER-1',
      versionCount: 1
    }),
    resubmit: vi.fn().mockResolvedValue({
      id: 'SUB-1',
      workspaceId: 'WS-1',
      currentStatus: 'RESUBMITTED',
      currentVersionId: 'VER-2',
      versionCount: 2
    })
  }
}));
vi.mock('../services/publication-submission-editorial-decision.service', () => ({
  publicationSubmissionEditorialDecisionService: {
    assertResubmissionGate: vi.fn().mockResolvedValue({
      ready: true,
      plan: { id: 'RVP-1', submissionVersionId: 'VER-1', tasks: [] },
      pendingRequiredTasks: []
    })
  }
}));
vi.mock('../services/publication-submission-manifest.service', () => ({
  listSubmissionManifests: vi.fn().mockResolvedValue([manifest]),
  verifySubmissionManifest: vi.fn().mockReturnValue({
    status: 'VERIFIED',
    errors: [],
    immutableHash: 'd'.repeat(64)
  }),
  submissionPolicyFingerprint: vi.fn((value: { maxWords?: number }) =>
    value.maxWords === undefined ? 'policy-hash' : 'changed-policy-hash'
  )
}));

import { createPublicationSubmissionResubmitRouter } from './publication-submission-resubmit.routes';

function buildTestServer(): Server {
  const app = express();
  app.use(express.json());
  app.use((req: Request & { user?: { uid: string } }, _res: Response, next) => {
    req.user = { uid: 'USER-1' };
    next();
  });
  app.use('/api/publication-submission-lifecycle/WS-1/SUB-1', createPublicationSubmissionResubmitRouter());
  return app.listen(0);
}

async function url(server: Server): Promise<string> {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function body(policyOverride?: Record<string, unknown>) {
  return {
    title: 'Revised study',
    abstract: 'A revised abstract.',
    chapters: [{ id: 'CH-1', title: 'Chapter 1', order: 1, content: 'Revised chapter content.', citationIds: [] }],
    citations: [],
    keywords: [],
    authors: [],
    policy: { ...policy, ...policyOverride },
    note: 'Revision completed.'
  };
}

describe('P18/P19 resubmission API contract', () => {
  it('accepts a resubmission when the verified P19 policy is unchanged', async () => {
    const server = buildTestServer();
    try {
      const response = await fetch(`${await url(server)}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body())
      });
      const result = await response.json();
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.submission.currentVersionId).toBe('VER-2');
    } finally {
      await close(server);
    }
  });

  it('blocks a resubmission when its policy fingerprint differs from P19', async () => {
    const server = buildTestServer();
    try {
      const response = await fetch(`${await url(server)}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body({ maxWords: 5000 }))
      });
      expect(response.status).toBe(409);
      expect((await response.json()).error).toContain('policy must match');
    } finally {
      await close(server);
    }
  });
});
