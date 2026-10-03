import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WordExportService } from '../../services/word-export';
import { EditorService } from '../editor/services/editor';
import { Data } from '../../services/data';
import { ExportContractService, ExportGateResponse } from '../../services/export-contract.service';

@Component({
  selector: 'app-export-word',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center gap-2">
        <mat-icon class="text-blue-400">description</mat-icon>
        <h3 class="text-lg font-bold text-slate-100">ئێکسپۆرتکردنی ۆرد (Export Word)</h3>
      </div>
      <input
        type="text"
        [ngModel]="title()"
        (ngModelChange)="title.set($event)"
        placeholder="ناونیشانی فایلی Word..."
        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
      />
      @if (exportError()) {
        <div class="rounded-lg border border-rose-300 bg-rose-50 text-rose-800 px-3 py-2 text-xs leading-relaxed">
          {{ exportError() }}
        </div>
      }
      <button
        (click)="exportToWord()"
        [disabled]="isExporting()"
        class="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
      >
        <mat-icon class="!w-4 !h-4 text-base">download</mat-icon>
        <span>{{ isExporting() ? 'پشکنین و ئامادەکردن...' : 'دابەزاندنی فایلی Word (.docx)' }}</span>
      </button>
    </div>
  `
})
export class ExportWordComponent {
  private wordExportService = inject(WordExportService);
  private editorService = inject(EditorService);
  private data = inject(Data);
  private http = inject(HttpClient);
  private exportContractService = inject(ExportContractService);
  title = signal<string>('توێژینەوەی_زانستی');
  isExporting = signal<boolean>(false);
  exportError = signal<string | null>(null);

  async exportToWord(): Promise<void> {
    const chapters = this.editorService.chapters()
      .filter(chapter => typeof chapter.content === 'string' && chapter.content.trim().length > 0)
      .map(chapter => ({
        title: chapter.title,
        content: chapter.content
      }));

    if (chapters.length === 0) {
      this.exportError.set('هیچ ناوەڕۆکێکی ئامادە بۆ Export نییە.');
      return;
    }

    this.isExporting.set(true);
    this.exportError.set(null);

    try {
      const documentText = chapters
        .map(chapter => `### ${chapter.title}\n${chapter.content}`)
        .join('\n\n');

      const qa = await firstValueFrom(
        this.http.post<ExportGateResponse>('/api/platform/qa-gate', {
          documentText,
          sources: this.data.sourcesList().map(source => ({
            id: source.id,
            title: source.title,
            author: source.author,
            year: source.year,
            doi: source.doi,
            isbn: source.isbn,
            publisher: source.publisher,
            claimText: source.claimText,
            evidenceText: source.evidenceText,
            pageNumber: source.pageNumber
          }))
        })
      );

      this.exportContractService.assertApproved(qa);

      const matchedManuscript = this.data.historyList().find(saved =>
        saved.chapters.length === chapters.length &&
        saved.chapters.every((savedChapter, index) =>
          savedChapter.title === chapters[index].title &&
          savedChapter.content === chapters[index].content
        )
      );
      const discipline = matchedManuscript?.discipline || 'دیارینەکراو';
      const academicLevel = matchedManuscript?.academicLevel || 'دیارینەکراو';

      const blob = await this.wordExportService.generateDocxBlob(
        this.title().trim() || 'توێژینەوەی_زانستی',
        discipline,
        academicLevel,
        chapters
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(this.title().trim() || 'توێژینەوەی_زانستی').replace(/\\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Secure Word export failed:', error);
      this.exportError.set('پشکنینی Export یان دروستکردنی فایل سەرکەوتوو نەبوو.');
    } finally {
      this.isExporting.set(false);
    }
  }
}
