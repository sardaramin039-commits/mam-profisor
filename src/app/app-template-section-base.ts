import { Directive, Input } from '@angular/core';
import type { AppComponent } from './app';
import { AppControllerActions } from './app-controller-actions';

@Directive()
export abstract class AppTemplateSectionBase extends AppControllerActions {
  private _host!: AppComponent;

  @Input({ required: true })
  get host(): AppComponent {
    return this._host;
  }

  set host(value: AppComponent) {
    this._host = value;
  }

  override ngOnInit(): void {
    // Section components must not execute the root application's startup lifecycle.
  }

  constructor() {
    super();

    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (property === 'host' || property === '_host' || property === 'ngOnInit') {
          return Reflect.get(target, property, receiver);
        }
        const host = target._host;
        if (host && property in host) {
          const value = (host as unknown as Record<PropertyKey, unknown>)[property];
          return typeof value === 'function' ? value.bind(host) : value;
        }
        return Reflect.get(target, property, receiver);
      },
      set: (target, property, value, receiver) => {
        if (property === 'host' || property === '_host') {
          return Reflect.set(target, property, value, receiver);
        }
        const host = target._host;
        if (host && property in host) {
          (host as unknown as Record<PropertyKey, unknown>)[property] = value;
          return true;
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }
}
