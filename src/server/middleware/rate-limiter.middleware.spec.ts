import { describe, expect, it } from 'vitest';
import { isAiPath } from './rate-limiter.middleware';

describe('AI rate-limit route classification', () => {
  it.each([
    '/ai-tools/execute',
    '/agents/run',
    '/library/search',
    '/library/ocr',
    '/multi-agent/orchestrate',
    '/rag/index-document',
    '/writing/evidence-graph',
    '/defense-rehearsal/session',
    '/publication-defense/readiness',
    '/platform/multi-agent-orchestrate'
  ])('classifies %s as an AI workload', path => {
    expect(isAiPath(path)).toBe(true);
  });

  it.each([
    '/library/books',
    '/library/sources',
    '/health',
    '/static/app.css'
  ])('does not classify %s as an AI workload', path => {
    expect(isAiPath(path)).toBe(false);
  });
});
