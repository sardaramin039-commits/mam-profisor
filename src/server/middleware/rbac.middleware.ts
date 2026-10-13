import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';

export type UserRole = 'student' | 'researcher' | 'professor' | 'reviewer' | 'admin';

export interface ExtendedAuthRequest extends AuthRequest {
  userRole?: UserRole;
  userPermissions?: string[];
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: ExtendedAuthRequest, res: Response, next: NextFunction): void => {
    // Authorization must never run without a verified Firebase identity.
    // optionalAuth may leave req.user unset when a request has no valid token.
    if (!req.user?.uid) {
      res.status(401).json({ error: 'Unauthorized: authentication is required.' });
      return;
    }

    // Determine user role only from verified Firebase token claims.
    // Client-controlled headers must never grant or elevate authorization.
    const claims = req.user;
    const claimRole = claims?.role || (Array.isArray(claims?.roles) ? claims.roles[0] : undefined);
    const validRoles: UserRole[] = ['student', 'researcher', 'professor', 'reviewer', 'admin'];
    const role: UserRole = validRoles.includes(claimRole) ? claimRole : 'student';

    req.userRole = role;

    if (allowedRoles.includes(role) || role === 'admin') {
      next();
      return;
    }

    res.status(403).json({
      error: `دەسەڵات ڕەتکرایەوە: ڕۆڵی '${role}' ڕێگەی پێنەدراوە بۆ ئەنجامدانی ئەم کردەوە ئەکادیمییە. پێویستی بە یەکێک لە ڕوڵەکانی [${allowedRoles.join(', ')}] هەیە.`
    });
  };
}
