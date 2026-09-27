import { Request, Response, NextFunction } from 'express';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_TRACKED_CLIENTS = 10_000;

function pruneExpiredEntries(now: number): void {
  for (const [key, value] of rateLimitMap) {
    if (now - value.lastReset > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }

  if (rateLimitMap.size <= MAX_TRACKED_CLIENTS) return;

  const entries = [...rateLimitMap.entries()]
    .sort((a, b) => a[1].lastReset - b[1].lastReset);

  for (const [key] of entries.slice(0, rateLimitMap.size - MAX_TRACKED_CLIENTS)) {
    rateLimitMap.delete(key);
  }
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();

  if (rateLimitMap.size > MAX_TRACKED_CLIENTS || now % 10_000 < 50) {
    pruneExpiredEntries(now);
  }

  const clientIp = req.ip || 'anonymous';
  const current = rateLimitMap.get(clientIp);

  if (!current || now - current.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, lastReset: now });
    next();
    return;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'داواکارییەکانت زۆرن. تکایە پاش چەند خولەکێک دووبارە هەوڵ بدە.'
    });
    return;
  }

  current.count += 1;
  next();
}
