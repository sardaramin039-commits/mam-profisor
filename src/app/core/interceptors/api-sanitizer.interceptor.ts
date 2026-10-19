import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isInternalApiUrl } from '../utils/internal-api-url';

/**
 * Sanitizes input string to prevent script injection and unauthorized RAG payload manipulation
 */
function sanitizeStringValue(value: string): string {
  if (!value) return value;
  // Remove script tags and inline event handlers while retaining Kurdish characters & standard punctuation
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Deep sanitization for request objects and arrays
 */
function sanitizeRequestBody<T>(body: T): T {
  if (typeof body === 'string') {
    return sanitizeStringValue(body) as unknown as T;
  }

  if (Array.isArray(body)) {
    return body.map(item => sanitizeRequestBody(item)) as unknown as T;
  }

  if (body !== null && typeof body === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const key of Object.keys(body as Record<string, unknown>)) {
      const val = (body as Record<string, unknown>)[key];
      sanitizedObj[key] = sanitizeRequestBody(val);
    }
    return sanitizedObj as T;
  }

  return body;
}

/**
 * Angular HttpInterceptorFn for sanitizing user inputs & securing RAG pipeline requests
 */
export const apiSanitizerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Only intercept requests directed to our backend API or RAG endpoints
  if (isInternalApiUrl(req.url)) {
    let sanitizedReq = req.clone({
      setHeaders: {
        'X-Kurdish-Library-Sanitized': 'true',
        'X-RAG-Pipeline-Access': 'authorized',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (req.body) {
      const sanitizedBody = sanitizeRequestBody(req.body);
      sanitizedReq = sanitizedReq.clone({ body: sanitizedBody });
    }

    return next(sanitizedReq);
  }

  return next(req);
};
