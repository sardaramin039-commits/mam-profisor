import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../../editor/services/editor';
import { CitationManagerService } from '../services/citation-manager';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { AutomatedBibliographyService, BibliographyScanResult } from '../../../services/automated-bibliography.service';
import { AcademicStyle } from '../../../domain/enums';
import { AppNotificationsService } from '../../../core/app.notifications';

@Component({
  selector: 'app-automated-bibliography-generator',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-right font-sans">
      <!-- Header Banner -->
      <div class="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <mat-icon class="text-2xl">auto_stories</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>دروستکەری خۆکاری پێڕستی سەرچاوەکان (Auto-Bibliography)</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">
                APA / Harvard / MLA / Kurdish
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              پشکنینی ناوەرۆکی هەموو بەشەکان بۆ ژێدەرەکان و داڕشتنی لیستی کۆتایی نامەی ئەکادیمی
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="runScanAndGenerate()"
            [disabled]="isScanning()"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer">
            <mat-icon class="text-base animate-spin" *ngIf="isScanning()">sync</mat-icon>
            <mat-icon class="text-base" *ngIf="!isScanning()">document_scanner</mat-icon>
            <span>{{ isScanning() ? 'خەریکی پشکنینی بەشەکانە...' : 'پشکنینی بەشەکان و کۆکردنەوەی سەرچاوەکان' }}</span>
          </button>
        </div>
      </div>

      <!-- Controls & Style Selection -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">شێوازی فۆرماتکردنی زانستی (Citation Style):</label>
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (st of styleOptions; track st.id) {
              <button
                type="button"
                (click)="selectStyle(st.id)"
                [class]="selectedStyle() === st.id
                  ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'"
                class="px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer">
                {{ st.label }}
              </button>
            }
          </div>
        </div>

        <div class="flex flex-col justify-center text-xs text-slate-300 space-y-1">
          <span class="text-[11px] text-slate-400">دۆخی بەشەکان:</span>
          <div class="flex items-center gap-2 font-mono text-[11px] text-purple-300">
            <mat-icon class="text-sm">folder_open</mat-icon>
            <span>{{ chaptersCount() }} بەش لە ناو تێزەکەدا بوونی هەیە</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          @if (scanResult()) {
            <button
              type="button"
              (click)="insertBibliographyToThesis()"
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
              <mat-icon class="text-sm">post_add</mat-icon>
              <span>دانان لە کۆتایی تێزەکە (بەشی سەرچاوەکان)</span>
            </button>
          }
        </div>
      </div>

      <!-- Scan Summary Stats -->
      @if (scanResult(); as result) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <span class="block text-[10px] text-slate-400">کۆی ژێدەرە دۆزراوەکان</span>
            <span class="text-lg font-extrabold text-indigo-400 font-mono">{{ result.totalInlineCitationsFound }}</span>
          </div>
          <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <span class="block text-[10px] text-slate-400">سەرچاوەی جیاواز و بێ دووبارە</span>
            <span class="text-lg font-extrabold text-emerald-400 font-mono">{{ result.uniqueSourcesCount }}</span>
          </div>
          <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <span class="block text-[10px] text-slate-400">سەرچاوەی ناونووسکراوی دەق</span>
            <span class="text-lg font-extrabold text-purple-400 font-mono">{{ result.auditReport.matchedCount }}</span>
          </div>
          <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <span class="block text-[10px] text-slate-400">ژێدەری خۆکار دەرهێنراو</span>
            <span class="text-lg font-extrabold text-amber-400 font-mono">{{ result.unresolvedCitations.length }}</span>
          </div>
        </div>

        <!-- Discovered Sources List -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <mat-icon class="text-sm text-purple-400">format_list_bulleted</mat-icon>
              <span>پێڕستی سەرچاوە فۆرماتکراوەکان ({{ result.items.length }})</span>
            </h4>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="copyBibliographyText()"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                <mat-icon class="text-xs">content_copy</mat-icon>
                <span>کۆپیکردنی دەقەکە</span>
              </button>
            </div>
          </div>

          <div class="max-h-72 overflow-y-auto space-y-2.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            @for (item of result.items; track item.id; let idx = $index) {
              <div class="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all space-y-1.5">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 text-[10px] font-mono flex items-center justify-center font-bold">
                      {{ idx + 1 }}
                    </span>
                    <span class="text-xs font-semibold text-slate-100 font-serif">{{ item.author }} ({{ item.year }})</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                      [class]="item.isAutoInferred ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'">
                      {{ item.isAutoInferred ? '🟡 PARTIALLY VERIFIED' : '🟢 VERIFIED' }}
                    </span>
                  </div>
                </div>
                <p class="text-xs text-slate-300 font-serif leading-relaxed pr-7">
                  {{ item.formattedText }}
                </p>
                @if (item.inTextSnippet) {
                  <div class="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 pr-7 font-mono">
                    <span class="text-purple-400 font-bold">نموونە لە دەقدا:</span> "{{ item.inTextSnippet }}"
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-2">
          <mat-icon class="text-3xl text-purple-400">manage_search</mat-icon>
          <p class="text-xs font-semibold text-slate-200">هێشتا پشکنین ئەنجام نەدراوە</p>
          <p class="text-[11px] text-slate-400 max-w-md mx-auto">
            کلیک لەسەر دوگمەی "پشکنینی بەشەکان و کۆکردنەوەی سەرچاوەکان" بکە تا سیستەم بە شێوەیەکی زیرەک هەموو ژێدەرە ناوخۆییەکانی (In-text citations) وەک (ناوی نووسەر، ساڵ) بدۆزێتەوە و لیستێکی ڕێکوپێکی زانستیت بۆ دروست بکات.
          </p>
        </div>
      }
    </div>
  `
})
export class AutomatedBibliographyGeneratorComponent {
  private editorService = inject(EditorService);
  private citationService = inject(CitationManagerService);
  private storeService = inject(AcademicStoreService);
  private autoBibService = inject(AutomatedBibliographyService);
  private notifications = inject(AppNotificationsService);

  isScanning = signal<boolean>(false);
  selectedStyle = signal<AcademicStyle | string>(AcademicStyle.APA);
  scanResult = signal<BibliographyScanResult | null>(null);

  styleOptions = [
    { id: AcademicStyle.APA, label: 'APA 7th Edition' },
    { id: AcademicStyle.Harvard, label: 'Harvard Style' },
    { id: AcademicStyle.MLA, label: 'MLA 9th Edition' },
    { id: 'Kurdish', label: 'شێوازی ئەکادیمیی کوردی' },
    { id: AcademicStyle.Chicago, label: 'Chicago' },
    { id: AcademicStyle.IEEE, label: 'IEEE Style' }
  ];

  chaptersCount = computed(() => this.editorService.chapters().length);

  selectStyle(style: AcademicStyle | string): void {
    this.selectedStyle.set(style);
    if (this.scanResult()) {
      this.runScanAndGenerate();
    }
  }

  runScanAndGenerate(): void {
    this.isScanning.set(true);
    const chapters = this.editorService.chapters();
    const knownSources = this.storeService.sources();

    setTimeout(() => {
      const result = this.autoBibService.generateBibliography(
        chapters,
        knownSources,
        this.selectedStyle()
      );
      this.scanResult.set(result);
      this.isScanning.set(false);
      this.notifications.showSuccess(
        'دروستکردنی پێڕستی سەرچاوەکان',
        `پێڕستی سەرچاوەکان بە سەرکەوتوویی دروستکرا: ${result.uniqueSourcesCount} سەرچاوە تۆمارکرا.`
      );
    }, 350);
  }

  insertBibliographyToThesis(): void {
    const res = this.scanResult();
    if (!res) return;

    const chapters = this.editorService.chapters();
    const outcome = this.autoBibService.appendBibliographyToDocument(
      res.formattedBibliographyText,
      chapters,
      (updated) => {
        this.editorService.setChapters(updated);
      }
    );

    if (outcome.success) {
      this.notifications.showSuccess(
        'زیادکردن بۆ نامەی توێژینەوە',
        `پێڕستی سەرچاوەکان زیادکرا بۆ "${outcome.chapterTitle}" لە کۆتایی نامەکەدا.`
      );
    }
  }

  copyBibliographyText(): void {
    const res = this.scanResult();
    if (!res) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(res.formattedBibliographyText);
      this.notifications.showSuccess(
        'کۆپیکردنی دەق',
        'دەقی پێڕستی سەرچاوەکان کۆپی کرا بۆ کلیپبۆرد.'
      );
    }
  }
}
