import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface EvidenceRow {
  claim: string;
  citation: string;
  paragraph: string;
}

@Component({
  selector: 'app-academic-quality-center',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './academic-quality-center.html'
})
export class AcademicQualityCenterComponent {
  @Input({ required: true }) vm!: any;

  private http = inject(HttpClient);

  readonly topic = signal('');
  readonly isRunning = signal(false);
  readonly isGapRunning = signal(false);
  readonly error = signal<string | null>(null);
  readonly gapError = signal<string | null>(null);
  readonly pipeline = signal<any | null>(null);
  readonly gapResult = signal<any | null>(null);

  readonly evidenceRows = computed<EvidenceRow[]>(() => {
    const paragraphs = this.pipeline()?.groundedGeneration?.paragraphs;
    if (!Array.isArray(paragraphs)) return [];
    return paragraphs.flatMap((paragraph: any) => {
      const claims = Array.isArray(paragraph?.claims) ? paragraph.claims : [];
      if (!claims.length) {
        const text = String(paragraph?.text || '').trim();
        return text ? [{ claim: text.slice(0, 280), citation: 'بەڵگەی citation ـی دیاریکراو نییە', paragraph: text }] : [];
      }
      return claims.slice(0, 8).map((claim: any) => ({
        claim: String(claim?.claim || claim?.text || claim?.statement || '').trim() || 'Claim ـی بێ ناو',
        citation: String(claim?.citationText || claim?.citation || '').trim() || 'بەڵگەی citation ـی دیاریکراو نییە',
        paragraph: String(paragraph?.text || '').trim()
      }));
    }).slice(0, 20);
  });

  get activeChapter(): any {
    return this.vm?.activeChapter?.() || this.vm?.chapters?.()?.[0] || null;
  }

  useActiveTopic(): void {
    const chapter = this.activeChapter;
    const formTitle = this.vm?.refineForm?.get?.('title')?.value;
    this.topic.set(String(chapter?.title || formTitle || '').trim());
  }

  runFullAudit(): void {
    const chapter = this.activeChapter;
    const topic = (this.topic() || chapter?.title || this.vm?.refineForm?.get?.('title')?.value || '').trim();
    const draftText = String(chapter?.content || this.vm?.getActiveThesisText?.() || '').trim();

    if (!topic || !draftText) {
      this.error.set('پێش پشکنین، ناونیشان و دەقی بەشەکە پێویستە.');
      return;
    }

    this.isRunning.set(true);
    this.error.set(null);

    const rawSources = this.collectSources();
    const discipline = String(this.vm?.refineForm?.get?.('discipline')?.value || 'گشتی');

    this.http.post<any>('/api/multi_agent_pipeline', {
      topic,
      discipline,
      draftText: draftText.slice(0, 250000),
      rawSources
    }).subscribe({
      next: result => {
        this.pipeline.set(result?.pipeline || null);
        this.isRunning.set(false);
      },
      error: err => {
        console.error('Academic quality pipeline error:', err);
        this.error.set('پشکنینی تەواوی ئەکادیمی سەرکەوتوو نەبوو.');
        this.isRunning.set(false);
      }
    });
  }

  runGapAnalysis(): void {
    const chapter = this.activeChapter;
    const topic = (this.topic() || chapter?.title || this.vm?.refineForm?.get?.('title')?.value || '').trim();
    if (!topic) {
      this.gapError.set('ناونیشانی توێژینەوە پێویستە.');
      return;
    }

    this.isGapRunning.set(true);
    this.gapError.set(null);

    const literature = this.collectSources()
      .map((source: any) => {
        const title = String(source?.title || source?.sourceTitle || '').trim();
        const author = String(source?.author || source?.bookAuthor || '').trim();
        const content = String(source?.content || source?.text || source?.chunkText || '').trim();
        return [title, author, content.slice(0, 5000)].filter(Boolean).join(' — ');
      })
      .filter(Boolean)
      .join('\n');

    const discipline = String(this.vm?.refineForm?.get?.('discipline')?.value || 'گشتی');

    this.http.post<any>('/api/analyze_literature_gap', {
      topic,
      discipline,
      existingLiterature: literature.slice(0, 100000)
    }).subscribe({
      next: result => {
        this.gapResult.set(result);
        this.isGapRunning.set(false);
      },
      error: err => {
        console.error('Literature gap error:', err);
        this.gapError.set('شیکاری کەلێنی توێژینەوە سەرکەوتوو نەبوو.');
        this.isGapRunning.set(false);
      }
    });
  }

  applyFinalDraft(): void {
    const text = String(this.pipeline()?.finalThesisDraftKurdish || '').trim();
    const chapter = this.activeChapter;
    if (!text || !chapter?.id) return;
    this.vm?.editorService?.updateChapterContent?.(
      chapter.id,
      text,
      'جێبەجێکردنی دەقی پاش QA و Multi-Agent'
    );
    this.vm?.toastService?.showSuccess?.(
      'دەقی پاش QA جێبەجێ کرا',
      'دەقی کۆتایی لە دوای پشکنینی Multi-Agent ـەوە لە بەشەکەدا جێگیرکرا.'
    );
  }

  private collectSources(): any[] {
    const ragChunks = this.vm?.ragResearchService?.retrievedChunks?.() || [];
    const storeSources = this.vm?.sources?.() || [];
    const combined = [...ragChunks, ...storeSources];
    const seen = new Set<string>();

    return combined.filter((source: any) => {
      const key = String(
        source?.id ||
        source?.sourceId ||
        source?.doi ||
        source?.title ||
        source?.sourceTitle ||
        ''
      ).trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 100);
  }

  severityLabel(value: string): string {
    const labels: Record<string, string> = {
      low: 'کەم',
      medium: 'مامناوەند',
      high: 'بەرز',
      critical: 'گرنگی زۆر'
    };
    return labels[value] || value;
  }

  statusClass(passed: boolean): string {
    return passed
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-red-700 bg-red-50 border-red-200';
  }
}
