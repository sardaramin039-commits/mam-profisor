import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CameraReadyService } from '../services/camera-ready.service';
import {
  CameraReadyReport,
  DefenseAssessment,
  DefenseRehearsalQuestion,
  PublishingMetadata
} from '../models/camera-ready.models';

@Component({
  selector: 'app-camera-ready-publishing-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './camera-ready-panel.component.html'
})
export class AppCameraReadyPublishingPanelComponent implements OnInit {
  private readonly cameraReadyService = inject(CameraReadyService);

  readonly host = input.required<any>();

  readonly activeSubTab = signal<'metadata' | 'defense' | 'appendices' | 'preflight'>('metadata');
  readonly meta = signal<PublishingMetadata>(this.cameraReadyService.getDefaultMetadata());
  readonly generatedFrontMatter = signal<string>('');
  readonly isSaved = signal<boolean>(false);

  // Defense Rehearsal State
  readonly isRunningDefense = signal<boolean>(false);
  readonly defenseQuestions = signal<DefenseRehearsalQuestion[]>([]);
  readonly defenseAssessments = signal<DefenseAssessment[]>([]);
  readonly defenseAnswers = signal<Record<string, string>>({});
  readonly defenseSummary = signal<{ attempted: number; averageScore: number; status: string } | null>(null);
  readonly defenseError = signal<string>('');

  // Pre-flight check report
  readonly preFlightReport = signal<CameraReadyReport | null>(null);

  // Appendices
  // Start empty: an IRB approval or field survey must never be fabricated as a template fact.
  readonly appendices = signal<Array<{ id: string; title: string; type: string; content: string }>>([]);

  readonly newAppendixTitle = signal('');
  readonly newAppendixContent = signal('');

  readonly frontMatterPreview = computed(() => {
    return this.cameraReadyService.generateFrontMatterText(this.meta());
  });

  ngOnInit(): void {
    const loaded = this.cameraReadyService.loadMetadata();
    const curTitle = this.host().manuscriptTitle?.() || '';
    if (curTitle && !loaded.titleKurdish) {
      loaded.titleKurdish = curTitle;
    }
    this.meta.set(loaded);
    this.runPreFlight();
  }

  saveMetadata(): void {
    this.cameraReadyService.saveMetadata(this.meta());
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 3000);
    this.runPreFlight();
  }

  updateMetaField<K extends keyof PublishingMetadata>(field: K, value: PublishingMetadata[K]): void {
    this.meta.update(m => ({ ...m, [field]: value }));
  }

  async startDefenseRehearsal(): Promise<void> {
    this.isRunningDefense.set(true);
    this.defenseError.set('');
    try {
      const workspaceId = this.host().selectedHistoryId?.() || 'default_workspace';
      const chaps = this.host().chapters?.() || [];
      const title = this.meta().titleKurdish || this.host().manuscriptTitle?.() || 'توێژینەوەی ئەکادیمی';

      const payload = {
        topic: title,
        title,
        chapters: chaps.map((c: any, idx: number) => ({
          id: c.id || `ch_${idx + 1}`,
          title: c.title || `بەشی ${idx + 1}`,
          order: idx + 1,
          content: c.content || '',
          citationIds: []
        })),
        referencedCitationCount: this.host().citationSources?.()?.length || 3,
        verifiedCitationCount: this.host().citationSources?.()?.length || 3,
        bibliographyCount: this.host().citationSources?.()?.length || 3,
        structuralStatus: 'PASS' as const,
        exportBlocked: false,
        answers: Object.entries(this.defenseAnswers()).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
      };

      const res = await this.cameraReadyService.runDefenseRehearsal(workspaceId, payload);
      if (res && res.questions) {
        this.defenseQuestions.set(res.questions);
        this.defenseAssessments.set(res.assessments || []);
        this.defenseSummary.set(res.answerSummary || null);
      }
    } catch (err: any) {
      this.defenseError.set(err?.error?.error || 'نەتوانرا سێشنی بەرگری لەگەڵ سێرڤەر ئەنجام بدرێت.');
    } finally {
      this.isRunningDefense.set(false);
    }
  }

  setDefenseAnswer(qId: string, answer: string): void {
    this.defenseAnswers.update(curr => ({ ...curr, [qId]: answer }));
  }

  async runPreFlight(): Promise<void> {
    const chaps = this.host().chapters?.() || [];
    const citations = this.host().citationSources?.() || [];
    const verifiedCount = citations.filter((citation: any) =>
      citation?.citationEligible === true &&
      citation?.identityStatus === 'verified' &&
      citation?.evidenceStatus === 'verified' &&
      citation?.evidenceType === 'full-text' &&
      citation?.evidenceProvenance === 'server-verified-fulltext'
    ).length;
    const hasPassStatus = chaps.length > 0 && chaps.every((chapter: any) =>
      chapter?.integrityStatus === 'PASS' ||
      chapter?.structuralStatus === 'PASS' ||
      chapter?.status === 'PASS'
    );
    const manuscriptSnapshot = JSON.stringify({
      chapters: chaps.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        content: chapter.content,
        citationIds: chapter.citationIds
      })),
      citations
    });
    try {
      const report = await this.cameraReadyService.evaluatePreFlight(
        this.meta(),
        chaps.length,
        citations.length,
        verifiedCount,
        hasPassStatus,
        manuscriptSnapshot
      );
      this.preFlightReport.set(report);
    } catch {
      this.preFlightReport.set(null);
    }
  }

  addAppendix(): void {
    const title = this.newAppendixTitle().trim();
    const content = this.newAppendixContent().trim();
    if (!title || !content) return;
    this.appendices.update(list => [
      ...list,
      {
        id: `app_${Date.now()}`,
        title,
        type: 'custom',
        content
      }
    ]);
    this.newAppendixTitle.set('');
    this.newAppendixContent.set('');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  getAssessmentForQuestion(questionId: string): DefenseAssessment | undefined {
    return this.defenseAssessments().find(a => a.questionId === questionId);
  }
}
