import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter to protect API routes from abuse.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const MAX_TRACKED_CLIENTS = 10000;

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || 'anonymous';
  const now = Date.now();

  // Prevent unbounded memory growth when many distinct client addresses are seen.
  if (rateLimitMap.size >= MAX_TRACKED_CLIENTS) {
    for (const [key, info] of rateLimitMap) {
      if (now - info.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  let rateInfo = rateLimitMap.get(clientIp);
  if (!rateInfo || (now - rateInfo.lastReset) > RATE_LIMIT_WINDOW_MS) {
    rateInfo = { count: 1, lastReset: now };
    rateLimitMap.set(clientIp, rateInfo);
    next();
    return;
  }

  if (rateInfo.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'داواکارییەکانت زۆرن. تکایە چەند خولەکێک چاوەڕوان بە پێش ناردنەوەی دەق.'
    });
    return;
  }

  rateInfo.count++;
  next();
}
