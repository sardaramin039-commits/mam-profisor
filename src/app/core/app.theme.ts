import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'academic-sepia';

@Injectable({
  providedIn: 'root'
})
export class AppThemeService {
  readonly currentTheme = signal<ThemeMode>('light');

  setTheme(theme: ThemeMode) {
    this.currentTheme.set(theme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark', 'academic-sepia');
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'academic-sepia') {
        root.classList.add('academic-sepia');
      }
    }
  }

  toggleDarkMode() {
    const nextTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }
}
