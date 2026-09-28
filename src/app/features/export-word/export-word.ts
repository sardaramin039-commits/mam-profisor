import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WordExportService } from '../../services/word-export';
import { EditorService } from '../editor/services/editor';

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
      <button
        (click)="exportToWord()"
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
      >
        <mat-icon class="!w-4 !h-4 text-base">download</mat-icon>
        <span>دابەزاندنی فایلی Word (.docx)</span>
      </button>
    </div>
  `
})
export class ExportWordComponent {
  private wordExportService = inject(WordExportService);
  private editorService = inject(EditorService);
  title = signal<string>('توێژینەوەی_زانستی');

  async exportToWord(): Promise<void> {
    const chapters = this.editorService.chapters()
      .filter(chapter => typeof chapter.content === 'string' && chapter.content.trim().length > 0)
      .map(chapter => ({
        title: chapter.title,
        content: chapter.content
      }));

    if (chapters.length === 0) {
      return;
    }

    const blob = await this.wordExportService.generateDocxBlob(
      this.title().trim() || 'توێژینەوەی_زانستی',
      'زانستە گشتییەکان',
      'ماستەر',
      chapters
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.title().replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
