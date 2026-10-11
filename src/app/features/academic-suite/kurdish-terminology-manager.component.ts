import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { TerminologyConsistencyAuditorComponent } from './terminology-consistency-auditor.component';

export interface AcademicTerm {
  id: string;
  kurdishTerm: string;
  foreignTerm: string;
  field: string;
  definition: string;
  academicExample: string;
  source?: string;
}

const DEFAULT_TERMS: AcademicTerm[] = [
  {
    id: 't-1',
    kurdishTerm: 'ڕەوایی نێوەڕۆک',
    foreignTerm: 'Content Validity',
    field: 'میتۆدۆلۆژیا',
    definition: 'ئاستی گونجان و پێوانەکردنی دروستی ئامرازەکە بۆ تەواوی ئەو بوارەی لێکۆڵینەوەی لەسەر دەکات.',
    academicExample: 'بۆ مسۆگەرکردنی ڕەوایی نێوەڕۆک، پرسیارنامەکە خرایە بەردەم دەستەیەک لە پسپۆڕان.',
    source: 'کۆمەڵەی زانستی کوردی'
  },
  {
    id: 't-2',
    kurdishTerm: 'جێگیریی پێوانە',
    foreignTerm: 'Reliability',
    field: 'ئامار و پێوانە',
    definition: 'پابەندبوون بە دەستکەوتنی هەمان ئەنجام لە کاتی دووبارەکردنەوەی تاقیکردنەوە لە هەمان بارودۆخدا.',
    academicExample: 'هاوکۆلکەی جێگیری بە هاوکێشەی کڕۆنباخ ئەلفا (Cronbach Alpha) ئەژمار کرا.',
    source: 'مەنهەجی زانستی'
  },
  {
    id: 't-3',
    kurdishTerm: 'چوارچێوەی چەمکی',
    foreignTerm: 'Conceptual Framework',
    field: 'تیۆری',
    definition: 'نەخشەی پەیوەندی نێوان گۆڕاوە سەرەکییەکان (پێوەبەستراو و سەربەخۆ) لە توێژینەوەدا.',
    academicExample: 'چوارچێوەی چەمکی لە بەشی دووەمدا شی کراوەتەوە.',
    source: 'زاراوەسازی ئەکادیمی'
  },
  {
    id: 't-4',
    kurdishTerm: 'سێگۆشەسازیی بەڵگە',
    foreignTerm: 'Triangulation',
    field: 'میتۆدۆلۆژیا',
    definition: 'بەکارهێنانی فرەشێوازی (چاوپێکەوتن، ڕاپرسی، بەڵگەنامە) بۆ پشتڕاستکردنەوەی دروستیی ئەنجامەکان.',
    academicExample: 'بەمەبەستی زیادکردنی باوەڕپێکراوی، سێگۆشەسازی لە نێوان چاوپێکەوتن و ڕاپرسی ئەنجام درا.',
    source: 'بنەماکانی توێژینەوە'
  },
  {
    id: 't-5',
    kurdishTerm: 'تێربوونی بیردۆزی',
    foreignTerm: 'Theoretical Saturation',
    field: 'چۆنایەتی',
    definition: 'ئەو قۆناغەی کۆکردنەوەی زانیاری کە تیایدا هیچ داتایەکی نوێ یان چەمکێکی تازە لە بەشداربووانەوە بەدەست نایەت.',
    academicExample: 'کۆکردنەوەی داتا تا گەیشتن بە تێربوونی بیردۆزی بەردەوام بوو.',
    source: 'میتۆدی چۆنایەتی'
  }
];

