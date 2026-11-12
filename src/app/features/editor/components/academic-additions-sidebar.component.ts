import { Component, ChangeDetectionStrategy, signal, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { ResearchCorpusCard } from '../../../helpers/thesis-context-map';
import { toSoraniNumber } from '../../../pipes/sorani-number.pipe';

export interface AcademicAdditionItem {
  id: string;
  category: 'methodology' | 'hypothesis' | 'framework' | 'literature' | 'evidence';
  title: string;
  categoryLabel: string;
  content: string;
  tags: string[];
  timestamp: string;
}

@Component({
  selector: 'app-academic-additions-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="w-full bg-[#1C1816] text-[#F4EFEA] border border-[#3A322E] rounded-2xl p-4 flex flex-col space-y-3.5 shadow-xl font-sans"
      dir="rtl"
      id="academic-additions-sidebar">
      
      <!-- Top Mode Toggle -->
      <div class="grid grid-cols-2 gap-1.5 p-1 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-serif">
        <button
          type="button"
          (click)="activeView.set('corpus')"
          [class]="activeView() === 'corpus' ? 'bg-amber-500 text-stone-950 font-extrabold shadow' : 'text-stone-400 hover:text-stone-200'"
          class="py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <mat-icon class="!text-xs">collections_bookmark</mat-icon>
          <span>سندوقی فیشی کۆرپەس</span>
          <span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono"
            [class]="activeView() === 'corpus' ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-stone-300'">
            {{ toSorani(corpusCards().length) }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeView.set('additions')"
          [class]="activeView() === 'additions' ? 'bg-amber-500 text-stone-950 font-extrabold shadow' : 'text-stone-400 hover:text-stone-200'"
          class="py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <mat-icon class="!text-xs">post_add</mat-icon>
          <span>زیادکراوە تیۆرییەکان</span>
        </button>
      </div>

      <!-- VIEW 1: CORPUS CARDS (سندوقی دەقی بنەڕەتی و فیشەکانی خوێندنەوە) -->
      @if (activeView() === 'corpus') {
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-[#3A322E] pb-2">
            <div>
              <h3 class="text-xs font-bold text-stone-100 font-serif flex items-center gap-1">
                <mat-icon class="!text-xs text-amber-400">menu_book</mat-icon>
                <span>فیشەکانی دەقی کۆرپەس (Primary Corpus)</span>
              </h3>
              <p class="text-[10px] text-stone-400 font-serif">
                دەقی سەرەکیی شێعر، گەشتنامە، ئەرشیف یان داتای مەیدانی
              </p>
            </div>
            <button
              type="button"
              (click)="isAddingCorpus.set(!isAddingCorpus())"
              class="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition">
              <mat-icon class="!text-xs">{{ isAddingCorpus() ? 'close' : 'add' }}</mat-icon>
              <span>{{ isAddingCorpus() ? 'داخستن' : 'فیشی نوێ' }}</span>
            </button>
          </div>

          <!-- Add New Corpus Card Form -->
          @if (isAddingCorpus()) {
            <div class="p-3 bg-stone-950 border border-amber-500/30 rounded-xl space-y-2 text-xs font-serif">
              <span class="text-[11px] font-bold text-amber-300 block">زیادکردنی فیشی وەرگرتن و دەقی کۆرپەس:</span>
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  [(ngModel)]="newCorpus.sourceTitle"
                  placeholder="سەرچاوە (بۆ نموونە: دیوانی نالی)..."
                  class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500" />
                <input
                  type="text"
                  [(ngModel)]="newCorpus.author"
                  placeholder="نووسەر / شاعیر..."
                  class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500" />
              </div>

              <div class="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  [(ngModel)]="newCorpus.pageNumber"
                  placeholder="لاپەڕە (نم: ٨٤)"
                  class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500" />
                <select
                  [(ngModel)]="newCorpus.targetChapterId"
                  class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500">
                  <option [value]="1">بەشی ١: دەروازە</option>
                  <option [value]="2">بەشی ٢: شیکاریی ١</option>
                  <option [value]="3">بەشی ٣: شیکاریی ٢</option>
                  <option [value]="4">بەشی ٤: بەراوردکاری</option>
                  <option [value]="5">بەشی ٥: ئەنجام</option>
                </select>
                <select
                  [(ngModel)]="newCorpus.category"
                  class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500">
                  <option value="poetry">شێعر</option>
                  <option value="literary_passage">دەقی ئەدەبی</option>
                  <option value="travelogue">گەشتنامە</option>
                  <option value="archival">بەڵگەی ئەرشیفی</option>
                  <option value="field_data">داتای مەیدانی</option>
                </select>
              </div>

              <textarea
                [(ngModel)]="newCorpus.excerptText"
                rows="2"
                placeholder="دەقی دەقاودەقی کۆرپەس (نم: قوربانی تۆزی ڕێگەتم ئەی بادەکەی سەحەر...)"
                class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"></textarea>

              <textarea
                [(ngModel)]="newCorpus.analyticalNote"
                rows="2"
                placeholder="تێبینیی شیکاری و ئاراستەی لێکۆڵینەوەی گوتار بۆ AI..."
                class="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"></textarea>

              <button
                type="button"
                (click)="saveCorpusCard()"
                [disabled]="!newCorpus.sourceTitle || !newCorpus.excerptText"
                class="w-full py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer">
                <mat-icon class="!text-xs">save</mat-icon>
                <span>پاشەکەوتکردنی فیش لە سندوق</span>
              </button>
            </div>
          }

          <!-- Corpus Cards List -->
          <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            @for (card of corpusCards(); track card.id) {
              <div class="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 rounded-xl p-3 space-y-2 transition-all">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="font-bold text-amber-400 font-serif flex items-center gap-1">
                    <mat-icon class="!text-xs">label</mat-icon>
                    بەشی {{ toSorani(card.targetChapterId) }} • {{ getCategoryLabel(card.category) }}
                  </span>
                  <button
                    type="button"
                    (click)="deleteCorpusCard(card.id)"
                    class="text-stone-500 hover:text-rose-400 transition cursor-pointer p-0.5">
                    <mat-icon class="!text-xs">delete</mat-icon>
                  </button>
                </div>

                <div class="text-xs font-bold text-stone-200 font-serif">
                  «{{ card.sourceTitle }}» <span class="text-stone-400 font-normal">({{ card.author }}، ل. {{ toSorani(card.pageNumber) }})</span>
                </div>

                <blockquote class="p-2 bg-stone-950 border-r-2 border-amber-500 rounded text-[11px] text-amber-100 font-serif leading-relaxed italic">
                  «{{ card.excerptText }}»
                </blockquote>

                @if (card.analyticalNote) {
                  <p class="text-[10px] text-stone-400 font-serif bg-stone-950/60 p-1.5 rounded border border-stone-800">
                    🔍 <strong class="text-stone-300">ئاراستەی شیکاری:</strong> {{ card.analyticalNote }}
                  </p>
                }

                <div class="flex items-center justify-end pt-1 border-t border-stone-800/70">
                  <button
                    type="button"
                    (click)="insertCorpusToEditor(card)"
                    class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs">
                    <mat-icon class="!text-xs">input</mat-icon>
                    <span>داخڵکردنی فیش بۆ دەق</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="text-center py-6 text-stone-500 text-xs font-serif bg-stone-950/40 rounded-xl border border-stone-800">
                هیچ فیشێکی کۆرپەس تۆمار نەکراوە.
              </div>
            }
          </div>
        </div>
      }

      <!-- VIEW 2: THEORETICAL ADDITIONS -->
      @if (activeView() === 'additions') {
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-[#3A322E] pb-2">
            <div>
              <h3 class="text-xs font-bold text-stone-100 font-serif">زیادکراوە تیۆرییەکان</h3>
              <p class="text-[10px] text-stone-400 font-serif">میتۆدۆلۆجیا، فەرزنامە و کەلێنی زانستی</p>
            </div>
            <span class="text-[9.5px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
              {{ additions().length }} برگە
            </span>
          </div>

          <!-- Items List -->
          <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            @for (item of additions(); track item.id) {
              <div class="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 rounded-xl p-3 space-y-1.5 transition-all">
                <div class="flex items-center justify-between text-[10px] text-amber-400/90 font-serif font-bold">
                  <span>{{ item.categoryLabel }}</span>
                  <span class="text-[9px] text-stone-500 font-mono">{{ item.timestamp }}</span>
                </div>
                <h4 class="text-xs font-bold text-stone-200 font-serif">{{ item.title }}</h4>
                <p class="text-[11px] text-stone-300 font-serif leading-relaxed line-clamp-3 text-justify">{{ item.content }}</p>
                <div class="flex items-center justify-end pt-1 border-t border-stone-800/70">
                  <button
                    type="button"
                    (click)="onInsert(item)"
                    class="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-xs">input</mat-icon>
                    <span>تێکردن بۆ دەق</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </aside>
  `
})
export class AcademicAdditionsSidebarComponent {
  private academicStore = inject(AcademicStoreService);

  insertRequested = output<string>();

  activeView = signal<'corpus' | 'additions'>('corpus');
  isAddingCorpus = signal<boolean>(false);

  corpusCards = computed(() => this.academicStore.researchCorpusCards());

  newCorpus = {
    sourceTitle: '',
    author: '',
    pageNumber: '',
    targetChapterId: 2,
    category: 'poetry' as const,
    excerptText: '',
    analyticalNote: ''
  };

  readonly additions = signal<AcademicAdditionItem[]>([
    {
      id: 'add-1',
      category: 'methodology',
      categoryLabel: 'میتۆدۆلۆجیا (Methodology)',
      title: 'میتۆدی تێکەڵاوی چەندایەتی و چۆنایەتی (Triangulation)',
      content: 'لە پێناو بەدەستهێنانی ڕەوایی زانستی (Validity)، ئەم لێکۆڵینەوەیە پەنا دەباتە بەر میتۆدی بەراوردکاریی سێگۆشەیی (Triangulation)، لە ڕێگەی ئاوێتەکردنی شرۆڤەی دەقی گوتار لەگەڵ داتای ڕاپرسیی مەیدانی لە نێوان توێژە گەنجەکاندا.',
      tags: ['میتۆدۆلۆجیا', 'Triangulation', 'ڕەوایی'],
      timestamp: 'ئەمڕۆ'
    },
    {
      id: 'add-2',
      category: 'hypothesis',
      categoryLabel: 'فەرزنامەی توێژینەوە (Hypothesis)',
      title: 'فەرزنامەی سەرەکی: کاریگەریی پێچەوانەی سۆشیال میدیا لەسەر زاراوەسازی',
      content: 'فەرز دەکرێت کە چەندە بەکارهێنانی سۆشیال میدیای کوردی بەبێ چاودێری زمانەوانی پەرە بسێنێت، بە هەمان ڕێژە ڕستەسازیی سۆرانی تووشی داڕمانی مۆرفۆلۆجی و کەمبوونەوەی ڕەسەنایەتی وشەسازی دەبێتەوە.',
      tags: ['فەرزنامە', 'سۆشیال_میدیا', 'زمانەوانی'],
      timestamp: 'دوێنێ'
    },
    {
      id: 'add-3',
      category: 'framework',
      categoryLabel: 'چوارچێوەی تیۆری (Theoretical Framework)',
      title: 'تیۆریی گۆڕانی کۆمەڵایەتی و مۆدێرنیتە (Anthony Giddens)',
      content: 'بە پشتبەستن بە چوارچێوەی تیۆریی ئەنتۆنی گیدنز لە چەمکی (Reflexive Modernity)، کۆمەڵگای کوردی لە قۆناغی بڕیاردانی بەردەوام و داڕشتنەوەی شوناسی خوێندەواریدایە لە نێوان نەریت و ڕەوتی گڵۆباڵیزەیشندا.',
      tags: ['تیۆری', 'گیدنز', 'مۆدێرنیتە'],
      timestamp: 'پێشتر'
    }
  ]);

  toSorani(val: any): string {
    return toSoraniNumber(val);
  }

  getCategoryLabel(cat?: string): string {
    switch (cat) {
      case 'poetry': return 'شێعر';
      case 'literary_passage': return 'دەقی ئەدەبی';
      case 'travelogue': return 'گەشتنامە';
      case 'archival': return 'ئەرشیف';
      case 'field_data': return 'داتای مەیدانی';
      default: return 'دەقی کۆرپەس';
    }
  }

  saveCorpusCard(): void {
    if (!this.newCorpus.sourceTitle.trim() || !this.newCorpus.excerptText.trim()) return;
    this.academicStore.addCorpusCard({
      sourceTitle: this.newCorpus.sourceTitle.trim(),
      author: this.newCorpus.author.trim() || 'نەزانراو',
      pageNumber: this.newCorpus.pageNumber.trim() || '١',
      targetChapterId: Number(this.newCorpus.targetChapterId) || 2,
      category: this.newCorpus.category,
      excerptText: this.newCorpus.excerptText.trim(),
      analyticalNote: this.newCorpus.analyticalNote.trim(),
      tags: ['کۆرپەس', this.getCategoryLabel(this.newCorpus.category)]
    });

    this.newCorpus.sourceTitle = '';
    this.newCorpus.author = '';
    this.newCorpus.pageNumber = '';
    this.newCorpus.excerptText = '';
    this.newCorpus.analyticalNote = '';
    this.isAddingCorpus.set(false);
  }

  deleteCorpusCard(id: string): void {
    this.academicStore.deleteCorpusCard(id);
  }

  insertCorpusToEditor(card: ResearchCorpusCard): void {
    const formatted = `\n\n> «${card.excerptText}»\n> — (${card.author}، «${card.sourceTitle}»، ل. ${card.pageNumber})\n\n**شیکاریی دەق و گوتار:** ${card.analyticalNote || 'لە ڕوانگەی شیکاریی گوتارەوە، ئەم دەقە سەلمێنەری چەمکی...'}\n`;
    this.insertRequested.emit(formatted);
  }

  onInsert(item: AcademicAdditionItem): void {
    const textToInsert = `\n\n### ${item.title}\n${item.content}\n`;
    this.insertRequested.emit(textToInsert);
  }
}
