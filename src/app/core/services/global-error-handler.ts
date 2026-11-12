import { ErrorHandler, Injectable, signal } from '@angular/core';

function createErrorLogId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? 'ERR_' + uuid : 'ERR_' + Date.now() + '_' + Math.trunc(globalThis.performance?.now?.() || 0);
}

export interface AppErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  handledLocally: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  public errorLogs = signal<AppErrorLog[]>([]);
  public lastError = signal<string | null>(null);

  handleError(error: unknown): void {
    const timestamp = new Date().toISOString();
    const errObj = error as { message?: string; stack?: string } | null;
    const message = errObj?.message || (typeof error === 'string' ? error : 'زانستگاوە: هەڵەیەکی نەدیار ڕوویدا');
    const stack = errObj?.stack || undefined;

    // Suppress benign offline fallback notices from Firestore SDK
    if (message.includes('Could not reach Cloud Firestore backend') ||
        message.includes('client will operate in offline mode') ||
        message.includes("Database '(default)' not found") ||
        (message.includes('@firebase/firestore') && message.includes('unavailable'))) {
      console.warn('[GlobalErrorHandler: Offline Notice]', message);
      return;
    }

    console.error('[GlobalErrorHandler]', message, error);

    const log: AppErrorLog = {
      id: createErrorLogId(),
      timestamp,
      message,
      stack,
      handledLocally: true
    };

    this.errorLogs.update(logs => [log, ...logs.slice(0, 49)]); // keep last 50 logs
    this.lastError.set(message);

    // Save error log to localStorage for offline error reporting
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('app_system_error_logs', JSON.stringify(this.errorLogs()));
      } catch {
        // Storage full
      }
    }
  }

  clearErrors(): void {
    this.errorLogs.set([]);
    this.lastError.set(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('app_system_error_logs');
      } catch {
        // Ignore storage error
      }
    }
  }
}
