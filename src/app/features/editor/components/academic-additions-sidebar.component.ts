import { Component, ChangeDetectionStrategy, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

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
      class="w-full bg-[#1C1816] text-[#F4EFEA] border border-[#3A322E] rounded-2xl p-4 flex flex-col space-y-4 shadow-xl font-sans"
      dir="rtl"
      id="academic-additions-sidebar">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[#3A322E] pb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <mat-icon class="!text-lg">post_add</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-extrabold text-stone-100 font-serif">
              زیادکراوە ئەکادیمییەکان (Academic Additions)
            </h3>
            <p class="text-[10px] text-stone-400 font-serif">
              بەڕێوەبردنی میتۆد، فەرزنامە و پارچە دەقە پێشنیارکراوەکان
            </p>
          </div>
        </div>
        <span class="text-[9.5px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
          {{ additions().length }} برگە
        </span>
      </div>

      <!-- Filter Categories -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-serif scrollbar-none">
        <button
          type="button"
          (click)="selectedCategory.set('all')"
          [class]="selectedCategory() === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'"
          class="px-2.5 py-1 rounded-md transition cursor-pointer shrink-0">
          هەموو
        </button>
        <button
          type="button"
          (click)="selectedCategory.set('methodology')"
          [class]="selectedCategory() === 'methodology' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'"
          class="px-2.5 py-1 rounded-md transition cursor-pointer shrink-0">
          میتۆدۆلۆجیا
        </button>
        <button
          type="button"
          (click)="selectedCategory.set('hypothesis')"
          [class]="selectedCategory() === 'hypothesis' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'"
          class="px-2.5 py-1 rounded-md transition cursor-pointer shrink-0">
          فەرزنامە
        </button>
        <button
          type="button"
          (click)="selectedCategory.set('framework')"
          [class]="selectedCategory() === 'framework' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'"
          class="px-2.5 py-1 rounded-md transition cursor-pointer shrink-0">
          چوارچێوە
        </button>
      </div>

      <!-- Items List -->
      <div class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        @for (item of filteredAdditions(); track item.id) {
          <div class="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 rounded-xl p-3 space-y-2 transition-all group">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-amber-400/90 font-serif flex items-center gap-1">
                <mat-icon class="!text-xs">bookmark</mat-icon>
                {{ item.categoryLabel }}
              </span>
              <span class="text-[9px] text-stone-500 font-mono">{{ item.timestamp }}</span>
            </div>

            <h4 class="text-xs font-bold text-stone-200 font-serif leading-snug">
              {{ item.title }}
            </h4>

            <p class="text-[11px] text-stone-300 font-serif leading-relaxed line-clamp-3 text-justify">
              {{ item.content }}
            </p>

            <div class="flex items-center justify-between pt-1 border-t border-stone-800/70">
              <div class="flex items-center gap-1">
                @for (tag of item.tags; track tag) {
                  <span class="text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-serif">
                    #{{ tag }}
                  </span>
                }
              </div>

              <!-- One-Click Insertion Button -->
              <button
                type="button"
                (click)="onInsert(item)"
                class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="داخڵکردنی ڕاستەوخۆ بۆ ناو دەقی سەرەکی">
                <mat-icon class="!text-xs">input</mat-icon>
                <span>تێکردن بۆ دەق</span>
              </button>
            </div>
          </div>
        } @empty {
          <div class="text-center py-8 text-stone-500 text-xs font-serif">
            هیچ بڕگەیەک لەم پۆلەدا نییە.
          </div>
        }
      </div>

      <!-- Quick New Addition Creator Input -->
      <div class="pt-2 border-t border-[#3A322E] space-y-2">
        <div class="flex items-center justify-between text-[11px] font-serif text-stone-300">
          <span>زیادکردنی بڕگەی خێرا:</span>
        </div>
        <input
          type="text"
          [(ngModel)]="newTitle"
          placeholder="ناونیشانی بڕگە (بۆ نموونە: میتۆدی ڕاپرسی)..."
          class="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500" />
        <textarea
          [(ngModel)]="newContent"
          rows="2"
          placeholder="دەقی ئەکادیمی بۆ بەکارهێنان..."
          class="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"></textarea>
        <button
          type="button"
          (click)="addNewAddition()"
          [disabled]="!newTitle.trim() || !newContent.trim()"
          class="w-full py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer">
          <mat-icon class="!text-xs">add</mat-icon>
          <span>پاشەکەوتکردن لە شریتی تەنیشت</span>
        </button>
      </div>

    </aside>
  `
})
export class AcademicAdditionsSidebarComponent {
  insertRequested = output<string>();

  selectedCategory = signal<string>('all');
  newTitle = '';
  newContent = '';

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
    },
    {
      id: 'add-4',
      category: 'literature',
      categoryLabel: 'کەلێنی زانستی (Literature Gap)',
      title: 'کەلێنی سەرچاوە لە توێژینەوەی ئەدەبیاتی دیجیتاڵی',
      content: 'سەرەڕای بوونی لێکۆڵینەوە لەسەر دیوانی شاعیرانی کلاسیک، هێشتا کەلێنێکی بەرچاو لە ئەدەبیاتی بەراوردکاریدا بەدی دەکرێت سەبارەت بە گواستنەوەی فۆڕمی شێعر بۆ فەزای دیجیتاڵیی سۆرانی.',
      tags: ['کەلێن', 'ئەدەب', 'دیجیتاڵی'],
      timestamp: 'پێشتر'
    }
  ]);

  filteredAdditions() {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.additions();
    return this.additions().filter(a => a.category === cat);
  }

  onInsert(item: AcademicAdditionItem): void {
    const textToInsert = `\n\n### ${item.title}\n${item.content}\n`;
    this.insertRequested.emit(textToInsert);
  }

  addNewAddition(): void {
    if (!this.newTitle.trim() || !this.newContent.trim()) return;
    const newItem: AcademicAdditionItem = {
      id: `add-${Date.now()}`,
      category: 'methodology',
      categoryLabel: 'زیادکراوی تایبەت (Custom Addition)',
      title: this.newTitle.trim(),
      content: this.newContent.trim(),
      tags: ['تایبەت'],
      timestamp: 'ئێستا'
    };
    this.additions.update(arr => [newItem, ...arr]);
    this.newTitle = '';
    this.newContent = '';
  }
}
