import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';

export type UserRole = 'student' | 'researcher' | 'professor' | 'reviewer' | 'admin';

export interface ExtendedAuthRequest extends AuthRequest {
  userRole?: UserRole;
  userPermissions?: string[];
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: ExtendedAuthRequest, res: Response, next: NextFunction): void => {
    // requireRole is authorization, not authentication. Never turn a missing
    // or unverified identity into the default student role.
    if (!req.user?.uid) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
      return;
    }

    // Claims are populated only by requireAuth after Firebase token verification.
    // Client-controlled headers must never grant or elevate authorization.
    const claims = req.user as unknown as { role?: unknown; roles?: unknown };
    const claimRole = claims.role || (Array.isArray(claims.roles) ? claims.roles[0] : undefined);
    const validRoles: UserRole[] = ['student', 'researcher', 'professor', 'reviewer', 'admin'];
    const role: UserRole = typeof claimRole === 'string' && validRoles.includes(claimRole as UserRole)
      ? claimRole as UserRole
      : 'student';

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
