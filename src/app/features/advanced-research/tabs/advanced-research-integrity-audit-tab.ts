import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ResearchApiClientService } from '../services/research-api-client.service';
import { ResearchIntegrityAuditResult } from '../models/multi-agent.types';

@Component({
  selector: 'app-advanced-research-integrity-audit-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-rose-500/20">
            <mat-icon class="text-2xl">fact_check</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              پشکنەری تۆکمەیی و متمانەی ئەکادیمی (Research Integrity Audit)
            </h3>
            <p class="text-xs text-slate-400">
              دۆزینەوەی دەستکاریکردن، داواکاریی بێ بەڵگە، کێشەی ئەخلاقی و هاوشێوەیی
            </p>
          </div>
        </div>
        <span class="text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-mono font-bold">
          Ethics & Rigor Guard
        </span>
      </div>

      <!-- Input Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">ناونیشانی توێژینەوە</label>
          <input
            type="text"
            [(ngModel)]="title"
            placeholder="ناونیشانی توێژینەوە بنووسە..."
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">ڕشتەی زانستی</label>
          <input
            type="text"
            [(ngModel)]="discipline"
            placeholder="پزیشکی، کۆمپیوتەر، کۆمەڵناسی..."
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">پوختەی میتۆدۆلۆجی و نموونە (Methodology & Sample)</label>
        <textarea
          [(ngModel)]="methodology"
          rows="3"
          placeholder="شێوازی کۆکردنەوەی داتا، کۆمەڵگەی ئاماری و نموونە..."
          class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
        ></textarea>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">دەقی بەشێک لە توێژینەوە بۆ پشکنین (Draft Text to Audit)</label>
        <textarea
          [(ngModel)]="draftText"
          rows="4"
          placeholder="دەقی پەرەگراف یان بەشێک لە توێژینەوەکەت لێرە دابنێ..."
          class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
        ></textarea>
      </div>

      <!-- Action Button -->
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          (click)="runAudit()"
          [disabled]="loading() || (!title.trim() && !draftText.trim())"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          <mat-icon class="text-sm">verified</mat-icon>
          <span>{{ loading() ? 'پشکنین لە جێبەجێکردندایە...' : 'دەستپێکردنی پشکنینی Integrity' }}</span>
        </button>
      </div>

      <!-- Error Message -->
      @if (error()) {
        <div class="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <mat-icon class="text-sm text-rose-400">error</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Result Card -->
      @if (result(); as res) {
        <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <mat-icon class="text-emerald-400">task_alt</mat-icon>
              ئەنجامی پشکنینی متمانەی ئەکادیمی
            </h4>
            @if (res.overallScore !== undefined || res.score !== undefined) {
              <span class="text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                نمرەی متمانە: {{ res.overallScore ?? res.score }}/100
              </span>
            }
          </div>

          @if (res.summary || res.critique) {
            <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {{ res.summary || res.critique }}
            </p>
          }

          @if (res.violations && res.violations.length > 0) {
            <div class="space-y-2">
              <span class="text-xs font-bold text-rose-400 flex items-center gap-1">
                <mat-icon class="text-sm">warning</mat-icon> کێشە و سەرپێچییە تۆمارکراوەکان:
              </span>
              <ul class="list-disc list-inside space-y-1 text-xs text-slate-300 pr-2">
                @for (v of res.violations; track $index) {
                  <li>{{ v }}</li>
                }
              </ul>
            </div>
          }

          @if (res.recommendations && res.recommendations.length > 0) {
            <div class="space-y-2">
              <span class="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <mat-icon class="text-sm">tips_and_updates</mat-icon> ڕاسپاردەکان بۆ چاکسازی:
              </span>
              <ul class="list-disc list-inside space-y-1 text-xs text-slate-300 pr-2">
                @for (rec of res.recommendations; track $index) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AdvancedResearchIntegrityAuditTabComponent {
  private readonly api = inject(ResearchApiClientService);

  title = '';
  discipline = '';
  methodology = '';
  draftText = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<ResearchIntegrityAuditResult | null>(null);

  runAudit(): void {
    if (!this.title.trim() && !this.draftText.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.api.auditResearchIntegrity({
      title: this.title,
      discipline: this.discipline,
      methodology: this.methodology,
      draftText: this.draftText
    }).subscribe({
      next: (res: ResearchIntegrityAuditResult) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || err?.message || 'نەتوانرا پشکنینی متمانەی ئەکادیمی ئەنجام بدرێت.');
        this.loading.set(false);
      }
    });
  }
}
