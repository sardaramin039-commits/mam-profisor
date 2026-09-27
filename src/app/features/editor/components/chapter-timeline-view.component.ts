import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../../core/app.notifications';

export interface RevisionSnapshot {
  id: string;
  chapterId: number;
  timestamp: string;
  dateLabel: string;
  title: string;
  editDescription: string;
  wordCount: number;
  wordCountDiff: string;
  author: string;
  content: string;
  isCurrent?: boolean;
}

@Component({
  selector: 'app-chapter-timeline-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-indigo-500/20">
            <mat-icon class="!text-xl !w-5 !h-5">history_edu</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>تایملایینی مێژووی گۆڕانکارییەکانی بەش (Chapter Evolution Timeline)</span>
              <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                وەشانەکان
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 font-serif">
              مێژووی وێنەکانی گەشەکردنی دەقی بەشی دیاریکراو و گەڕاندنەوەی وەشانی پێشوو
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="showCreateCheckpointDialog.set(true)"
          class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1 transition cursor-pointer shadow">
          <mat-icon class="!text-sm">bookmark_add</mat-icon>
          <span>تۆمارکردنی خاڵی گەڕانەوە (Checkpoint)</span>
        </button>
      </div>

      <!-- Create Checkpoint Overlay -->
      @if (showCreateCheckpointDialog()) {
        <div class="p-3.5 bg-slate-800 border border-indigo-500/60 rounded-xl space-y-2.5 animate-fadeIn">
          <div class="flex items-center justify-between border-b border-slate-700 pb-2">
            <h4 class="text-xs font-bold text-indigo-300 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-sm text-indigo-400">save</mat-icon>
              <span>پاشەکەوتکردنی دەقی ئێستای بەشەکە وەک خاڵی گەڕانەوە</span>
            </h4>
            <button type="button" (click)="showCreateCheckpointDialog.set(false)" class="text-slate-400 hover:text-slate-200">
              <mat-icon class="!text-sm">close</mat-icon>
            </button>
          </div>

          <div>
            <label class="block text-slate-400 text-[10.5px] mb-1 font-serif">ناسناو یان پێناسی ئەم وەشانە:</label>
            <input
              type="text"
              [(ngModel)]="newCheckpointNote"
              placeholder="نموونە: داڕشتنەوەی پێداچوونەوەی ئەدەبیات یان ڕاستکردنەوەی ژێدەرەکان..."
              class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-serif" />
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="showCreateCheckpointDialog.set(false)"
              class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-serif">
              پاشگەزبوونەوە
            </button>
            <button
              type="button"
              (click)="saveManualCheckpoint()"
              class="px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1">
              <mat-icon class="!text-xs">check</mat-icon>
              <span>تۆمارکردنی وەشان</span>
            </button>
          </div>
        </div>
      }

      <!-- Timeline List -->
      <div class="relative border-r-2 border-slate-800 pr-5 space-y-4 my-2">
        @for (snapshot of snapshots(); track snapshot.id) {
          <div class="relative group">
            <!-- Node Marker -->
            <div class="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-all"
                 [class]="snapshot.isCurrent ? 'bg-indigo-400 shadow-md shadow-indigo-500/50 scale-110' : 'bg-slate-700 group-hover:bg-indigo-400'">
            </div>

            <!-- Card -->
            <div class="p-3.5 bg-slate-950/80 border rounded-xl space-y-2 transition-all"
                 [class]="snapshot.isCurrent ? 'border-indigo-500/70 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'">
              
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold text-slate-100 font-serif">
                    {{ snapshot.title }}
                  </h4>
                  @if (snapshot.isCurrent) {
                    <span class="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[9.5px] font-bold font-mono">
                      وەشانی چالاکی ئێستا
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
                  <span>{{ snapshot.dateLabel }}</span>
                  <span class="text-slate-600">•</span>
                  <span class="text-emerald-400 font-bold">{{ snapshot.wordCountDiff }}</span>
                </div>
              </div>

              <p class="text-[11px] text-slate-300 font-serif">
                {{ snapshot.editDescription }}
              </p>

              <div class="flex items-center justify-between border-t border-slate-800/80 pt-2 flex-wrap gap-2 text-[10.5px]">
                <div class="flex items-center gap-2 text-slate-400 font-serif">
                  <mat-icon class="!text-xs text-indigo-400">person</mat-icon>
                  <span>دەستکاریکەر: <strong class="text-slate-300">{{ snapshot.author }}</strong></span>
                  <span class="text-slate-600">•</span>
                  <span class="font-mono text-slate-300">{{ snapshot.wordCount }} وشە</span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="selectedPreviewSnapshot.set(snapshot)"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-serif text-[11px] flex items-center gap-1 transition cursor-pointer">
                    <mat-icon class="!text-xs text-indigo-400">visibility</mat-icon>
                    <span>بینینی دەق</span>
                  </button>

                  @if (!snapshot.isCurrent) {
                    <button
                      type="button"
                      (click)="restoreSnapshot(snapshot)"
                      class="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 rounded-md font-serif text-[11px] flex items-center gap-1 transition cursor-pointer">
                      <mat-icon class="!text-xs">restore</mat-icon>
                      <span>گەڕاندنەوە بۆ ئەم وەشانە</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Preview Snapshot Modal -->
      @if (selectedPreviewSnapshot()) {
        <div class="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-fadeIn">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-sm text-indigo-400">article</mat-icon>
              <span>نیشاندانی دیمەنی دەقی وەشان: {{ selectedPreviewSnapshot()?.title }}</span>
            </h4>
            <button type="button" (click)="selectedPreviewSnapshot.set(null)" class="text-slate-400 hover:text-slate-200">
              <mat-icon class="!text-sm">close</mat-icon>
            </button>
          </div>

          <div class="max-h-60 overflow-y-auto p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-serif text-slate-300 leading-relaxed whitespace-pre-wrap">
            {{ selectedPreviewSnapshot()?.content }}
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="selectedPreviewSnapshot.set(null)"
              class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-serif">
              داخستن
            </button>
            <button
              type="button"
              (click)="restoreSnapshot(selectedPreviewSnapshot()!)"
              class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1">
              <mat-icon class="!text-xs">restore</mat-icon>
              <span>جێگیرکردن و گەڕاندنەوەی ئەم وەشانە</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ChapterTimelineViewComponent {
  private toast = inject(AppNotificationsService);

  chapterId = input<number | null>(null);
  chapterContent = input<string>('');
  restoreRequested = output<string>();

  showCreateCheckpointDialog = signal<boolean>(false);
  newCheckpointNote = '';
  selectedPreviewSnapshot = signal<RevisionSnapshot | null>(null);

  snapshots = signal<RevisionSnapshot[]>([
    {
      id: 'snap-4',
      chapterId: 1,
      timestamp: '2026-08-26 14:15',
      dateLabel: 'ئەمڕۆ ١٤:١٥',
      title: 'وەشانی فەرمیی هەنووکەیی (Current Revision)',
      editDescription: 'پێداچوونەوەی ڕێزمانی، گونجاندنی هاوواتا ئەکادیمییەکان و تۆمارکردنی بیبلیۆگرافیا.',
      wordCount: 890,
      wordCountDiff: '+140 وشە',
      author: 'توێژەر',
      content: 'دەقی هەنووکەیی بەشەکە لەگەڵ بەکارھێنانی زاراوەی ئەکادیمی، چەمکە سۆرانییەکان و ئاماژەدانە بەستراوەکان بە بیبلیۆگرافیاوە.',
      isCurrent: true
    },
    {
      id: 'snap-3',
      chapterId: 1,
      timestamp: '2026-08-26 11:30',
      dateLabel: 'ئەمڕۆ ١١:٣٠',
      title: 'زیادکردنی بەشی میتۆدۆلۆژی و شیکاری',
      editDescription: 'فراوانکردنی هاوکێشەکان، نەخشەی چەمکسازی و ئاماژەدانە نێودەوڵەتییەکان.',
      wordCount: 750,
      wordCountDiff: '+210 وشە',
      author: 'توێژەر',
      content: 'لە کۆمەڵەی سێیەمدا بەراوردی شێوازە جیاوازەکانی کۆکردنەوەی داتا ئەنجامدرا و هاوکێشەی زانستی جێگیرکرا.',
      isCurrent: false
    },
    {
      id: 'snap-2',
      chapterId: 1,
      timestamp: '2026-08-25 18:40',
      dateLabel: 'دوێنێ ١٨:٤٠',
      title: 'ڕاستکردنەوەی پێداچوونەوەی ئەدەبیات',
      editDescription: 'تێکردنی سەرچاوەی کوردی و ئەرشیفی زانستی لەگەڵ بەکارھێنانی فەرهەنگی زاراوەکان.',
      wordCount: 540,
      wordCountDiff: '+180 وشە',
      author: 'سیستەمی ئەکادیمی',
      content: 'توێژینەوە سەرەتاییەکان دەریانخستووە کە پێویستی بە دۆزینەوەی کەلەپووری فیکری لە ناوچەکەدا هەیە.',
      isCurrent: false
    },
    {
      id: 'snap-1',
      chapterId: 1,
      timestamp: '2026-08-24 10:00',
      dateLabel: 'پێش دوو ڕۆژ',
      title: 'داڕشتنی هەیکەلی سەرەتایی',
      editDescription: 'دابەشکردنی ناو و ناونیشانە لاوەکییەکانی بەشی پێداچوونەوەی ئەدەبیات.',
      wordCount: 360,
      wordCountDiff: '+360 وشە',
      author: 'توێژەر',
      content: 'دەستپێکی دەقی سەرەتایی بەشەکە بەبێ ڕاستکردنەوەی ڕێزمانی.',
      isCurrent: false
    }
  ]);

  saveManualCheckpoint(): void {
    const note = this.newCheckpointNote.trim() || 'خاڵی گەڕانەوەی دەستی';
    const currentText = this.chapterContent() || 'دەقی تۆمارکراوی بەشەکە';

    const newSnap: RevisionSnapshot = {
      id: `snap-${Date.now()}`,
      chapterId: this.chapterId() || 1,
      timestamp: new Date().toLocaleTimeString('kn-IN'),
      dateLabel: 'ئەمڕۆ دەستی',
      title: note,
      editDescription: 'پاشەکەوتکردنی دەستیی توێژەر لەم خاڵەدا.',
      wordCount: currentText.split(/\s+/).filter(Boolean).length,
      wordCountDiff: '+0 وشە',
      author: 'توێژەر',
      content: currentText,
      isCurrent: true
    };

    // Mark previous current as false
    const updated = this.snapshots().map(s => ({ ...s, isCurrent: false }));
    this.snapshots.set([newSnap, ...updated]);

    this.toast.showSuccess('تۆمارکرا', 'خاڵی گەڕانەوەی بەشەکە بە سەرکەوتوویی دروستکرا.');
    this.showCreateCheckpointDialog.set(false);
    this.newCheckpointNote = '';
  }

  restoreSnapshot(snapshot: RevisionSnapshot): void {
    const updated = this.snapshots().map(s => ({
      ...s,
      isCurrent: s.id === snapshot.id
    }));
    this.snapshots.set(updated);
    this.restoreRequested.emit(snapshot.content);
    this.selectedPreviewSnapshot.set(null);

    this.toast.showSuccess(
      'وەشان گەڕێنرایەوە',
      `دەقی بەشەکە گەڕێنرایەوە بۆ وەشانی: ${snapshot.title}`
    );
  }
}
