import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
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

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In dev / preview mode without user session, allow session preview header or return 401
    if (process.env['NODE_ENV'] !== 'production' && req.headers['x-dev-guest-token'] === 'allow-dev-preview') {
      req.user = { uid: 'dev-guest-user', email: 'dev@aistudio.local' } as any;
      next();
      return;
    }
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (process.env['NODE_ENV'] !== 'production' && (token === 'dev-token' || token === 'allow-dev-preview')) {
      req.user = { uid: 'dev-guest-user', email: 'dev@aistudio.local' } as any;
      next();
      return;
    }
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token signature or expired session' });
    return;
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
    } catch {
      // Ignore token decode errors for optional auth
    }
  }
  next();
};

