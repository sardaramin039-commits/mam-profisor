import { Component, ChangeDetectionStrategy, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { EditorService } from '../editor/services/editor';

export interface ScholasticWordMapping {
  colloquial: string;
  highRegisterSynonyms: string[];
  scholasticContext: string;
  category: 'connective' | 'evaluative' | 'argumentative' | 'descriptive';
}

const SCHOLASTIC_DICTIONARY: ScholasticWordMapping[] = [
  {
    colloquial: 'بۆیە',
    highRegisterSynonyms: ['لەبەر ئەم هۆکارە', 'بەم پێیەش', 'کەواتە', 'لێرەوە دەردەکەوێت کە'],
    scholasticContext: 'پەیوەندیی هۆ و ئەنجام بە تۆنێکی فەرمی و زانستی',
    category: 'connective'
  },
  {
    colloquial: 'دەڵێت',
    highRegisterSynonyms: ['دووپاتی دەکاتەوە کە', 'ئاماژە بەوە دەدات کە', 'جەخت لەوە دەکاتەوە', 'بەیانی دەکات'],
    scholasticContext: 'ئاماژەدان بە گوتە یان دۆزینەوەی سەرچاوە و توێژەران',
    category: 'argumentative'
  },
  {
    colloquial: 'باشە',
    highRegisterSynonyms: ['گونجاو و شیاوە', 'جێگەی بایەخە', 'لەبار و پەسەندکراوە', 'خاوەن بەهای زانستییە'],
    scholasticContext: 'هەڵسەنگاندنی ئەرێنی بۆ بەڵگە یان میتۆد',
    category: 'evaluative'
  },
  {
    colloquial: 'زۆر',
    highRegisterSynonyms: ['ڕادەیەکی بەرچاو', 'بە شێوەیەکی بەرفراوان', 'پلەیەکی باڵا', 'قەبارەیەکی باڵادەست'],
    scholasticContext: 'دەربڕینی بڕ و ئاست بە شێوازێکی پێوانەیی',
    category: 'descriptive'
  },
  {
    colloquial: 'گرنگە',
    highRegisterSynonyms: ['جێگەی سەرنج و بایەخی بنەڕەتییە', 'بایەخێکی ستراتیژی هەیە', 'سەنگێکی زانستیی گرنگی هەیە'],
    scholasticContext: 'دەستنیشانکردنی گرنگی و کاریگەریی تەوەر',
    category: 'evaluative'
  },
  {
    colloquial: 'باسی دەکات',
    highRegisterSynonyms: ['تەوزیحی دەدات', 'شیکاریی وردی بۆ دەکات', 'دەستنیشانی دەکات', 'دەیخاتە بەر باس و توێژینەوە'],
    scholasticContext: 'ڕوونکردنەوەی ناواخنی توێژینەوەکە',
    category: 'argumentative'
  },
  {
    colloquial: 'هەروەها',
    highRegisterSynonyms: ['سەرباری ئەمەش', 'هاوکات لەگەڵ ئەوەشدا', 'لە درێژەی ئەم باسەدا', 'جگە لەوەش'],
    scholasticContext: 'پەیوەستکردنی بڕگە و تەوەرە لێکچووەکان',
    category: 'connective'
  },
  {
    colloquial: 'نازانین',
    highRegisterSynonyms: ['بەڵگەی تەواو لەبەردەستدا نییە دەربارەی', 'هێشتا وەک بۆشاییەکی مەعریفی ماوەتەوە', 'پێویستی بە لێکۆڵینەوەی پتر هەیە'],
    scholasticContext: 'دەربڕینی بێلایەنانەی بۆشاییەکانی زانیاری',
    category: 'descriptive'
  },
  {
    colloquial: 'نوێ',
    highRegisterSynonyms: ['هاوچەرخ', 'نوێترین دۆزینەوە', 'بێوێنە و پێشەنگ'],
    scholasticContext: 'وەسفکردنی بەڵگە و کەرەستەی زانستی',
    category: 'descriptive'
  },
  {
    colloquial: 'کێشە',
    highRegisterSynonyms: ['ئاستەنگیی میتۆدۆلۆژی', 'ناکۆکیی زانستی', 'گرێکوێرەی لێکۆڵینەوە'],
    scholasticContext: 'دەستنیشانکردنی کێشە لە تێزدا',
    category: 'argumentative'
  }
];

@Component({
  selector: 'app-kurdish-terminology-refiner',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-right font-sans space-y-5" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <mat-icon class="!text-lg !w-5 !h-5">spellcheck</mat-icon>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-100 font-serif">بژارکەری زاراوەسازیی ئەکادیمی (Terminology Refiner)</h4>
            <p class="text-[11px] text-slate-400">پێشنیارکردنی هاوواتای فەرمی و ئاست-باڵا بۆ وشە باوەکان بە کوردیی سۆرانی</p>
          </div>
        </div>
        <span class="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-full font-bold">
          High-Register Scholastic Engine
        </span>
      </div>

      <!-- Action & Input area -->
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-300">
          <span>دەقی ڕەشنووس بۆ پشکنینی ئاستی گوتار:</span>
          @if (activeChapter()) {
            <button 
              type="button"
              (click)="loadActiveChapterText()"
              class="text-[10.5px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold">
              <mat-icon class="!text-xs">sync</mat-icon>
              <span>هێنانی دەقی بەشی چالاک ({{ activeChapter()?.title }})</span>
            </button>
          }
        </div>

        <textarea 
          [(ngModel)]="draftText"
          (input)="runRefinementScan()"
          rows="4"
          placeholder="دەقی ڕەشنووسەکەت لێرە بنووسە یان بیهێنە تا وشە باوەکان دەستنیشان بکات..."
          class="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-serif leading-relaxed"></textarea>

        <div class="flex items-center justify-between flex-wrap gap-2">
          <button 
            type="button"
            (click)="runRefinementScan()"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer">
            <mat-icon class="!text-sm">analytics</mat-icon>
            <span>شیکردنەوەی وشە باوەکان و پێشنیاری ئەکادیمی</span>
          </button>

          <span class="text-[11px] text-slate-400">
            وشەی دۆزراوە بۆ پاڵفتەکردن: <strong class="text-amber-400">{{ detectedOccurrences().length }}</strong>
          </span>
        </div>
      </div>

      <!-- Detected Suggestions -->
      @if (detectedOccurrences().length > 0) {
        <div class="space-y-3 pt-2 border-t border-slate-800">
          <h5 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
            <mat-icon class="!text-xs text-amber-400">auto_fix_high</mat-icon>
            <span>پێشنیارە فەرمییەکان بۆ بەرزکردنەوەی ئاستی گوتار:</span>
          </h5>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (item of detectedOccurrences(); track $index) {
              <div class="bg-slate-950/80 border border-slate-800 hover:border-amber-600/50 rounded-xl p-3 space-y-2 transition">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                    وشەی باو: «{{ item.mapping.colloquial }}»
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">{{ item.count }} جار دووبارەبووەتەوە</span>
                </div>

                <p class="text-[10.5px] text-slate-400 leading-snug">{{ item.mapping.scholasticContext }}</p>

                <div class="space-y-1 pt-1">
                  <span class="text-[10px] text-amber-300 font-bold block">جێگرەوە پێشنیارکراوە باڵاکان:</span>
                  <div class="flex flex-wrap gap-1.5">
                    @for (syn of item.mapping.highRegisterSynonyms; track syn) {
                      <button 
                        type="button"
                        (click)="applySynonymReplacement(item.mapping.colloquial, syn)"
                        class="px-2 py-1 bg-slate-900 hover:bg-amber-600 hover:text-slate-950 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-serif transition flex items-center gap-1 cursor-pointer"
                        title="جێگرتنەوەی هەموو «{{ item.mapping.colloquial }}» بەم دەستەواژەیە">
                        <mat-icon class="!text-[10px] !w-3 !h-3">swap_horiz</mat-icon>
                        <span>{{ syn }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (draftText) {
        <div class="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
          <mat-icon class="text-emerald-400 !text-sm">verified</mat-icon>
          <span>ئاستی گوتاری دەقەکەت بەرزە و هیچ دەستەواژەیەکی نزم یان گشتیی تێدا بەدی نەکرا.</span>
        </div>
      }

      <!-- Scholastic Catalog Table -->
      <div class="pt-3 border-t border-slate-800 space-y-2">
        <span class="text-xs font-bold text-slate-300 block font-serif">پێڕستی هەڵبژێردراوی زاراوە باڵاکانی ئەکادیمیای کوردی:</span>
        <div class="overflow-x-auto max-h-48 scrollbar-thin">
          <table class="w-full text-right text-[11px] text-slate-300">
            <thead class="bg-slate-950 text-slate-400 text-[10px] border-b border-slate-800">
              <tr>
                <th class="p-2">دەستەواژەی باو</th>
                <th class="p-2">هاوواتای فەرمی و زانستی</th>
                <th class="p-2">کاربرد لە تێزدا</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              @for (entry of dictionary; track entry.colloquial) {
                <tr class="hover:bg-slate-800/30">
                  <td class="p-2 text-rose-300 font-bold">{{ entry.colloquial }}</td>
                  <td class="p-2 text-amber-300 font-serif">{{ entry.highRegisterSynonyms.join(' ، ') }}</td>
                  <td class="p-2 text-slate-400 text-[10px]">{{ entry.scholasticContext }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class KurdishTerminologyRefinerComponent {
  private editorService = inject(EditorService);

  activeChapter = input<ChapterItem | null>(null);

  draftText = '';
  dictionary = SCHOLASTIC_DICTIONARY;
  detectedOccurrences = signal<{ mapping: ScholasticWordMapping; count: number }[]>([]);

  constructor() {
    this.draftText = 'بۆیە نووسەر دەڵێت کە ئەم میتۆدە زۆر باشە و هەروەها زۆر گرنگە بۆ توێژینەوەکە.';
    this.runRefinementScan();
  }

  loadActiveChapterText(): void {
    const ch = this.activeChapter();
    if (ch && ch.content) {
      this.draftText = ch.content;
      this.runRefinementScan();
    }
  }

  runRefinementScan(): void {
    const text = this.draftText || '';
    if (!text.trim()) {
      this.detectedOccurrences.set([]);
      return;
    }

    const matches: { mapping: ScholasticWordMapping; count: number }[] = [];
    for (const mapping of this.dictionary) {
      const regex = new RegExp(`\\b${mapping.colloquial}\\b`, 'gu');
      const count = (text.match(regex) || []).length;
      if (count > 0) {
        matches.push({ mapping, count });
      }
    }
    this.detectedOccurrences.set(matches);
  }

  applySynonymReplacement(colloquial: string, highRegister: string): void {
    const regex = new RegExp(`\\b${colloquial}\\b`, 'gu');
    this.draftText = this.draftText.replace(regex, highRegister);
    this.runRefinementScan();

    const ch = this.activeChapter();
    if (ch) {
      this.editorService.updateChapterContent(
        ch.id,
        this.draftText,
        `پاڵفتەکردنی زاراوەی «${colloquial}» بۆ «${highRegister}»`
      );
    }
  }
}
