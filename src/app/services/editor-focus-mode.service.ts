import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditorFocusModeService {
  private readonly STORAGE_KEY = 'academic_editor_focus_mode';

  readonly isFocusMode = signal<boolean>(false);

  constructor() {
    this.restorePreference();
    this.setupKeyboardShortcuts();
  }

  private restorePreference(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'true') {
        this.isFocusMode.set(true);
        this.applyBodyClass(true);
      }
    } catch {
      // Ignore localStorage exceptions in restricted contexts
    }
  }

  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Pressing Escape while in focus mode exits focus mode immediately
      if (event.key === 'Escape' && this.isFocusMode()) {
        this.exitFocusMode();
      }
    });
  }

  toggleFocusMode(): boolean {
    const nextState = !this.isFocusMode();
    this.isFocusMode.set(nextState);
    this.applyBodyClass(nextState);
    this.savePreference(nextState);
    return nextState;
  }

  enableFocusMode(): void {
    if (!this.isFocusMode()) {
      this.isFocusMode.set(true);
      this.applyBodyClass(true);
      this.savePreference(true);
    }
  }

  exitFocusMode(): void {
    if (this.isFocusMode()) {
      this.isFocusMode.set(false);
      this.applyBodyClass(false);
      this.savePreference(false);
    }
  }

  private applyBodyClass(active: boolean): void {
    if (typeof document === 'undefined') return;
    if (active) {
      document.body.classList.add('mam-focus-mode-active');
    } else {
      document.body.classList.remove('mam-focus-mode-active');
    }
  }

  private savePreference(active: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, active ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
  }
}
