import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import {
  AcademicTerm,
  TerminologyDocumentAudit,
  auditDocumentTerminology,
  standardizeTermAcrossChapters
} from '../../helpers/terminology-consistency-checker';

@Component({
  selector: 'app-terminology-consistency-auditor',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <mat-icon class="text-amber-400 !text-sm !w-4 !h-4">spellcheck</mat-icon>
          <h4 class="text-xs font-bold text-slate-200">
            پشکنەری یەکگرتوویی زاراوەکان لە تەواوی بەشەکاندا (Consistency Auditor)
          </h4>
        </div>

        <button
          type="button"
          (click)="runAudit()"
          class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs">
          <mat-icon class="!text-xs !w-3.5 !h-3.5">refresh</mat-icon>
          <span>پشکنینی نوێ</span>
        </button>
      </div>

      <!-- Audit Score & Summary KPIs -->
      @if (auditResult(); as res) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">نمرەی یەکگرتوویی</span>
            <span class="text-base font-bold font-mono"
                  [class.text-emerald-400]="res.overallScore >= 80"
                  [class.text-amber-400]="res.overallScore >= 50 && res.overallScore < 80"
                  [class.text-rose-400]="res.overallScore < 50">
              {{ res.overallScore }}٪
            </span>
          </div>

          <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">زاراوەی یەکگرتوو</span>
            <span class="text-base font-bold font-mono text-emerald-400">{{ res.optimalTermsCount }}</span>
          </div>

          <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">ناڕێکی و هەڵە</span>
            <span class="text-base font-bold font-mono text-rose-400">{{ res.inconsistentCount }}</span>
          </div>

          <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">بەکارنەهاتوو</span>
            <span class="text-base font-bold font-mono text-slate-400">{{ res.unusedCount }}</span>
          </div>
        </div>

        <!-- Issue List & Uniform Fix Action -->
        @if (hasInconsistencies()) {
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-amber-300">
                ئاڵەنگارییە دۆزراوەکانی بەکارهێنانی زاراوە:
              </span>

              <button
                type="button"
                (click)="standardizeAll()"
                class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs">
                <mat-icon class="!text-xs !w-3 !h-3">auto_fix_high</mat-icon>
                <span>یەکخستنی تەواوی زاراوەکان بە یەک کورتە</span>
              </button>
            </div>

            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              @for (detail of inconsistentDetails(); track detail.term.id) {
                <div class="bg-slate-900/90 border border-amber-900/40 p-2.5 rounded-lg space-y-1.5 text-xs">
                  <div class="flex items-center justify-between flex-wrap gap-1">
                    <span class="font-bold text-amber-200">
                      «{{ detail.term.kurdishTerm }}»
                      @if (detail.term.foreignTerm) {
                        <span class="text-[10px] text-slate-400 font-mono">({{ detail.term.foreignTerm }})</span>
                      }
                    </span>

                    <button
                      type="button"
                      (click)="standardizeSingle(detail.term)"
                      class="px-2 py-0.5 bg-slate-800 hover:bg-amber-900/40 text-amber-300 rounded text-[10px] transition cursor-pointer">
                      چاکسازیی ئەم زاراوەیە
                    </button>
                  </div>

                  @for (issue of detail.issues; track $index) {
                    <div class="text-[11px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/80 font-serif">
                      <span class="text-rose-400 font-bold">[{{ issue.chapterTitle }}]: </span>
                      <span>{{ issue.suggestion }}</span>
                      <div class="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                        {{ issue.snippet }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="p-3 bg-emerald-950/40 rounded-lg border border-emerald-900/40 text-xs text-emerald-300 text-center flex items-center justify-center gap-2">
            <mat-icon class="!text-sm !w-4 !h-4">check_circle</mat-icon>
            <span>پیرۆزە! هەموو زاراوە پێناسەکراوەکان بە شێوەیەکی یەکگرتوو و بێ ناڕێکی بەکارهاتوون.</span>
          </div>
        }
      }
    </div>
  `
})
export class TerminologyConsistencyAuditorComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  terms = input<AcademicTerm[]>([]);

  auditResult = signal<TerminologyDocumentAudit | null>(null);

  hasInconsistencies = computed(() => {
    const res = this.auditResult();
    return res ? res.inconsistentCount > 0 : false;
  });

  inconsistentDetails = computed(() => {
    const res = this.auditResult();
    if (!res) return [];
    return res.details.filter(d => d.status === 'inconsistent');
  });

  runAudit(): void {
    const termsList = this.terms();
    const chapters = this.editorService.chapters();
    const result = auditDocumentTerminology(termsList, chapters);
    this.auditResult.set(result);
    this.toastService.showSuccess('پشکنین تەواو بوو', `پشکنینی یەکگرتوویی زاراوەکان ئەنجامدرا (نمرە: ${result.overallScore}٪).`);
  }

  standardizeSingle(term: AcademicTerm): void {
    const chapters = this.editorService.chapters();
    const { updatedChapters, replacementsCount } = standardizeTermAcrossChapters(term, chapters);
    this.editorService.setChapters(updatedChapters);
    this.runAudit();
    this.toastService.showSuccess('یەکخرا', `زاراوەی «${term.kurdishTerm}» بە سەرکەوتوویی یەکخرایەوە (${replacementsCount} گۆڕانکاری).`);
  }

  standardizeAll(): void {
    let currentChapters = this.editorService.chapters();
    let totalReplacements = 0;

    for (const detail of this.inconsistentDetails()) {
      const { updatedChapters, replacementsCount } = standardizeTermAcrossChapters(detail.term, currentChapters);
      currentChapters = updatedChapters;
      totalReplacements += replacementsCount;
    }

    this.editorService.setChapters(currentChapters);
    this.runAudit();
    this.toastService.showSuccess('هەموو زاراوەکان یەکخران', `سەرجەم زاراوە ناڕێکەکان بە پێوەری کوردی یەکخران (${totalReplacements} جێگۆڕکێ).`);
  }
}
