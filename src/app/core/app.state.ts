import { Injectable, signal, computed } from '@angular/core';

export interface GlobalAppState {
  currentView: string;
  isSidebarOpen: boolean;
  themeMode: 'light' | 'dark';
  activeAgentId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  readonly currentView = signal<string>('editor');
  readonly isSidebarOpen = signal<boolean>(true);
  readonly themeMode = signal<'light' | 'dark'>('light');
  readonly activeAgentId = signal<string | null>(null);

  readonly stateSummary = computed(() => ({
    view: this.currentView(),
    sidebar: this.isSidebarOpen(),
    theme: this.themeMode(),
    activeAgent: this.activeAgentId()
  }));

  setView(view: string) {
    this.currentView.set(view);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(prev => !prev);
  }

  setTheme(theme: 'light' | 'dark') {
    this.themeMode.set(theme);
  }

  setActiveAgent(agentId: string | null) {
    this.activeAgentId.set(agentId);
  }
}
