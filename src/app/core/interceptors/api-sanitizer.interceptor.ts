import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Legacy compatibility interceptor.
 *
 * Do not mutate request text here: academic manuscripts, quotations, source
 * excerpts and code examples must remain intact. Security is enforced through
 * schema validation, trusted server-side evidence acquisition and contextual
 * output encoding rather than deleting substrings from source text.
 */
export const apiSanitizerInterceptor: HttpInterceptorFn = (req, next) => next(req);
