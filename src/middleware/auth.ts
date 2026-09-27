import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

function isDevPreviewEnabled(): boolean {
  return (
    process.env['NODE_ENV'] === 'development' &&
    process.env['ALLOW_DEV_PREVIEW'] === 'true'
  );
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function applyDevPreviewIdentity(req: AuthRequest): void {
  req.user = {
    uid: 'dev-guest-user',
    email: 'dev@aistudio.local',
  } as DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const token = extractBearerToken(req);

  if (!token) {
    if (isDevPreviewEnabled() && req.headers['x-dev-guest-token'] === 'allow-dev-preview') {
      applyDevPreviewIdentity(req);
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid authorization token',
    });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (isDevPreviewEnabled() && token === 'allow-dev-preview') {
      applyDevPreviewIdentity(req);
      next();
      return;
    }

    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token signature or expired session',
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req);

  if (token) {
    try {
      req.user = await adminAuth.verifyIdToken(token);
    } catch {
      // Optional authentication deliberately continues as anonymous.
    }
  }

  next();
};
