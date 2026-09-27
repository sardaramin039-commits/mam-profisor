import { Request, Response, NextFunction } from 'express';

// Strict ALLOWED_ORIGINS allowlist validation
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env['NODE_ENV'] === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app;"
  );

  const originHeader = req.headers.origin;
  const rawEnvOrigins = process.env['ALLOWED_ORIGINS'] || process.env['APP_URL'] || '';
  const envAllowedOrigins = rawEnvOrigins
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let isAllowed = false;

  if (!originHeader) {
    // Same-origin or server-to-server internal request
    isAllowed = true;
  } else {
    try {
      const normalizeOrigin = (origin: string): string => origin.trim().replace(/\\/$/, '');
      const allowedOrigins = envAllowedOrigins.map(normalizeOrigin);
      isAllowed = allowedOrigins.length > 0
        ? allowedOrigins.includes(normalizeOrigin(originHeader))
        : DEFAULT_ALLOWED_ORIGINS.has(normalizeOrigin(originHeader)); catch {
            return hostname === allowed || hostname.endsWith('.' + allowed);
          }
        });
      } else {
        isAllowed = DEFAULT_ALLOWED_DOMAINS.some(domain =>
          hostname === domain || hostname.endsWith('.' + domain)
        );
      }
    } catch {
      isAllowed = false;
    }
  }

  if (isAllowed && originHeader) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!originHeader) {
    // Same origin
  } else {
    // Untrusted origin: restrict access by returning null origin
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Kurdish-Library-Sanitized, X-RAG-Pipeline-Access');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

/**
 * Prompt Injection Protection Middleware
 * Sanitizes untrusted inputs to prevent prompt injection attacks (e.g., "Ignore previous instructions")
 */
export function promptSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val: any): any => {
      if (typeof val === 'string') {
        // Strip common prompt injection control characters and aggressive prompt overrides
        return val
          .replace(/ignore\s+all\s+previous\s+instructions/gi, '[ sanitized instruction override ]')
          .replace(/system\s+prompt\s+reveal/gi, '[ sanitized prompt reveal ]')
          .replace(/you\s+are\s+now\s+a\s+DAN/gi, '[ sanitized DAN override ]');
      }
      if (Array.isArray(val)) {
        return val.map(sanitizeValue);
      }
      if (val && typeof val === 'object') {
        const sanitizedObj: Record<string, any> = {};
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

