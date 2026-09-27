import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';

export type UserRole = 'student' | 'researcher' | 'professor' | 'reviewer' | 'admin';

export interface ExtendedAuthRequest extends AuthRequest {
  userRole?: UserRole;
  userPermissions?: string[];
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: ExtendedAuthRequest, res: Response, next: NextFunction): void => {
    // Determine user role only from verified Firebase token claims.
    // Client-controlled headers must never grant or elevate authorization.
    const claims = req.user as any;
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
