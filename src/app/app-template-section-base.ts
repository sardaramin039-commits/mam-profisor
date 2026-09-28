import { Directive, Input } from '@angular/core';
import type { AppComponent } from './app';

@Directive()
export abstract class AppTemplateSectionBase {
  // Template proxy: preserves the existing AppComponent API while physically splitting
  // the monolithic template into independently compiled sections.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  private _host!: AppComponent;

  @Input({ required: true })
  get host(): AppComponent {
    return this._host;
  }

  set host(value: AppComponent) {
    this._host = value;
  }

  constructor() {
    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (property === 'host' || Reflect.has(target, property)) {
          return Reflect.get(target, property, receiver);
        }
        const host = target._host;
        if (!host) return undefined;
        const value = host[property as keyof AppComponent] as unknown;
        if (typeof value === 'function' && !('set' in value) && !('update' in value)) {
          return value.bind(host);
        }
        return value;
      },
      set: (target, property, value, receiver) => {
        if (property === 'host' || Reflect.has(target, property)) {
          return Reflect.set(target, property, value, receiver);
        }
        const host = target._host;
        if (host && property in host) {
          (host as Record<string | symbol, unknown>)[property] = value;
          return true;
        }
        return Reflect.set(target, property, value, receiver);
      },
    });
  }
}
