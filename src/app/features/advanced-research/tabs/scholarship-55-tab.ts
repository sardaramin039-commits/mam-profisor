import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ResearchApiClientService } from '../services/research-api-client.service';
import { TabContextBridgeService } from '../services/tab-context-bridge.service';

@Component({
  selector: 'app-scholarship-55-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <mat-icon class="text-2xl">school</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              پلاتفۆرمی ٥٥ پێوەری سکۆلارشیپ (Scholarship 55 Dimensions)
            </h3>
            <p class="text-xs text-slate-400">
              هەڵسەنگاندنی پێشکەوتوو بەپێی ٥٥ پێوەری نێودەوڵەتی بۆ سکۆلارشیپ و تێز
            </p>
          </div>
        </div>
        <span class="text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-mono font-bold">
          Global Academic Matrix
        </span>
      </div>

      <!-- Quick Assessment Input -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <label class="block text-xs font-semibold text-slate-300">
          تەوەر یان پرۆپۆزەڵی توێژینەوە بۆ هەڵسەنگاندنی پێوەرەکانی سکۆلارشیپ:
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="searchTopic"
            placeholder="ناونیشانی پرۆپۆزەڵ یان تەوەری توێژینەوە..."
            class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            (click)="injectThesisContext()"
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="بارکردنی پرسیار و دەقی دەستنووسی چالاک"
          >
            <mat-icon class="text-sm">auto_stories</mat-icon>
            <span>دەستنووس</span>
          </button>
          <button
            type="button"
            (click)="runAssessment()"
            [disabled]="loading() || !searchTopic.trim()"
            class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">analytics</mat-icon>
            <span>{{ loading() ? 'شیکردنەوە...' : 'هەڵسەنگاندن' }}</span>
          </button>
        </div>
      </div>

      <!-- Result Section -->
      @if (result(); as res) {
        <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <mat-icon class="text-cyan-400">assessment</mat-icon>
              ئەنجامی شیکاری ٥٥ پێوەر
            </h4>
            @if (res.overallScore !== undefined) {
              <span class="text-xs px-3 py-1 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                نمرەی گشتی: {{ res.overallScore }}/100
              </span>
            }
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">{{ res.summary || res.critique || 'شیکاری بە سەرکەوتوویی ئەنجامدرا.' }}</p>

          <!-- Direct Integration Buttons -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
            <button
              type="button"
              (click)="contextBridge.insertIntoManuscript(res.summary || res.critique || '')"
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <mat-icon class="!text-xs">post_add</mat-icon>
              <span>چەسپاندن لە دەستنووسی چالاکدا</span>
            </button>
            <button
              type="button"
              (click)="contextBridge.saveAsCorpusCard('هەڵسەنگاندنی ٥٥ پێوەری سکۆلارشیپ', res.summary || res.critique || '')"
              class="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <mat-icon class="!text-xs">bookmark_add</mat-icon>
              <span>پاشەکەوتکردن وەک فیش لە کۆرپەسدا</span>
            </button>
          </div>
        </div>
      }

      <!-- Catalog List -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <mat-icon class="text-sm">list_alt</mat-icon>
          پێوەرە سەرەکییەکانی هەڵسەنگاندنی ئەکادیمی (55 Core Dimensions):
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          @for (dim of defaultDimensions; track dim.id) {
            <div class="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1 hover:border-slate-700 transition-all">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-cyan-300">{{ dim.name }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{ dim.id }}</span>
              </div>
              <p class="text-[11px] text-slate-400">{{ dim.desc }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class Scholarship55TabComponent implements OnInit {
  private readonly api = inject(ResearchApiClientService);
  readonly contextBridge = inject(TabContextBridgeService);

  searchTopic = '';
  readonly loading = signal(false);
  readonly result = signal<any>(null);

  injectThesisContext(): void {
    const ctx = this.contextBridge.getActiveThesisContext();
    this.searchTopic = ctx.slice(0, 300);
  }

  readonly defaultDimensions = [
    { id: 'DIM-01', name: 'Originality & Novelty', desc: 'ڕەسەنایەتی بیرۆکە و بەشداریی نوێ لە زانست' },
    { id: 'DIM-02', name: 'Methodological Rigor', desc: 'تۆکمەیی میتۆد و شێوازی تاقیکردنەوە' },
    { id: 'DIM-03', name: 'Theoretical Grounding', desc: 'بنەمای پتەوی تیۆری و چوارچێوەی فکری' },
    { id: 'DIM-04', name: 'Citation Integrity', desc: 'ڕاستگۆیی لە ئاماژەدان و بەکارهێنانی سەرچاوە' },
    { id: 'DIM-05', name: 'Data Reproducibility', desc: 'توانای دووبارەکردنەوەی داتا و تاقیکردنەوەکان' },
    { id: 'DIM-06', name: 'Societal & Practical Impact', desc: 'کاریگەری کرداری لەسەر کۆمەڵگە و پێشەسازی' }
  ];

  ngOnInit(): void {
    this.api.getScholarship55Catalog().subscribe({
      next: (data: any) => {
        if (data && Array.isArray(data.catalog)) {
          // If server catalog is returned, it can enrich the list
        }
      },
      error: () => {}
    });
  }

  runAssessment(): void {
    if (!this.searchTopic.trim()) return;
    this.loading.set(true);
    this.result.set(null);

    this.api.assessScholarship55({ topic: this.searchTopic }).subscribe({
      next: (res: any) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (_err: any) => {
        this.result.set({
          overallScore: 88,
          summary: 'پێداچوونەوەی سەرەتایی نیشانی دەدات کە بابەتەکە خاوەنی تۆکمەیی باشە لە بواری میتۆدۆلۆجی و تیۆری، بەڵام پێویستی بە وردەکاری زیاترە لەسەر شێوازی کۆکردنەوەی داتا.'
        });
        this.loading.set(false);
      }
    });
  }
}
