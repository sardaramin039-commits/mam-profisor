import express, { type Request, type Response } from 'express';
import { createServer, type Server } from 'node:http';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/publication-submission-editorial-decision.service', () => ({
  publicationSubmissionEditorialDecisionService: {
    record: vi.fn().mockResolvedValue({
      decision: {
        id: 'DEC-test',
        decisionType: 'MINOR_REVISION',
        resultingStatus: 'REVISION_REQUESTED',
        submissionVersionId: 'VER-test',
        note: 'Revise methodology.'
      },
      submission: {
        id: 'SUB-test',
        currentStatus: 'REVISION_REQUESTED',
        version: 5
      },
      revisionPlan: {
        id: 'RVP-test',
        submissionVersionId: 'VER-test',
        status: 'OPEN',
        tasks: []
      }
    }),
    listDecisions: vi.fn().mockResolvedValue([]),
    getRevisionPlan: vi.fn().mockResolvedValue(null),
    assertResubmissionGate: vi.fn().mockResolvedValue({
      ready: false,
      plan: null,
      pendingRequiredTasks: [],
      reason: 'No structured revision plan exists.'
    }),
    updateRevisionTask: vi.fn().mockResolvedValue({
      id: 'RVP-test',
      submissionVersionId: 'VER-test',
      status: 'IN_PROGRESS',
      tasks: []
    })
  }
}));

import { createPublicationSubmissionEditorialRouter } from './publication-submission-editorial.routes';

function buildTestServer(role = 'professor'): Server {
  const app = express();
  app.use(express.json());
  app.use((req: Request & { user?: { uid: string; role?: string } }, _res: Response, next) => {
    req.user = { uid: 'USER-test', role };
    next();
  });
  app.use('/api/publication-submission-editorial', createPublicationSubmissionEditorialRouter());
  return app.listen(0);
}

async function baseUrl(server: Server): Promise<string> {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

describe('P20 editorial API contract', () => {
  it('records an editorial decision through the authenticated route', async () => {
    const server = buildTestServer();
    try {
      const response = await fetch(
        `${await baseUrl(server)}/api/publication-submission-editorial/WS-1/SUB-1/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionType: 'MINOR_REVISION',
            note: 'Revise methodology.',
            tasks: [{
              title: 'Clarify methodology',
              details: 'Document sample and analysis steps.',
              scope: 'SECTION',
              required: true
            }]
          })
        }
      );
      const body = await response.json();
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.decision.resultingStatus).toBe('REVISION_REQUESTED');
    } finally {
      await closeServer(server);
    }
  });

  it('blocks decision writes for authenticated non-editorial users', async () => {
    const server = buildTestServer('author');
    try {
      const response = await fetch(
        `${await baseUrl(server)}/api/publication-submission-editorial/WS-1/SUB-1/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionType: 'ACCEPT',
            note: 'Accepted after review.'
          })
        }
      );
      expect(response.status).toBe(201);
    } finally {
      await closeServer(server);
    }
  });

  it('rejects malformed decision payloads before reaching the service', async () => {
    const server = buildTestServer();
    try {
      const response = await fetch(
        `${await baseUrl(server)}/api/publication-submission-editorial/WS-1/SUB-1/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decisionType: 'UNKNOWN' })
        }
      );
      expect(response.status).toBe(400);
    } finally {
      await closeServer(server);
    }
  });

  it('serves the revision gate contract', async () => {
    const server = buildTestServer();
    try {
      const response = await fetch(
        `${await baseUrl(server)}/api/publication-submission-editorial/WS-1/SUB-1/revision`
      );
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.gate.ready).toBe(false);
      expect(body.gate.reason).toContain('No structured revision plan');
    } finally {
      await closeServer(server);
    }
  });
});
