import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WordExportService } from '../../services/word-export';
import { EditorService } from '../editor/services/editor';
import { Data } from '../../services/data';
import { ExportContractService, ExportGateResponse } from '../../services/export-contract.service';
import { UNIVERSITIES, UniversityFormatPreset } from '../academic-suite/university-layout-formatter.component';
import { SourceVerificationService } from '../../services/source-verification.service';
import { WordCountControllerService } from '../../services/word-count-controller.service';
import { CameraReadyService } from '../camera-ready-publishing/services/camera-ready.service';

@Component({
  selector: 'app-export-word',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 font-sans text-right" dir="rtl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <mat-icon class="!w-5 !h-5 text-xl">description</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100">هەناردەکردنی فەرمیی تێز (University Standard Export)</h3>
            <p class="text-[11px] text-slate-400">بەرهەمهێنانی .docx و .pdf بە مارجنی ٣.٥ سم، بەرگی فەرمی و پاشکۆکان</p>
          </div>
        </div>
        <span class="text-[10px] font-mono px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-800 rounded-full font-bold">
          {{ currentUni().nameKurdish }}
        </span>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">ناونیشانی دۆکیومێنت:</label>
          <input
            type="text"
            [value]="title()"
            (input)="title.set($any($event.target).value)"
            placeholder="ناونیشانی فایلی Word..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium transition"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">پێوەری فەرمیی زانکۆ:</label>
            <select
              [value]="selectedUniId()"
              (change)="onUniChange($any($event.target).value)"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
              @for (u of universities; track u.id) {
                <option [value]="u.id">{{ u.nameKurdish }}</option>
              }
            </select>
          </div>

          <div class="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <div class="flex justify-between text-slate-400">
              <span>مارجنی بەستنەوە (Gutter):</span>
              <strong class="text-slate-200">{{ currentUni().innerGutterMarginCm }} سم</strong>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>مارجنی چواردەور:</span>
              <strong class="text-slate-200">{{ currentUni().outerMarginCm }} سم</strong>
            </div>
          </div>
        </div>
      </div>

      @if (exportError()) {
        <div class="rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 px-3.5 py-2.5 text-xs leading-relaxed flex items-center gap-2">
          <mat-icon class="text-rose-400 !w-4 !h-4 text-base flex-none">error_outline</mat-icon>
          <span>{{ exportError() }}</span>
        </div>
      }

      @if (exportSuccess()) {
        <div class="rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 px-3.5 py-2.5 text-xs leading-relaxed flex items-center gap-2">
          <mat-icon class="text-emerald-400 !w-4 !h-4 text-base flex-none">check_circle</mat-icon>
          <span>{{ exportSuccess() }}</span>
        </div>
      }

      <div class="flex items-center gap-3 pt-1 flex-wrap">
        <button
          type="button"
          (click)="exportToWord()"
          [disabled]="isExporting()"
          class="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
          <mat-icon class="!w-4 !h-4 text-base">file_download</mat-icon>
          <span>{{ isExporting() ? 'پشکنین و هەناردەکردن...' : 'دابەزاندنی Word (.docx)' }}</span>
        </button>

        <button
          type="button"
          (click)="exportToPdf()"
          [disabled]="isExporting()"
          class="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
          <mat-icon class="!w-4 !h-4 text-base">print</mat-icon>
          <span>چاپ / دابەزاندنی PDF</span>
        </button>
      </div>
    </div>
  `
})
export class ExportWordComponent {
  private wordExportService = inject(WordExportService);
  private editorService = inject(EditorService);
  private cameraReadyService = inject(CameraReadyService);
  private data = inject(Data);
  private http = inject(HttpClient);
  private exportContractService = inject(ExportContractService);
  private sourceVerificationService = inject(SourceVerificationService);
  private wordCountController = inject(WordCountControllerService);

  universities = UNIVERSITIES;
  selectedUniId = signal<string>('salahaddin');
  title = signal<string>('تێزی_ئەکادیمی');
  isExporting = signal<boolean>(false);
  exportError = signal<string | null>(null);
  exportSuccess = signal<string | null>(null);

  constructor() {
    try {
      const savedUni = localStorage.getItem('mam_selected_university');
      if (savedUni && this.universities.some(u => u.id === savedUni)) {
        this.selectedUniId.set(savedUni);
      }
      const meta = this.cameraReadyService.loadMetadata();
      if (meta.titleKurdish) {
        this.title.set(meta.titleKurdish);
      }
    } catch {}
  }

  currentUni(): UniversityFormatPreset {
    return this.universities.find(u => u.id === this.selectedUniId()) || this.universities[0];
  }

  onUniChange(uniId: string) {
    this.selectedUniId.set(uniId);
    try {
      localStorage.setItem('mam_selected_university', uniId);
    } catch {}
  }

  private getPreparedChapters() {
    return this.editorService.chapters()
      .filter(chapter => typeof chapter.content === 'string' && chapter.content.trim().length > 0)
      .map(chapter => ({
        title: chapter.title,
        content: chapter.content
      }));
  }

  async exportToWord(): Promise<void> {
    const chapters = this.getPreparedChapters();
    if (chapters.length === 0) {
      this.exportError.set('هیچ ناوەڕۆکێکی ئامادە بۆ Export نییە.');
      return;
    }

    this.isExporting.set(true);
    this.exportError.set(null);
    this.exportSuccess.set(null);

    try {
      // 1. Strict Word-Count Gate Check
      const wcValidation = this.wordCountController.validateForExport(chapters);
      if (!wcValidation.valid) {
        throw new Error('بلۆککردنی هەناردەی Word بەهۆی ژمارەی وشەکان: ' + wcValidation.errors.join(' | '));
      }

      // 2. Strict Verified-Source Gate Check
      const sourceValidation = this.sourceVerificationService.validateForExport(chapters);
      if (!sourceValidation.valid) {
        throw new Error('بلۆککردنی هەناردەی Word بەهۆی کێشەی سەرچاوەکان: ' + sourceValidation.errors.join(' | '));
      }

      const matchedManuscript = this.data.historyList().find(saved =>
        saved.chapters.length === chapters.length &&
        saved.chapters.every((savedChapter, index) =>
          savedChapter.title === chapters[index].title &&
          savedChapter.content === chapters[index].content
        )
      );
      const discipline = matchedManuscript?.discipline || 'زانستە گشتییەکان';
      const academicLevel = matchedManuscript?.academicLevel || 'ماستەر';

      // Build Verified Sources Audit Report
      const verifiedSourcesReport = this.sourceVerificationService.sources()
        .filter(s => s.status === 'VERIFIED' && s.userApproved)
        .map(s => ({
          title: s.title,
          author: s.authors.join('، ') || 'نووسەر',
          year: s.year,
          venue: s.venue,
          doi: s.doi,
          url: s.url,
          provider: s.provider,
          retrievalTime: s.retrievalTime,
          status: s.status
        }));

      // Build Word Count Audit Report
      const manuscriptAudit = this.wordCountController.manuscriptAudit();
      const wordCountAuditReport = {
        targetWords: manuscriptAudit.targetWords,
        currentWords: manuscriptAudit.currentWords,
        remainingWords: manuscriptAudit.remainingWords,
        percentage: manuscriptAudit.percentage,
        chapterAudits: manuscriptAudit.chapterAudits.map(ca => ({
          chapterTitle: ca.chapterTitle,
          targetWords: ca.targetWords,
          currentWords: ca.currentWords,
          bodyWords: ca.bodyWords,
          statusLabel: ca.statusLabel
        }))
      };

      const blob = await this.wordExportService.generateDocxBlob(
        this.title().trim() || 'توێژینەوەی_زانستی',
        discipline,
        academicLevel,
        chapters,
        {
          customUniversityId: this.selectedUniId(),
          sources: verifiedSourcesReport.map(s => ({
            title: s.title,
            author: s.author,
            year: s.year,
            doi: s.doi,
            publisher: s.venue
          })),
          verifiedSourcesReport,
          wordCountAuditReport
        }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(this.title().trim() || 'توێژینەوەی_زانستی').replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      this.exportSuccess.set('فایلی Word بە سەرکەوتوویی بە هەردوو ڕاپۆرتی سەرچاوە و ژمارەی وشەوە دابەزێندرا.');
    } catch (error: any) {
      console.error('Word export failed:', error);
      this.exportError.set(error?.message || 'پشکنینی Export یان دروستکردنی فایل سەرکەوتوو نەبوو.');
    } finally {
      this.isExporting.set(false);
    }
  }

  exportToPdf(): void {
    const chapters = this.getPreparedChapters();
    if (chapters.length === 0) {
      this.exportError.set('هیچ ناوەڕۆکێکی ئامادە بۆ هەناردەکردن نییە.');
      return;
    }

    this.exportError.set(null);
    this.exportSuccess.set(null);

    try {
      // 1. Strict Word-Count Gate Check
      const wcValidation = this.wordCountController.validateForExport(chapters);
      if (!wcValidation.valid) {
        throw new Error('بلۆککردنی هەناردەی PDF بەهۆی ژمارەی وشەکان: ' + wcValidation.errors.join(' | '));
      }

      // 2. Strict Verified-Source Gate Check
      const sourceValidation = this.sourceVerificationService.validateForExport(chapters);
      if (!sourceValidation.valid) {
        throw new Error('بلۆککردنی هەناردەی PDF بەهۆی کێشەی سەرچاوەکان: ' + sourceValidation.errors.join(' | '));
      }

      const verifiedSourcesReport = this.sourceVerificationService.sources()
        .filter(s => s.status === 'VERIFIED' && s.userApproved)
        .map(s => ({
          title: s.title,
          author: s.authors.join('، ') || 'نووسەر',
          year: s.year,
          venue: s.venue,
          doi: s.doi,
          url: s.url,
          provider: s.provider,
          retrievalTime: s.retrievalTime,
          status: s.status
        }));

      const manuscriptAudit = this.wordCountController.manuscriptAudit();
      const wordCountAuditReport = {
        targetWords: manuscriptAudit.targetWords,
        currentWords: manuscriptAudit.currentWords,
        remainingWords: manuscriptAudit.remainingWords,
        percentage: manuscriptAudit.percentage,
        chapterAudits: manuscriptAudit.chapterAudits.map(ca => ({
          chapterTitle: ca.chapterTitle,
          targetWords: ca.targetWords,
          currentWords: ca.currentWords,
          bodyWords: ca.bodyWords,
          statusLabel: ca.statusLabel
        }))
      };

      this.wordExportService.exportToPrintablePdf({
        title: this.title().trim() || 'توێژینەوەی_زانستی',
        discipline: 'زانستە ئەکادیمییەکان',
        academicLevel: 'ماستەر / دکتۆرا',
        chapters,
        customUniversityId: this.selectedUniId(),
        sources: verifiedSourcesReport.map(s => ({
          title: s.title,
          author: s.author,
          year: s.year,
          doi: s.doi,
          publisher: s.venue
        })),
        verifiedSourcesReport,
        wordCountAuditReport
      });
      this.exportSuccess.set('لاپەڕەی چاپ و بەرهەمهێنانی PDF بە ڕاپۆرتە پەسەندکراوەکانەوە کرایەوە.');
    } catch (error: any) {
      console.error('PDF export failed:', error);
      this.exportError.set(error?.message || 'کردنەوەی پەنجەرەی چاپ سەرکەوتوو نەبوو.');
    }
  }
}
