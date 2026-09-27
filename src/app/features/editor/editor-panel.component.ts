import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel } from '../../domain/models';

@Component({
  selector: 'app-editor-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/10">
            <mat-icon class="text-xl">edit_note</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">سەرنووسەری بەشەکانی توێژینەوە</h3>
            <p class="text-xs text-slate-400">داڕشتن و بەڕێوەبردنی دەقی بەشەکان</p>
          </div>
        </div>
      </div>

      <!-- Chapter List Header -->
      <div class="p-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-300">لیستی بەشەکان ({{ chapters().length }})</span>
      </div>

      <!-- Chapters List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        @for (chapter of chapters(); track chapter.id) {
          <div 
            tabindex="0"
            role="button"
            (click)="selectChapterRequested.emit(chapter.id)"
            (keyup.enter)="selectChapterRequested.emit(chapter.id)"
            [class]="selectedChapterId() === chapter.id 
              ? 'p-3.5 bg-emerald-950/40 border border-emerald-500/60 rounded-xl cursor-pointer transition-all'
              : 'p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl cursor-pointer hover:border-slate-600 transition-all'">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-200">{{ chapter.title }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ chapter.wordCount }} وشە</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class EditorFeatureComponent {
  chapters = input<ChapterItemModel[]>([]);
  selectedChapterId = input<number | null>(null);
  selectChapterRequested = output<number>();
}
