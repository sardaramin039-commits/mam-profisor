import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Kept as a compatibility interceptor while callers migrate to contextual validation.
 *
 * Do not mutate academic prose, citations, source text, code examples, or uploaded content
 * in an HTTP interceptor: that can silently corrupt research data. Client-side headers are
 * not proof of authorization or sanitization. The server validates schemas and auth; Angular
 * escapes interpolated text, and any deliberate HTML rendering must use contextual sanitization.
 */
export const apiSanitizerInterceptor: HttpInterceptorFn = (req, next) => next(req);
