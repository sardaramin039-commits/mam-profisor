import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from '../app.routes';

export const APP_PROVIDERS: Array<Provider | EnvironmentProviders> = [
  provideHttpClient(withFetch()),
  provideRouter(
    routes,
    withComponentInputBinding(),
    withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
  )
];
