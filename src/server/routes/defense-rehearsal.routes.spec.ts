import express, { type Request, type Response as ExpressResponse } from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  assess: vi.fn(),
  assembleManuscript: vi.fn(),
  snapshot: vi.fn(),
  resolveServerVerifiedCitations: vi.fn()
}));

vi.mock('../services/defense-rehearsal.service', () => ({
  defenseRehearsalService: { prepare: mocks.prepare, assess: mocks.assess }
}));
vi.mock('../services/manuscript-assembly.service', () => ({
  assembleManuscript: mocks.assembleManuscript
}));
vi.mock('../services/research-control-plane.service', () => ({
  researchControlPlaneService: { snapshot: mocks.snapshot }
}));
vi.mock('../services/publication-research-gate.service', () => ({
  resolveServerVerifiedCitations: mocks.resolveServerVerifiedCitations
}));

import { createDefenseRehearsalRouter } from './defense-rehearsal.routes';

let server: Server | undefined;

async function startServer(): Promise<Server> {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: ExpressResponse, next) => {
    (req as unknown as { user: { uid: string } }).user = { uid: 'USER-1' };
    next();
  });
  app.use('/api/defense-rehearsal', createDefenseRehearsalRouter());
  const instance = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    instance.once('listening', resolve);
    instance.once('error', reject);
  });
  return instance;
}

async function post(): Promise<Response> {
  const address = server?.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable.');
  return fetch(`http://127.0.0.1:${address.port}/api/defense-rehearsal/WS-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'AI in education',
      title: 'Education research',
      researchQuestion: 'How is AI used in education?',
      methodology: 'A descriptive approach is used.',
      conclusion: 'Further research is needed.',
      chapters: [{ id: 'CH-1', title: 'Introduction', order: 1, content: 'Research context.' }],
      citations: [],
      referencedCitationCount: 0,
      verifiedCitationCount: 0,
      bibliographyCount: 0,
      structuralStatus: 'PASS',
      exportBlocked: false,
      answers: [{ questionId: 'DEF-01', answer: 'A practice answer.' }]
    })
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.snapshot.mockResolvedValue({ gates: { exportBlocked: false } });
  mocks.resolveServerVerifiedCitations.mockResolvedValue([]);
  mocks.assembleManuscript.mockReturnValue({
    title: 'Education research',
    sections: [
      { type: 'research-question', content: 'How is AI used in education?' },
      { type: 'methodology', content: 'A descriptive approach is used.' },
      { type: 'conclusion', content: 'Further research is needed.' },
      { type: 'chapter', title: 'Introduction', order: 1, content: 'Research context.' }
    ],
    integrity: {
      referencedCitationCount: 0,
      verifiedCitationCount: 0,
      bibliographyCount: 0,
      structuralStatus: 'PASS'
    }
  });
  mocks.prepare.mockReturnValue({
    readiness: { defenseStatus: 'READY', publicationStatus: 'READY' },
    questions: [{ id: 'DEF-01', category: 'methodology', question: 'Explain the method.' }]
  });
  mocks.assess.mockReturnValue({ questionId: 'DEF-01', score: 80, status: 'ADEQUATE' });
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close(error => error ? reject(error) : resolve());
  });
  server = undefined;
});

describe('defense rehearsal scope disclosure', () => {
  it('labels an automated rehearsal as practice, not a real committee certification', async () => {
    server = await startServer();
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.assessmentScope).toBe('AUTOMATED_REHEARSAL_ONLY');
    expect(body.humanCommitteeDecision).toBe(false);
    expect(body.readinessIsCertification).toBe(false);
    expect(body.scoreInterpretation).toBe('heuristic_practice_feedback');
    expect(body.limitations).toHaveLength(2);
    expect(mocks.assess).toHaveBeenCalledTimes(1);
  });
});
