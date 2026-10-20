import { describe, expect, it } from 'vitest';
import {
  createAgentHandoffManifest,
  MultiAgentExecutionPolicyService
} from './multi-agent-execution-policy.service';

const policy = new MultiAgentExecutionPolicyService();

describe('multi-agent execution policy', () => {
  it('records a successful typed stage receipt without recording raw input', async () => {
    const outcome = await policy.execute({
      stageId: 'source_verification',
      agentName: 'Source Verification Agent',
      inputFingerprint: 'abc123',
      timeoutMs: 100,
      operation: async () => ({ verifiedSourceIds: ['SRC-1'] })
    });
    expect(outcome.status).toBe('succeeded');
    expect(outcome.receipt.inputFingerprint).toBe('abc123');
    expect(outcome.receipt.attempts).toBe(1);
    expect(outcome.receipt.durationMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(outcome.receipt)).not.toContain('raw');
  });

  it('times out a stage and returns a machine-readable receipt', async () => {
    const outcome = await policy.execute({
      stageId: 'review',
      agentName: 'Reviewer Agent',
      timeoutMs: 5,
      operation: async () => new Promise<string>(resolve => setTimeout(() => resolve('late'), 100))
    });
    expect(outcome.status).toBe('timed_out');
    expect(outcome.receipt.errorCode).toBe('timeout');
    expect(outcome.receipt.attempts).toBe(1);
  });

  it('stops orchestration promptly when the caller cancels', async () => {
    const controller = new AbortController();
    const pending = policy.execute({
      stageId: 'writer',
      agentName: 'Writer Agent',
      signal: controller.signal,
      timeoutMs: 1000,
      operation: async () => new Promise<string>(resolve => setTimeout(() => resolve('late'), 100))
    });
    controller.abort(new Error('request cancelled'));
    const outcome = await pending;
    expect(outcome.status).toBe('cancelled');
    expect(outcome.receipt.errorCode).toBe('cancelled');
  });

  it('bounds retries to one and only retries explicitly retry-safe transient work', async () => {
    let attempts = 0;
    const outcome = await policy.execute({
      stageId: 'discovery',
      agentName: 'Discovery Agent',
      retrySafe: true,
      maxRetries: 9,
      timeoutMs: 100,
      operation: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('ECONNRESET: connection reset');
        return 'recovered';
      }
    });
    expect(outcome.status).toBe('succeeded');
    expect(outcome.value).toBe('recovered');
    expect(outcome.receipt.attempts).toBe(2);
    expect(outcome.receipt.retryCount).toBe(1);
  });

  it('never retries non-idempotent work even when a caller requests retries', async () => {
    let attempts = 0;
    const outcome = await policy.execute({
      stageId: 'writer',
      agentName: 'Writer Agent',
      maxRetries: 1,
      retrySafe: false,
      timeoutMs: 100,
      operation: async () => { attempts += 1; throw new Error('503 temporarily unavailable'); }
    });
    expect(outcome.status).toBe('failed');
    expect(attempts).toBe(1);
    expect(outcome.receipt.retryCount).toBe(0);
  });

  it('preserves source IDs and requires review instead of resolving conflicts by agent vote', () => {
    const handoff = createAgentHandoffManifest({
      fromStage: 'contradiction_analysis',
      toStage: 'review',
      sourceIds: ['SRC-B', 'SRC-A', 'SRC-A', ' '],
      citationEligibleSourceIds: ['SRC-A'],
      conflictCount: 2
    });
    expect(handoff.sourceIds).toEqual(['SRC-A', 'SRC-B']);
    expect(handoff.citationEligibleSourceIds).toEqual(['SRC-A']);
    expect(handoff.evidenceProvenance).toBe('mixed');
    expect(handoff.humanReviewRequired).toBe(true);
    expect(handoff.conflictResolutionPolicy).toBe('retain-findings-and-require-human-review');
    expect(handoff.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
  });
});
