import { Injectable, signal } from '@angular/core';
import { ChapterItemModel as ChapterItem, StructureReviewResult, AcademicSourceModel } from '../domain/models';

@Injectable({
  providedIn: 'root'
})
export class AcademicStoreService {
  // Navigation & View State
  public viewMode = signal<'splash' | 'workspace'>('splash');
  public mainTab = signal<'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive'>('editor');
  public activeSubTab = signal<'editor' | 'review' | 'glossary' | 'citations' | 'chunks' | 'pulse' | 'health_check' | 'timeline' | 'grammar_panel'>('editor');
  
  // Modals & Panels
  public isSettingsOpen = signal<boolean>(false);
  public isAdminOpen = signal<boolean>(false);
  public isBookmarksOpen = signal<boolean>(false);
  
  // Feature Panels
  public isDailyPulseOpen = signal<boolean>(true);
  public isCitationHealthCheckOpen = signal<boolean>(false);
  public isChapterTimelineOpen = signal<boolean>(false);
  public isGrammarPanelOpen = signal<boolean>(false);

  // Dark mode
  public academicDarkMode = signal<boolean>(false);

  // Dynamic Writing State
  public chapters = signal<ChapterItem[]>([]);
  public sources = signal<AcademicSourceModel[]>([]);
  public viewedChapter = signal<ChapterItem | null>(null);
  public activeReview = signal<StructureReviewResult | null>(null);

  // Progress indicators
  public isWritingProgress = signal<boolean>(false);
  public isHumanizingProgress = signal<boolean>(false);
  public isSingleWritingProgress = signal<number | null>(null);

  // Feedback notifications & logs
  public feedbackMessage = signal<string | null>(null);
  public systemLogs = signal<string[]>([]);

  public addLog(log: string): void {
    console.log(`[AcademicStoreLog] ${log}`);
    this.systemLogs.update(prev => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${log}`]);
  }

  public setFeedback(msg: string | null, timeoutMs = 3000): void {
    this.feedbackMessage.set(msg);
    if (msg && timeoutMs > 0) {
      setTimeout(() => {
        if (this.feedbackMessage() === msg) {
          this.feedbackMessage.set(null);
        }
      }, timeoutMs);
    }
  }
}
