import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '../../firebase';

/**
 * Checks whether the target URL is an internal /api/* endpoint.
 * Ensures the token is omitted for third-party endpoints (Crossref, OpenAlex, Google Books, etc.).
 */
export function isInternalApiUrl(url: string): boolean {
  if (!url) return false;
  // Relative /api/ path
  if (url.startsWith('/api/') || url === '/api') {
    return true;
  }
  // Absolute URLs matching local origin or current window origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (url.startsWith(`${origin}/api/`) || url === `${origin}/api`) {
      return true;
    }
  }
  return false;
}

/**
 * Angular HTTP Interceptor that attaches the Firebase ID token as a Bearer token
 * strictly to internal /api/* requests.
 *
 * Rules:
 * 1. Omitted for all third-party endpoints (OpenAlex, Crossref, Google Books, etc.).
 * 2. Avoids browser-side APIs during SSR (Server-Side Rendering).
 * 3. Gracefully preserves dev preview tokens in non-production environments when offline or unauthenticated.
 */
export const firebaseAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);

  // Avoid browser-side APIs and Auth retrieval during SSR
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Only attach Bearer token to internal /api/* endpoints; omit for all external 3rd-party services
  if (!isInternalApiUrl(req.url)) {
    return next(req);
  }

  // If request already has an Authorization header, preserve it
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  // Check current Firebase User on the client side
  const currentUser = auth?.currentUser;

  if (currentUser) {
    return from(currentUser.getIdToken()).pipe(
      switchMap((token: string) => {
        if (token) {
          const authorizedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(authorizedReq);
        }
        return next(req);
      })
    );
  }

  // No authenticated Firebase user: let the protected API return 401.
  return next(req);
};
