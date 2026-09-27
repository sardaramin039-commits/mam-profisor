import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { inject, PLATFORM_ID, isDevMode } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '../../firebase';

export function isInternalApiUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/api/') || url === '/api') {
    return true;
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (url.startsWith(`${origin}/api/`) || url === `${origin}/api`) {
      return true;
    }
  }

  return false;
}

export const firebaseAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  if (!isInternalApiUrl(req.url)) {
    return next(req);
  }

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const currentUser = auth?.currentUser;

  if (currentUser) {
    return from(currentUser.getIdToken()).pipe(
      switchMap((token: string) => {
        if (!token) {
          return next(req);
        }

        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }

  // Dev preview is intentionally opt-in and only emitted by ng serve/dev builds.
  // Production builds must surface the normal 401 so authentication cannot be bypassed.
  if (isDevMode()) {
    return next(req.clone({
      setHeaders: {
        Authorization: 'Bearer allow-dev-preview',
        'X-Dev-Guest-Token': 'allow-dev-preview'
      }
    }));
  }

  return next(req);
};
