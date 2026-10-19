import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { auth } from '../../firebase';
import { isInternalApiUrl } from '../utils/internal-api-url';

/**
 * Production-grade Angular HTTP Interceptor for Firebase Authentication.
 * Securely attaches 'Authorization: Bearer <token>' to all internal /api/ requests.
 * Completely eliminates dev-tokens, mock headers, and insecure bypasses.
 * SSR-safe: gracefully handles server-side execution without crashing.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Only intercept internal backend /api/ requests
  if (!isInternalApiUrl(req.url)) {
    return next(req);
  }

  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // In SSR / non-browser context, forward without attempting client-side token acquisition
  if (!isBrowser) {
    return next(req);
  }

  const currentUser = auth.currentUser;

  // If user is authenticated, resolve token and attach Bearer header
  const tokenPromise = currentUser ? currentUser.getIdToken() : Promise.resolve(null);

  return from(tokenPromise).pipe(
    switchMap((token) => {
      let authReq = req;

      if (token) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      return next(authReq);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        console.warn('Authentication required or session expired for:', req.url);
      }
      return throwError(() => error);
    })
  );
};
