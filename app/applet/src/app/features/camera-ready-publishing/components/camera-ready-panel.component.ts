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
  readonly appendices = signal<Array<{ id: string; title: string; type: string; content: string }>>([
    {
      id: 'app_a',
      title: 'پاشکۆی (ئـ): بەڵگەنامەی ڕەزامەندیی ئەخلاقی (IRB Approval Certificate)',
      type: 'ethical',
      content: 'بەپێی کۆبوونەوەی لێژنەی ئەخلاقیی زانستی، ئەم توێژینەوەیە سەرجەم مەرجەکانی پاراستنی تایبەتمەندی و مافی بەشداربووانی جێبەجێکردووە.'
    },
    {
      id: 'app_b',
      title: 'پاشکۆی (ب): پرسیارنامەی توێژینەوە و ئامرازی کۆکردنەوەی داتا (Survey Tool)',
      type: 'survey',
      content: 'فۆرمی ڕاپرسیی پێوانەکردنی متغیرەکان بە زمانی کوردی کە ئاراستەی نموونەی توێژینەوە کراوە.'
    }
  ]);

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
      const workspaceId = this.host().selectedHistoryId?.() || '';
      if (!workspaceId) {
        throw new Error('پێش ئەنجامدانی تاقیکردنەوەی بەرگری، workspace ـێکی ڕاستەقینە هەڵبژێرە.');
      }

      await this.runPreFlight();
      const currentPreFlight = this.preFlightReport();
      const chaps = this.host().chapters?.() || [];
      const citationSources = this.host().citationSources?.() || [];
      const verifiedCitationCount = this.countVerifiedCitations(citationSources);
      const hasStructuredChapters = chaps.length >= 3 && chaps.every((chapter: any) =>
        typeof chapter.title === 'string' && chapter.title.trim().length > 0 &&
        typeof chapter.content === 'string' && chapter.content.trim().length > 0
      );
      const title = this.meta().titleKurdish || this.host().manuscriptTitle?.() || 'توێژینەوەی ئەکادیمی';

      const payload = {
        topic: title,
        title,
        chapters: chaps.map((c: any, idx: number) => ({
          id: c.id || `ch_${idx + 1}`,
          title: c.title || `بەشی ${idx + 1}`,
          order: idx + 1,
          content: c.content || '',
          citationIds: Array.isArray(c.citationIds) ? c.citationIds : []
        })),
        referencedCitationCount: citationSources.length,
        verifiedCitationCount,
        bibliographyCount: citationSources.length,
        structuralStatus: hasStructuredChapters ? 'PASS' as const : 'REJECT' as const,
        exportBlocked: currentPreFlight?.overallStatus !== 'CAMERA_READY',
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
      this.defenseError.set(err?.error?.error || err?.message || 'نەتوانرا سێشنی بەرگری لەگەڵ سێرڤەر ئەنجام بدرێت.');
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
    const meta = this.meta();
    const hasStructuredChapters = chaps.length >= 3 && chaps.every((chapter: any) =>
      typeof chapter.title === 'string' && chapter.title.trim().length > 0 &&
      typeof chapter.content === 'string' && chapter.content.trim().length > 0
    );

    const fingerprintMaterial = {
      metadata: meta,
      chapters: chaps.map((chapter: any) => ({
        id: String(chapter.id || ''),
        title: String(chapter.title || ''),
        content: String(chapter.content || '')
      })),
      citations: citations.map((citation: unknown) => {
        if (!citation || typeof citation !== 'object' || Array.isArray(citation)) {
          return { value: String(citation ?? '') };
        }
        const record = citation as Record<string, unknown>;
        return {
          sourceId: String(record['sourceId'] || ''),
          title: String(record['title'] || record['sourceTitle'] || ''),
          author: String(record['author'] || ''),
          year: String(record['year'] || record['publicationYear'] || ''),
          doi: String(record['doi'] || record['doiOrIsbn'] || ''),
          identityStatus: record['identityStatus'],
          evidenceStatus: record['evidenceStatus'],
          evidenceType: record['evidenceType'],
          evidenceProvenance: record['evidenceProvenance'],
          citationEligible: record['citationEligible'],
          evidenceText: String(record['evidenceText'] || '')
        };
      })
    };

    const report = await this.cameraReadyService.evaluatePreFlight(
      meta,
      chaps.length,
      citations.length,
      this.countVerifiedCitations(citations),
      hasStructuredChapters,
      fingerprintMaterial
    );
    this.preFlightReport.set(report);
  }

  private countVerifiedCitations(citations: unknown[]): number {
    return citations.filter((citation: unknown) => {
      if (!citation || typeof citation !== 'object' || Array.isArray(citation)) return false;
      const record = citation as Record<string, unknown>;
      return record['citationEligible'] === true
        && record['identityStatus'] === 'verified'
        && record['evidenceStatus'] === 'verified'
        && record['evidenceType'] === 'full-text'
        && record['evidenceProvenance'] === 'server-verified-fulltext'
        && record['existenceVerified'] === true
        && typeof record['evidenceText'] === 'string'
        && record['evidenceText'].trim().length > 0;
    }).length;
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
