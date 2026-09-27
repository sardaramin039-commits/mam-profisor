import { Injectable, signal } from '@angular/core';

export type AcademicViewSection =
  | 'editor'
  | 'search'
  | 'research'
  | 'pdf'
  | 'citation'
  | 'export'
  | 'ai-chat'
  | 'review'
  | 'settings'
  | 'dashboard';

@Injectable({
  providedIn: 'root'
})
export class AppNavigationService {
  readonly activeSection = signal<AcademicViewSection>('editor');

  navigateTo(section: AcademicViewSection) {
    this.activeSection.set(section);
  }
}
