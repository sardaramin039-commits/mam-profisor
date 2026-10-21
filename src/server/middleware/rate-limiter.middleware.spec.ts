import type { Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import {
  authenticatedRateLimiterMiddleware,
  rateLimiterMiddleware
} from './rate-limiter.middleware';

interface InvocationResult {
  statusCode?: number;
  headers: Map<string, string>;
  body?: Record<string, unknown>;
  nextCalled: boolean;
}

function invoke(
  middleware: (req: Request, res: Response, next: () => void) => void,
  path: string,
  ip: string,
  uid?: string
): InvocationResult {
  const result: InvocationResult = {
    headers: new Map<string, string>(),
    nextCalled: false
  };
  const response = {
    setHeader(name: string, value: string) {
      result.headers.set(name, value);
    },
    status(code: number) {
      result.statusCode = code;
      return response;
    },
    json(body: Record<string, unknown>) {
      result.body = body;
      return response;
    }
  };
  const request = {
    method: 'POST',
    path,
    ip,
    ...(uid ? { user: { uid } } : {})
  };
  middleware(request as never, response as never, () => {
    result.nextCalled = true;
  });
  return result;
}

describe('AI route rate budgets', () => {
  it('applies the stricter 20-per-minute IP budget to grounded generation', () => {
    let last: InvocationResult | undefined;
    for (let index = 0; index < 21; index += 1) {
      last = invoke(
        rateLimiterMiddleware,
        '/writing/grounded_generate',
        '198.51.100.219'
      );
    }
    expect(last?.statusCode).toBe(429);
    expect(last?.nextCalled).toBe(false);
    expect(last?.headers.has('Retry-After')).toBe(true);
    expect(last?.body?.['retryAfterSeconds']).toBeGreaterThan(0);
  });

  it('applies the stricter 30-per-minute user budget to grounded generation', () => {
    let last: InvocationResult | undefined;
    for (let index = 0; index < 31; index += 1) {
      last = invoke(
        authenticatedRateLimiterMiddleware,
        '/writing/grounded_generate',
        '198.51.100.220',
        'phase19-grounded-writer-user'
      );
    }
    expect(last?.statusCode).toBe(429);
    expect(last?.nextCalled).toBe(false);
    expect(last?.headers.has('Retry-After')).toBe(true);
  });
});
