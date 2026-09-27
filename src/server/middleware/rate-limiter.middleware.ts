import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 120;
const AUTH_MAX_REQUESTS = 60;
const MAX_TRACKED_KEYS = 10_000;

const ipRateLimitMap = new Map<string, RateLimitEntry>();
const authRateLimitMap = new Map<string, RateLimitEntry>();

function pruneExpired(map: Map<string, RateLimitEntry>, now: number): void {
  if (map.size === 0) return;

  for (const [key, entry] of map) {
    if (entry.resetAt <= now) {
      map.delete(key);
    }
    if (map.size <= MAX_TRACKED_KEYS) break;
  }
}

function enforceRateLimit(
  map: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
  now: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  pruneExpired(map, now);

  let entry = map.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    map.set(key, entry);
  }

  entry.count += 1;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  if (map.size > MAX_TRACKED_KEYS) {
    const firstKey = map.keys().next().value;
    if (firstKey) map.delete(firstKey);
  }

  return { allowed, remaining, retryAfterSeconds };
}

export function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const result = enforceRateLimit(ipRateLimitMap, key, IP_MAX_REQUESTS, now);

  res.setHeader('RateLimit-Limit', String(IP_MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining', String(result.remaining));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'داواکارییە زۆرەکان لەم ناونیشانەوە هەن. تکایە دوای چەند چرکەیەک دووبارە هەوڵ بدەرەوە.',
      retryAfterSeconds: result.retryAfterSeconds,
    });
    return;
  }

  next();
}

export function authenticatedRateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const uid = (req as Request & { user?: { uid?: string } }).user?.uid;
  const key = uid ? `uid:${uid}` : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  const now = Date.now();
  const result = enforceRateLimit(authRateLimitMap, key, AUTH_MAX_REQUESTS, now);

  res.setHeader('RateLimit-Limit-User', String(AUTH_MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining-User', String(result.remaining));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'داواکارییەکانت لەم ئەکاونتەوە زۆرن. تکایە کەمێک چاوەڕێ بکە و پاشان دووبارە هەوڵ بدەرەوە.',
      retryAfterSeconds: result.retryAfterSeconds,
    });
    return;
  }

  next();
}
