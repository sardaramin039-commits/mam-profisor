import { describe, expect, it, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { ExtendedAuthRequest } from './rbac.middleware';
import { requireRole } from './rbac.middleware';

function makeResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe('requireRole authentication boundary', () => {
  it('returns 401 when optional authentication did not establish a user', () => {
    const req = { user: undefined } as unknown as ExtendedAuthRequest;
    const res = makeResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('student')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: authentication is required.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an authenticated user when their verified role is allowed', () => {
    const req = {
      user: { uid: 'test-user', role: 'student' }
    } as unknown as ExtendedAuthRequest;
    const res = makeResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('student')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('does not elevate an authenticated user with an unknown role', () => {
    const req = {
      user: { uid: 'test-user', role: 'owner' }
    } as unknown as ExtendedAuthRequest;
    const res = makeResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
