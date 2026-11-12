import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '../../firebase';
import { isInternalApiUrl } from '../utils/internal-api-url';
export { isInternalApiUrl } from '../utils/internal-api-url';

/**
 * Angular HTTP Interceptor that attaches the Firebase ID token as a Bearer token
 * strictly to internal /api/* requests.
 *
 * Rules:
 * 1. Omitted for all third-party endpoints (OpenAlex, Crossref, Google Books, etc.).
 * 2. Avoids browser-side APIs during SSR (Server-Side Rendering).
 * 3. Waits until Firebase has settled the initial auth state, preventing startup races.
 * 4. Leaves unauthenticated requests untouched so protected APIs can return 401.
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

  // Firebase can briefly expose currentUser === null while restoring persisted auth.
  // Wait for the initial auth state to settle before deciding whether to attach a token.
  return from(auth.authStateReady()).pipe(
    switchMap(() => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // No authenticated Firebase user: let the protected API return 401.
        return next(req);
      }

      return from(currentUser.getIdToken()).pipe(
        switchMap((token: string) => {
          if (!token) {
            return next(req);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            })
          );
        })
      );
    })
  );
};
