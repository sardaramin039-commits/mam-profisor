import { Request, Response, NextFunction } from 'express';

// In-memory limiter for a single application instance.
// For multi-instance production deployments, use a shared store (e.g. Redis).
type RateState = { count: number; lastReset: number };

const rateLimitMap = new Map<string, RateState>();
const authenticatedRateLimitMap = new Map<string, RateState>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 120;
const AI_MAX_REQUESTS = 20;
const AUTHENTICATED_MAX_REQUESTS = 90;
const AUTHENTICATED_AI_MAX_REQUESTS = 30;
const MAX_TRACKED_CLIENTS = 10_000;

function isAiPath(path: string): boolean {
  const normalized = path.toLocaleLowerCase();

  return (
    normalized.startsWith('/ai-tools/') ||
    normalized === '/agents/run' ||
    normalized.startsWith('/platform/') ||
    normalized.startsWith('/library/search') ||
    normalized.startsWith('/library/ocr') ||
    normalized.startsWith('/chatgpt-sources/') ||
    normalized.startsWith('/multi-agent/') ||
    normalized === '/refine' ||
    normalized.startsWith('/platform/multi-agent-orchestrate') ||
    normalized === '/generate_chapter' ||
    normalized === '/deep_research_agent' ||
    normalized === '/multi_agent_pipeline' ||
    normalized === '/grounded_generate' ||
    normalized === '/semantic_database_search' ||
    normalized === '/multi_academic_search' ||
    normalized.startsWith('/ai_') ||
    normalized.startsWith('/research_') ||
    normalized.startsWith('/citation_') ||
    normalized.startsWith('/fact_') ||
    normalized.startsWith('/plagiarism_') ||
    normalized.startsWith('/kurdish_') ||
    normalized.startsWith('/construct_') ||
    normalized.startsWith('/analyze_') ||
    normalized.startsWith('/harvard_') ||
    normalized.startsWith('/simulate_') ||
    normalized.startsWith('/export_') ||
    normalized.startsWith('/external-integrations/test-')
  );
}

function getLimit(path: string): number {
  return isAiPath(path) ? AI_MAX_REQUESTS : DEFAULT_MAX_REQUESTS;
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  const clientIp = req.ip || 'anonymous';
  const now = Date.now();
  const maxRequests = getLimit(req.path);

  if (rateLimitMap.size >= MAX_TRACKED_CLIENTS) {
    for (const [key, info] of rateLimitMap) {
      if (now - info.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
    if (rateLimitMap.size >= MAX_TRACKED_CLIENTS) {
      res.status(503).json({
        success: false,
        error: 'خزمەتگوزاری کاتییەکەی rate limiter ـەکە پڕە؛ تکایە دواتر هەوڵ بدەرەوە.'
      });
      return;
    }
  }

  const aiRequest = isAiPath(req.path);
  const rateKey = aiRequest
    ? `${clientIp}:ai-global`
    : `${clientIp}:default:${req.path}`;
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


export function authenticatedRateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  const user = (req as Request & { user?: { uid?: string } }).user;
  const uid = typeof user?.uid === 'string' ? user.uid.trim() : '';
  if (!uid) {
    next();
    return;
  }

  const aiRequest = isAiPath(req.path);
  const key = `uid:${uid}:${aiRequest ? 'ai' : 'default'}`;
  const maxRequests = aiRequest ? AUTHENTICATED_AI_MAX_REQUESTS : AUTHENTICATED_MAX_REQUESTS;
  const now = Date.now();
  let rateInfo = authenticatedRateLimitMap.get(key);

  if (!rateInfo || now - rateInfo.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateInfo = { count: 1, lastReset: now };
    authenticatedRateLimitMap.set(key, rateInfo);
    next();
    return;
  }

  if (rateInfo.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - rateInfo.lastReset)) / 1000)
    );
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'ژمارەی داواکارییەکانی ئەکاونتەکەت زۆرە. تکایە دواتر هەوڵ بدەرەوە.',
      retryAfterSeconds
    });
    return;
  }

  rateInfo.count++;
  next();
}
