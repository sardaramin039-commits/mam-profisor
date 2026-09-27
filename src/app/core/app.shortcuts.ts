import { Injectable, inject } from '@angular/core';
import { AppStateService } from './app.state';

@Injectable({
  providedIn: 'root'
})
export class AppShortcutsService {
  private appState = inject(AppStateService);

  registerGlobalShortcuts(onSave?: () => void, onSearch?: () => void) {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Ctrl/Cmd + S -> Quick Save
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (onSave) onSave();
      }
      // Ctrl/Cmd + K -> Quick Search
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (onSearch) onSearch();
      }
      // Alt + S -> Toggle Sidebar
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.appState.toggleSidebar();
      }
    });
  }
}
