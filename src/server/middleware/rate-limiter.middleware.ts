import { Request, Response, NextFunction } from 'express';

// Simple In-Memory Rate Limiter to protect Gemini API from abuse
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;
  const now = Date.now();
  
  let rateInfo = rateLimitMap.get(clientIp);
  if (!rateInfo || (now - rateInfo.lastReset) > RATE_LIMIT_WINDOW_MS) {
    rateInfo = { count: 1, lastReset: now };
    rateLimitMap.set(clientIp, rateInfo);
    return next();
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
