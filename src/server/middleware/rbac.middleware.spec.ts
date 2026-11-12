import { describe, expect, it, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import { requireRole, type ExtendedAuthRequest } from './rbac.middleware';

function buildResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe('requireRole authentication boundary', () => {
  it('rejects a request without a verified user even when student is allowed', () => {
    const req = {} as ExtendedAuthRequest;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('student')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid authorization token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('does not elevate an authenticated user with an unknown role', () => {
    const req = {
      user: { uid: 'verified-user', role: 'unknown-role' }
    } as unknown as ExtendedAuthRequest;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('professor')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an authenticated student only when the role is explicitly allowed', () => {
    const req = {
      user: { uid: 'verified-user', role: 'student' }
    } as unknown as ExtendedAuthRequest;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('student')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
