import { Request, Response, NextFunction } from 'express';

// In-memory limiter for a single application instance.
// For multi-instance production deployments, use a shared store (e.g. Redis).
type RateState = { count: number; lastReset: number };

const rateLimitMap = new Map<string, RateState>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 120;
const AI_MAX_REQUESTS = 20;
const MAX_TRACKED_CLIENTS = 10_000;

function getLimit(path: string): number {
  return path.startsWith('/ai-tools/') || path.startsWith('/platform/multi-agent-orchestrate')
    ? AI_MAX_REQUESTS
    : DEFAULT_MAX_REQUESTS;
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || 'anonymous';
  const now = Date.now();
  const maxRequests = getLimit(req.path);

  if (rateLimitMap.size >= MAX_TRACKED_CLIENTS) {
    for (const [key, info] of rateLimitMap) {
      if (now - info.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const rateKey = `${clientIp}:${req.path.startsWith('/ai-tools/') ? 'ai' : 'default'}`;
  let rateInfo = rateLimitMap.get(rateKey);

  if (!rateInfo || now - rateInfo.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateInfo = { count: 1, lastReset: now };
    rateLimitMap.set(rateKey, rateInfo);
    next();
    return;
  }

  if (rateInfo.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - rateInfo.lastReset)) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'داواکارییەکانت زۆرن. تکایە دوای کەمێک هەوڵ بدەرەوە.',
      retryAfterSeconds
    });
    return;
  }

  rateInfo.count++;
  next();
}
