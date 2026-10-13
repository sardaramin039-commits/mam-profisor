import { Component, ChangeDetectionStrategy, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { EditorService } from '../editor/services/editor';
import { AcademicStoreService } from '../../services/academic-store.service';
import { AcademicSource } from '../../services/data';

export interface UncitedSnippet {
  id: string;
  snippetText: string;
  suggestedTopic: string;
  startIndex: number;
  endIndex: number;
}

@Component({
  selector: 'app-in-text-citation-prompter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-right font-sans space-y-5" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
            <mat-icon class="!text-lg !w-5 !h-5">format_quote</mat-icon>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-100 font-serif">هاوپێچی ژێدەر لە دەقدا (In-Text Citation Prompter)</h4>
            <p class="text-[11px] text-slate-400">دەستنیشانکردنی بڕگەکانی دەق و بەستنەوەی ڕاستەوخۆ بە سەرچاوە تۆمارکراوەکانی پڕۆژە</p>
          </div>
        </div>
        <span class="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2.5 py-1 rounded-full font-bold">
          Auto In-Text Linker
        </span>
      </div>

      <!-- Controls & Style Choice -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <label class="block text-slate-400 mb-1">شێوازی ئاماژەدان (Citation Style):</label>
          <select 
            [(ngModel)]="selectedStyle" 
            class="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500">
            <option value="APA">APA 7th (ناوی نووسەر، ساڵ)</option>
            <option value="Harvard">Harvard (Author, Year)</option>
            <option value="Chicago">Chicago / ژمارەیی [١]</option>
          </select>
        </div>

        <div class="md:col-span-2 flex items-end justify-between gap-2 flex-wrap">
          <button 
            type="button"
            (click)="scanChapterForClaims()"
            class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
            <mat-icon class="!text-sm">find_in_page</mat-icon>
            <span>پشکنینی دەقی بەش بۆ دەستنیشانکردنی بڕگە پێویستەکان</span>
          </button>

          <span class="text-[11px] text-slate-400">
            سەرچاوەی بەردەست لە پڕۆژەدا: <strong class="text-cyan-400">{{ availableSources().length }}</strong>
          </span>
        </div>
      </div>

      <!-- Detected Snippets requiring citation -->
      @if (detectedSnippets().length > 0) {
        <div class="space-y-3">
          <h5 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
            <mat-icon class="!text-xs text-amber-400">priority_high</mat-icon>
            <span>بڕگە دەستنیشانکراوەکان کە پێویستیان بە سەرچاوە هەیە:</span>
          </h5>

          <div class="space-y-2.5">
            @for (snippet of detectedSnippets(); track snippet.id) {
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <span class="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                      بڕگەی بانگەشە (Claim):
                    </span>
                    <blockquote class="text-xs text-slate-300 font-serif bg-slate-900/60 p-2.5 rounded-lg border-r-2 border-cyan-500 leading-relaxed">
                      «{{ snippet.snippetText }}»
                    </blockquote>
                  </div>
                </div>

                <!-- Source Picker Dialog inside snippet card -->
                <div class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span class="text-[11px] font-bold text-cyan-300 block">سەرچاوەیەک لە پڕۆژەکەت هەڵبژێرە بۆ بەستنەوە:</span>
                  
                  @if (availableSources().length > 0) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                      @for (source of availableSources(); track source.id) {
                        <button 
                          type="button"
                          (click)="insertCitationForSnippet(snippet, source)"
                          class="p-2 bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500 text-right rounded-lg text-xs transition flex flex-col justify-between group cursor-pointer">
                          <span class="font-bold text-slate-200 group-hover:text-cyan-300 truncate w-full">{{ source.title }}</span>
                          <span class="text-[10px] text-slate-400 font-mono mt-1">
                            {{ source.author }} ({{ source.year }})
                          </span>
                        </button>
                      }
                    </div>
                  } @else {
                    <p class="text-[11px] text-slate-400">هیچ سەرچاوەیەک لە پڕۆژەکەتدا تۆمار نەکراوە. دەتوانیت لە بەشی کتێبخانە زیاد بکەیت.</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
          <mat-icon class="text-cyan-400 !text-2xl !w-8 !h-8">fact_check</mat-icon>
          <p class="text-xs text-slate-300">هیچ بڕگەیەکی بێ سەرچاوە نەدۆزرایەوە، یان پشکنین ئەنجام نەدراوە.</p>
          <p class="text-[11px] text-slate-500">کرتە لە دوگمەی سەرەوە بکە بۆ پشکنینی ڕاستەوخۆی دەقی بەشی هەڵبژێردراو.</p>
        </div>
      }

      <!-- Custom In-Text Citation Tool -->
      <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <h5 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
          <mat-icon class="!text-xs text-cyan-400">add_link</mat-icon>
          <span>دانانی دەستیی ئاماژەی سەرچاوە لە دەقی بەشەکەدا:</span>
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input 
            type="text" 
            [(ngModel)]="customAuthor" 
            placeholder="ناوی نووسەر (بۆ نموونە: ئەحمەد)" 
            class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
          <input 
            type="text" 
            [(ngModel)]="customYear" 
            placeholder="ساڵی بڵاوکردنەوە (٢٠٢٣)" 
            class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
          <input 
            type="text" 
            [(ngModel)]="customPage" 
            placeholder="لاپەڕە (ل. ٤٥)" 
            class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
        </div>

        <button 
          type="button"
          (click)="appendCustomCitation()"
          [disabled]="!customAuthor || !customYear"
          class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
          <mat-icon class="!text-sm">post_add</mat-icon>
          <span>خستنە سەر کۆتایی دەقی بەشی چالاک</span>
        </button>
      </div>
    </div>
  `
})
export class InTextCitationPrompterComponent {
  private editorService = inject(EditorService);
  private academicStore = inject(AcademicStoreService);

  activeChapter = input<ChapterItem | null>(null);

  selectedStyle = 'APA';
  customAuthor = '';
  customYear = '';
  customPage = '';

  detectedSnippets = signal<UncitedSnippet[]>([]);

  availableSources = computed<AcademicSource[]>(() => {
    return this.academicStore.sources() || [];
  });

  scanChapterForClaims(): void {
    const ch = this.activeChapter();
    const content = ch?.content || '';

    if (!content.trim()) {
      this.detectedSnippets.set([]);
      return;
    }

    // Heuristically detect sentences that present claims/findings without parenthetical citations
    const sentences = content.split(/[.،؛؟\n]+/).map(s => s.trim()).filter(s => s.length > 35);
    const uncited = sentences
      .filter(s => !s.includes('(') && !s.includes('[') && (s.includes('دەریخست') || s.includes('ئاماژە') || s.includes('سەلماندی') || s.includes('دەریدەخات') || s.includes('توێژینەوە') || s.includes('ڕێژەی') || s.includes('داتاکان')))
      .slice(0, 5);

    const snippets: UncitedSnippet[] = uncited.map((s, idx) => ({
      id: `snippet-${idx}`,
      snippetText: s,
      suggestedTopic: 'پێویستی بە سەرچاوەدانانە بۆ پشتڕاستکردنەوەی بەڵگە',
      startIndex: content.indexOf(s),
      endIndex: content.indexOf(s) + s.length
    }));

    this.detectedSnippets.set(snippets);
  }

  insertCitationForSnippet(snippet: UncitedSnippet, source: AcademicSource): void {
    const ch = this.activeChapter();
    if (!ch) return;

    let citation = '';
    if (this.selectedStyle === 'APA') {
      citation = `(${source.author}، ${source.year})`;
    } else if (this.selectedStyle === 'Harvard') {
      citation = `(${source.author}, ${source.year})`;
    } else {
      citation = `[${source.author} ${source.year}]`;
    }

    const currentContent = ch.content || '';
    const replacement = `${snippet.snippetText} ${citation}`;
    const updatedContent = currentContent.replace(snippet.snippetText, replacement);

    this.editorService.updateChapterContent(
      ch.id,
      updatedContent,
      `زیادکردنی سەرچاوەی دەق بۆ: ${source.author}`
    );

    // Remove snippet from pending list
    this.detectedSnippets.update(list => list.filter(s => s.id !== snippet.id));
  }

  appendCustomCitation(): void {
    const ch = this.activeChapter();
    if (!ch) return;

    let citation = '';
    const pagePart = this.customPage ? `، ${this.customPage}` : '';

    if (this.selectedStyle === 'APA') {
      citation = ` (${this.customAuthor}، ${this.customYear}${pagePart})`;
    } else {
      citation = ` (${this.customAuthor}, ${this.customYear}${pagePart})`;
    }

    const updatedContent = (ch.content || '') + citation;
    this.editorService.updateChapterContent(ch.id, updatedContent, 'زیادکردنی سەرچاوەی دەستی');

    this.customAuthor = '';
    this.customYear = '';
    this.customPage = '';
  }
}
