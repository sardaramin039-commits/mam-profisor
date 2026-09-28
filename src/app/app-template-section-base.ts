import { Directive, Input } from '@angular/core';
import type { AppComponent } from './app';

@Directive()
export abstract class AppTemplateSectionBase {
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
        return typeof value === 'function'
          ? value.bind(host)
          : value;
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
      }
    });
  }
}

export interface AppTemplateSectionBase extends AppComponent {}
