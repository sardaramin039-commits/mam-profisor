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
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "script-src 'self' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com https://ai.studio https://*.run.app https:",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app",
      "upgrade-insecure-requests"
    ].join('; ')
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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

/**
 * Prompt Injection Protection Middleware
 *
 * Academic source text, drafts, citations, and uploaded content must remain byte-for-byte
 * semantically intact. Only fields explicitly intended to carry instructions are inspected.
 * This is a defense-in-depth signal; authorization and trusted system prompts remain authoritative.
 */
export function promptSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  const instructionFields = new Set([
    'prompt',
    'userPrompt',
    'userQuestion',
    'instructions',
    'additionalInstructions',
    'instruction'
  ]);

  let detected = false;

  const inspectValue = (key: string, value: unknown): unknown => {
    if (!instructionFields.has(key) || typeof value !== 'string') {
      return value;
    }

    const injectionPatterns = [
      /ignore\s+all\s+previous\s+instructions/gi,
      /system\s+prompt\s+reveal/gi,
      /you\s+are\s+now\s+a\s+DAN/gi
    ];

    let sanitized = value;
    for (const pattern of injectionPatterns) {
      if (pattern.test(sanitized)) {
        detected = true;
        sanitized = sanitized.replace(pattern, '[ instruction override removed ]');
      }
      pattern.lastIndex = 0;
    }
    return sanitized;
  };

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    const body = req.body as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      body[key] = inspectValue(key, value);
    }
  }

  res.setHeader('X-Prompt-Injection-Detected', detected ? 'true' : 'false');
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
