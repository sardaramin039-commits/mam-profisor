import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';

export type UserRole = 'student' | 'researcher' | 'professor' | 'reviewer' | 'admin';

export interface ExtendedAuthRequest extends AuthRequest {
  userRole?: UserRole;
  userPermissions?: string[];
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: ExtendedAuthRequest, res: Response, next: NextFunction): void => {
    // Determine user role from token claims, header, or default dev role
    const role: UserRole = (req.user as any)?.role ||
      (req.headers['x-academic-role'] as UserRole) ||
      'researcher';

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
