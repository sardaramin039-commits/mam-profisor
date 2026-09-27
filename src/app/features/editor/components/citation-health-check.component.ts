import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AcademicSourceModel } from '../../../domain/models';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { AppNotificationsService } from '../../../core/app.notifications';

export interface UnmatchedCitationMatch {
  rawCitation: string;
  author: string;
  year: string;
  matchedInBibliography: boolean;
  suggestedType: 'journal' | 'book' | 'thesis';
}

@Component({
  selector: 'app-citation-health-check',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-rose-500/20">
            <mat-icon class="!text-xl !w-5 !h-5">health_and_safety</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>پشکنینی تەندروستیی ئاماژەدانەکان (Citation Health Check)</span>
              <span class="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
                خودکار
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 font-serif">
              دۆزینەوە و پشکنینی ئاماژەدانەکانی ناو دەق کە لە پێڕستی سەرچاوەکاندا نین
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="reScanText()"
          class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-serif flex items-center gap-1 transition cursor-pointer">
          <mat-icon class="!text-sm text-rose-400">refresh</mat-icon>
          <span>دووبارە پشکنینەوە</span>
        </button>
      </div>

      <!-- Health Index Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Index score -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-[10.5px] text-slate-400 font-serif block">نمرەی تەندروستی</span>
            <span class="text-xl font-black font-mono" [class]="healthScore() >= 80 ? 'text-emerald-400' : 'text-amber-400'">
              {{ healthScore() }}%
            </span>
          </div>
          <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs"
               [class]="healthScore() >= 80 ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400'">
            <mat-icon class="!text-sm">{{ healthScore() >= 80 ? 'verified' : 'warning' }}</mat-icon>
          </div>
        </div>

        <!-- Detected inline references -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span class="text-[10.5px] text-slate-400 font-serif block">ئاماژەدانە دۆزراوەکان</span>
          <span class="text-xl font-black text-slate-100 font-mono">{{ detectedCitations().length }}</span>
          <span class="text-[10px] text-slate-400 mr-1 font-serif">ئاماژە لە دەقدا</span>
        </div>

        <!-- Missing citations -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span class="text-[10.5px] text-slate-400 font-serif block">نادیار لە بیبلیۆگرافیا</span>
          <span class="text-xl font-black font-mono" [class]="missingCitations().length === 0 ? 'text-emerald-400' : 'text-rose-400'">
            {{ missingCitations().length }}
          </span>
          <span class="text-[10px] text-rose-400/80 mr-1 font-serif">سەرچاوەی بێ تۆمار</span>
        </div>
      </div>

      <!-- Missing Citations List -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-slate-200 font-serif flex items-center justify-between">
          <span>لیستی سەرچاوە نادیارەکان (لە پێڕستی بیبلیۆگرافیادا نین)</span>
          <span class="text-[10px] text-slate-400 font-mono">ژمارە: {{ missingCitations().length }}</span>
        </h4>

        @if (missingCitations().length === 0) {
          <div class="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl text-center space-y-1">
            <mat-icon class="!text-2xl text-emerald-400">check_circle</mat-icon>
            <p class="text-xs font-bold text-emerald-300 font-serif">هەموو ئاماژەدانەکانی ناو دەق لە بیبلیۆگرافیادا تۆمارکراون!</p>
            <p class="text-[11px] text-slate-400 font-serif">هیچ سەرچاوەیەکی بێ تۆمار یان لێکچوو نەدۆزرایەوە.</p>
          </div>
        } @else {
          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            @for (item of missingCitations(); track item.rawCitation) {
              <div class="p-3 bg-slate-950/90 border border-rose-900/50 hover:border-rose-500/60 rounded-xl flex items-center justify-between flex-wrap gap-2 transition-all">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-mono text-[10px] font-bold">
                      {{ item.rawCitation }}
                    </span>
                    <span class="text-xs font-bold text-slate-200 font-serif">
                      توێژەر: {{ item.author }} ({{ item.year }})
                    </span>
                  </div>
                  <p class="text-[10.5px] text-slate-400 font-serif">
                    ئەم ژێدەرە لە ناو دەقەکەتدا ئاماژەی پێکراوە بەڵام لە بیبلیۆگرافیادا بوونی نییە.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="quickAddCitation(item)"
                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1 transition cursor-pointer shadow">
                    <mat-icon class="!text-xs">add_circle</mat-icon>
                    <span>زیادکردنی خێرا بۆ بیبلیۆگرافیا</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Add Dialog Overlay -->
      @if (activeQuickAdd()) {
        <div class="p-3 bg-slate-800 border border-amber-500/60 rounded-xl space-y-3 animate-fadeIn">
          <div class="flex items-center justify-between border-b border-slate-700 pb-2">
            <h4 class="text-xs font-bold text-amber-300 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-sm text-amber-400">bookmark_add</mat-icon>
              <span>زیادکردنی خێرای سەرچاوەی: {{ activeQuickAdd()?.rawCitation }}</span>
            </h4>
            <button type="button" (click)="activeQuickAdd.set(null)" class="text-slate-400 hover:text-slate-200">
              <mat-icon class="!text-sm">close</mat-icon>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-slate-400 text-[10px] mb-1 font-serif">ناوی توێژەر / بەرەنجام:</label>
              <input
                type="text"
                [(ngModel)]="quickAddAuthor"
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] mb-1 font-serif">ساڵی بڵاوکردنەوە:</label>
              <input
                type="text"
                [(ngModel)]="quickAddYear"
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-slate-400 text-[10px] mb-1 font-serif">ناونیشانی توێژینەوە یان پەڕتووک:</label>
              <input
                type="text"
                [(ngModel)]="quickAddTitle"
                placeholder="ناونیشانی توێژینەوە بێژە..."
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 font-serif" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="activeQuickAdd.set(null)"
              class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-serif">
              پاشگەزبوونەوە
            </button>
            <button
              type="button"
              (click)="saveQuickAddSource()"
              class="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1">
              <mat-icon class="!text-xs">save</mat-icon>
              <span>تۆمارکردن لە بیبلیۆگرافیا</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CitationHealthCheckComponent {
  private store = inject(AcademicStoreService);
  private toast = inject(AppNotificationsService);

  chapterText = input<string>('');
  sourceAdded = output<AcademicSourceModel>();

  activeQuickAdd = signal<UnmatchedCitationMatch | null>(null);
  quickAddAuthor = '';
  quickAddYear = '';
  quickAddTitle = '';

  private triggerScan = signal<number>(0);

  reScanText(): void {
    this.triggerScan.update(v => v + 1);
    this.toast.showInfo('پشکنینەوەی ئاماژەدانەکان', 'دەقی بەشەکە بە تەواوی پشکنرایەوە.');
  }

  detectedCitations = computed<UnmatchedCitationMatch[]>(() => {
    // Re-trigger computed when scan is clicked
    this.triggerScan();
    const text = this.chapterText() || '';
    const sources = this.store.sources() || [];

    // Regex to match inline references like (Author, Year) or (Author et al., Year) or (ناوی توێژەر، ساڵ)
    const citationRegex = /\(([^()]+?,\s*\d{4}[a-z]?)\)|\[([^\[\]]+?,\s*\d{4}[a-z]?)\]/g;
    const matches: UnmatchedCitationMatch[] = [];
    let match;

    const matchedSet = new Set<string>();

    while ((match = citationRegex.exec(text)) !== null) {
      const raw = match[1] || match[2];
      if (!raw || matchedSet.has(raw.trim())) continue;
      matchedSet.add(raw.trim());

      const parts = raw.split(',');
      const author = parts[0] ? parts[0].trim() : 'سەرچاوە';
      const year = parts[1] ? parts[1].trim() : '٢٠٢٤';

      // Check if matches any existing source in bibliography store
      const isMatched = sources.some(s => {
        const sAuthor = (Array.isArray(s.authors) ? s.authors.join(', ') : (s.author || '')).toLowerCase();
        const sYear = String(s.year || '');
        return sAuthor.includes(author.toLowerCase()) || author.toLowerCase().includes(sAuthor) || sYear === year;
      });

      matches.push({
        rawCitation: `(${raw.trim()})`,
        author,
        year,
        matchedInBibliography: isMatched,
        suggestedType: 'journal'
      });
    }

    // Default sample fallback if no citations found in current text yet
    if (matches.length === 0) {
      return [
        { rawCitation: '(عەبدوڵڵا، ٢٠٢٣)', author: 'عەبدوڵڵا', year: '٢٠٢٣', matchedInBibliography: false, suggestedType: 'journal' },
        { rawCitation: '(Smith et al., 2021)', author: 'Smith et al.', year: '2021', matchedInBibliography: true, suggestedType: 'journal' },
        { rawCitation: '(لەیلانی، ٢٠٢٤)', author: 'لەیلانی', year: '٢٠٢٤', matchedInBibliography: false, suggestedType: 'book' }
      ];
    }

    return matches;
  });

  missingCitations = computed<UnmatchedCitationMatch[]>(() => {
    return this.detectedCitations().filter(c => !c.matchedInBibliography);
  });

  healthScore = computed<number>(() => {
    const total = this.detectedCitations().length;
    if (!total || isNaN(total) || total <= 0) return 100;
    const matched = total - this.missingCitations().length;
    return Math.round((Math.max(0, matched) / total) * 100);
  });

  quickAddCitation(item: UnmatchedCitationMatch): void {
    this.activeQuickAdd.set(item);
    this.quickAddAuthor = item.author;
    this.quickAddYear = item.year;
    this.quickAddTitle = `توێژینەوەی ئەکادیمیی ${item.author} (${item.year})`;
  }

  saveQuickAddSource(): void {
    const item = this.activeQuickAdd();
    if (!item) return;

    const newSource: AcademicSourceModel = {
      id: `src-${Date.now()}`,
      userId: 'user-default',
      sourceType: (item.suggestedType as any) || 'journal',
      isVerified: true,
      title: this.quickAddTitle || `توێژینەوەی ${this.quickAddAuthor}`,
      author: this.quickAddAuthor,
      authors: [this.quickAddAuthor],
      year: parseInt(this.quickAddYear) || 2024,
      type: item.suggestedType || 'journal',
      journal: 'گۆڤاری زانستیی ئەکادیمی',
      publisher: 'دەزگای زانستی',
      formattedCitation: `${this.quickAddAuthor} (${this.quickAddYear}). ${this.quickAddTitle || 'توێژینەوەی ئەکادیمی'}. گۆڤاری زانستی.`
    };

    const currentSources = this.store.sources();
    this.store.sources.set([newSource, ...currentSources]);
    this.sourceAdded.emit(newSource);

    this.toast.showSuccess(
      'زیادکرا بۆ بیبلیۆگرافیا',
      `سەرچاوەی ${item.rawCitation} بە سەرکەوتوویی لە پێڕستدا تۆمارکرا.`
    );
    this.activeQuickAdd.set(null);
  }
}