@Component({
  selector: 'app-kurdish-terminology-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">translate</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>بانکی زاراوەسازیی ئەکادیمیی کوردی (Academic Terminology Glossary)</span>
              <span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                {{ filteredTerms().length }} زاراوە
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              پێناسەکردن، گەڕان و بەکارهێنانی یەکگرتووی زاراوە زانستییەکان لە تەواوی توێژینەوەکەتدا
            </p>
          </div>
        </div>

        <!-- Add Button Toggle -->
        <button (click)="isAddingNew.set(!isAddingNew())"
                class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer">
          <mat-icon class="!text-sm !w-4 !h-4">{{ isAddingNew() ? 'close' : 'add' }}</mat-icon>
          <span>{{ isAddingNew() ? 'داخستنی فۆرم' : 'زیادکردنی زاراوەی نوێ' }}</span>
        </button>
      </div>

      <!-- Search & Field Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div class="md:col-span-2 relative">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="گەڕان بەدوای زاراوەی کوردی یان هاوتای ئینگلیزی/عەرەبی..."
            class="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none" />
          <mat-icon class="absolute left-2.5 top-2.5 text-slate-500 !text-sm !w-4 !h-4">search</mat-icon>
        </div>

        <select
          [ngModel]="selectedField()"
          (ngModelChange)="selectedField.set($event)"
          class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer">
          <option value="all">هەموو بوارەکان (گشتی)</option>
          <option value="میتۆدۆلۆژیا">میتۆدۆلۆژیا و توێژینەوە</option>
          <option value="ئامار و پێوانە">ئامار و پێوانەی زانستی</option>
          <option value="تیۆری">چوارچێوەی تیۆری</option>
          <option value="چۆنایەتی">لێکۆڵینەوەی چۆنایەتی</option>
        </select>
      </div>

      <!-- Add New Term Modal/Inline Form -->
      @if (isAddingNew()) {
        <div class="p-4 bg-slate-950 border border-amber-900/60 rounded-xl space-y-3">
          <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">bookmark_add</mat-icon>
            <span>پێناسەکردنی زاراوەی نوێ بۆ پڕۆژەکە:</span>
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input [(ngModel)]="newKurdishTerm" placeholder="زاراوە بە کوردی *"
                   class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none" />
            <input [(ngModel)]="newForeignTerm" placeholder="هاوتای ئینگلیزی/عەرەبی"
                   class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none font-mono" />
            <input [(ngModel)]="newField" placeholder="بواری زانستی"
                   class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <textarea [(ngModel)]="newDefinition" rows="2" placeholder="پێناسە یان ڕوونکردنەوەی ئەکادیمی..."
                      class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"></textarea>
            <textarea [(ngModel)]="newExample" rows="2" placeholder="نموونەی بەکارهێنان لەناو ڕستەی توێژینەوەدا..."
                      class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button (click)="isAddingNew.set(false)"
                    class="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 cursor-pointer">
              پاشگەزبوونەوە
            </button>
            <button (click)="saveNewTerm()"
                    class="px-3 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-500 cursor-pointer">
              پاشەکەوتکردنی زاراوە
            </button>
          </div>
        </div>
      }

      <!-- Terminology List Cards -->
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        @for (item of filteredTerms(); track item.id) {
          <div class="bg-slate-950/80 border border-slate-800/80 hover:border-amber-900/60 p-3 rounded-xl transition space-y-1.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-amber-200">{{ item.kurdishTerm }}</span>
                @if (item.foreignTerm) {
                  <span class="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {{ item.foreignTerm }}
                  </span>
                }
                <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {{ item.field }}
                </span>
              </div>

              <!-- Insertion Actions -->
              <div class="flex items-center gap-1.5">
                <button (click)="insertTermOnly(item)"
                        [disabled]="!activeChapter()"
                        class="px-2 py-1 bg-slate-800 hover:bg-amber-900/40 text-slate-300 hover:text-amber-200 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="تەنها ناوی زاراوەکە دابنێ">
                  <mat-icon class="!text-xs !w-3 !h-3">add</mat-icon>
                  <span>دانان</span>
                </button>

                <button (click)="insertWithDefinition(item)"
                        [disabled]="!activeChapter()"
                        class="px-2 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="دانان لەگەڵ پێناسە و نموونە">
                  <mat-icon class="!text-xs !w-3 !h-3">menu_book</mat-icon>
                  <span>دانان بە پێناسەوە</span>
                </button>
              </div>
            </div>

            <!-- Definition & Context -->
            <p class="text-xs text-slate-300 leading-relaxed font-serif">
              {{ item.definition }}
            </p>

            @if (item.academicExample) {
              <div class="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 font-serif">
                <span class="text-amber-400 font-bold">نموونە: </span>
                <span>«{{ item.academicExample }}»</span>
              </div>
            }
          </div>
        } @empty {
          <div class="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            هیچ زاراوەیەک بەپێی ئەم گەڕانە نەدۆزرایەوە.
          </div>
        }
      </div>
    </div>
  `
})
export class KurdishTerminologyManagerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  terms = signal<AcademicTerm[]>(this.loadTerms());
  searchQuery = signal<string>('');
  selectedField = signal<string>('all');
  isAddingNew = signal<boolean>(false);

  newKurdishTerm = '';
  newForeignTerm = '';
  newField = 'میتۆدۆلۆژیا';
  newDefinition = '';
  newExample = '';

  filteredTerms = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.selectedField();
    return this.terms().filter(t => {
      const matchQuery = !q ||
        t.kurdishTerm.toLowerCase().includes(q) ||
        t.foreignTerm.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q);
      const matchField = f === 'all' || t.field === f;
      return matchQuery && matchField;
    });
  });

  private loadTerms(): AcademicTerm[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('mam_academic_terms');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_TERMS;
  }

  private saveTerms(items: AcademicTerm[]): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('mam_academic_terms', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }

  saveNewTerm(): void {
    if (!this.newKurdishTerm.trim()) {
      this.toastService.showWarning('فۆرم', 'تکایە ناوی زاراوەکە بە کوردی بنووسە.');
      return;
    }

    const item: AcademicTerm = {
      id: `t-${Date.now()}`,
      kurdishTerm: this.newKurdishTerm.trim(),
      foreignTerm: this.newForeignTerm.trim(),
      field: this.newField.trim() || 'گشتی',
      definition: this.newDefinition.trim() || 'پێناسەی دیاریکراو دانەنراوە.',
      academicExample: this.newExample.trim()
    };

    const updated = [item, ...this.terms()];
    this.terms.set(updated);
    this.saveTerms(updated);

    this.newKurdishTerm = '';
    this.newForeignTerm = '';
    this.newDefinition = '';
    this.newExample = '';
    this.isAddingNew.set(false);
    this.toastService.showSuccess('زاراوە پاشەکەوت کرا', `زاراوەی «${item.kurdishTerm}» بە سەرکەوتوویی زیاد کرا.`);
  }

  insertTermOnly(item: AcademicTerm): void {
    const ch = this.activeChapter();
    if (!ch) return;
    const current = (ch.content || '').trim();
    const textToInsert = item.foreignTerm ? `${item.kurdishTerm} (${item.foreignTerm})` : item.kurdishTerm;
    const updated = current ? `${current} ${textToInsert}` : textToInsert;
    this.editorService.updateChapterContent(ch.id, updated, 'دانانی زاراوە');
    this.toastService.showSuccess('دانرا', `«${item.kurdishTerm}» خرایە ناو دەقەوە.`);
  }

  insertWithDefinition(item: AcademicTerm): void {
    const ch = this.activeChapter();
    if (!ch) return;
    const current = (ch.content || '').trim();
    const snippet = `\n\n**${item.kurdishTerm}** ${item.foreignTerm ? `(*${item.foreignTerm}*)` : ''}: ${item.definition}${item.academicExample ? ` (بۆ نموونە: «${item.academicExample}»)` : ''}\n`;
    const updated = current ? `${current}${snippet}` : snippet.trim();
    this.editorService.updateChapterContent(ch.id, updated, 'دانانی پێناسەی زاراوە');
    this.toastService.showSuccess('دانرا', `پێناسەی «${item.kurdishTerm}» خرایە ناو بەشەکەوە.`);
  }
}
