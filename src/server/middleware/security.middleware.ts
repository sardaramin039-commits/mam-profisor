import { Request, Response, NextFunction } from 'express';

// Local development fallback only.
// Production deployments should configure ALLOWED_ORIGINS or APP_URL explicitly.
const DEFAULT_ALLOWED_DOMAINS = ['localhost', '127.0.0.1'];

function normalizeAllowedOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    );
    return parsed.origin;
  } catch {
    return null;
  }
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app;"
  );

  const originHeader = req.headers.origin;
  const rawEnvOrigins = process.env['ALLOWED_ORIGINS'] || process.env['APP_URL'] || '';
  const envAllowedOrigins = rawEnvOrigins
    .split(',')
    .map(normalizeAllowedOrigin)
    .filter((origin): origin is string => origin !== null);

  let isAllowed = false;

  if (!originHeader) {
    // Same-origin or server-to-server internal request.
    isAllowed = true;
  } else {
    try {
      const requestOrigin = new URL(originHeader);
      const requestHost = (req.get('host') || '').toLowerCase();

      // Same-origin requests must match the complete origin, including scheme and port.
      const sameOrigin =
        requestHost !== '' &&
        `${req.protocol}://${requestHost}` === requestOrigin.origin;

      if (sameOrigin) {
        isAllowed = true;
      } else if (envAllowedOrigins.length > 0) {
        // Explicit production allowlist: exact-origin match only.
        isAllowed = envAllowedOrigins.includes(requestOrigin.origin);
      } else {
        // Development fallback: permit only localhost/loopback origins.
        isAllowed = DEFAULT_ALLOWED_DOMAINS.includes(requestOrigin.hostname);
      }
    } catch {
      isAllowed = false;
    }
  }

  if (isAllowed && originHeader) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else if (originHeader) {
    // Untrusted origin: explicitly deny cross-origin browser access.
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Kurdish-Library-Sanitized, X-RAG-Pipeline-Access'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

/**
 * Prompt Injection Protection Middleware
 * Sanitizes untrusted inputs to reduce common prompt injection patterns before AI processing.
 */
export function promptSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val: unknown): unknown => {
      if (typeof val === 'string') {
        return val
          .replace(/ignore\s+all\s+previous\s+instructions/gi, '[ sanitized instruction override ]')
          .replace(/system\s+prompt\s+reveal/gi, '[ sanitized prompt reveal ]')
          .replace(/you\s+are\s+now\s+a\s+DAN/gi, '[ sanitized DAN override ]');
      }
      if (Array.isArray(val)) {
        return val.map(sanitizeValue);
      }
      if (val && typeof val === 'object') {
        const sanitizedObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val)) {
          sanitizedObj[k] = sanitizeValue(v);
        }
        return sanitizedObj;
      }
      return val;
    };

    req.body = sanitizeValue(req.body);
  }
  next();
}

export function geminiApiKeyCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  const keysEnv = process.env['GEMINI_API_KEY'];
  if (!keysEnv || keysEnv.trim() === '') {
    res.status(500).json({
      error: 'کۆدی سەرچاوەی نەخۆش: کلیلەکانی Gemini API (GEMINI_API_KEY) لە ژینگەی سێرڤەردا دەستنیشان نەکراون. تکایە کلیلەکان لە پانێڵی Secrets زیاد بکە پێش ئەوەی بەردەوام بیت.'
    });
    return;
  }
  next();
}
