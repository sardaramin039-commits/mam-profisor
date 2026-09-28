import {
  ApplicationConfig,
  ErrorHandler,
  provideZonelessChangeDetection,
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';

import {routes} from './app.routes';
import {GlobalErrorHandlerService} from './core/services/global-error-handler';
import {apiSanitizerInterceptor} from './core/interceptors/api-sanitizer.interceptor';
import {apiTimeoutInterceptor} from './core/interceptors/api-timeout.interceptor';
import {firebaseAuthInterceptor} from './core/interceptors/firebase-auth.interceptor';
import {CORE_PROVIDERS} from './core/providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([firebaseAuthInterceptor, apiSanitizerInterceptor, apiTimeoutInterceptor])
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
    ...CORE_PROVIDERS
  ],
};
