import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface SpecializedAcademicTerm {
  id: string;
  kurdishTerm: string;
  foreignTerm: string;
  scientificField: string;
  definition: string;
  contextualExample: string;
}

const INITIAL_SPECIALIZED_TERMS: SpecializedAcademicTerm[] = [
  {
    id: 'term-1',
    kurdishTerm: 'ڕەوایی پێوانە',
    foreignTerm: 'Measurement Validity',
    scientificField: 'میتۆدۆلۆژیا و پێوانەکردن (Methodology & Psychometrics)',
    definition: 'ئاستی دروستی و لێهاتوویی کەرەستەی لێکۆڵینەوە لە پێوانی ئەو دیاردەیەی کە بۆی دیزاین کراوە.',
    contextualExample: 'بۆ ساغکردنەوەی ڕەوایی پێوانە (Measurement Validity)، پەنا برایە بەر پێوەری هاوئاهەنگیی ناوبژیوانی لیژنەی شارەزایان.'
  },
  {
    id: 'term-2',
    kurdishTerm: 'جێگیریی ناوەکی',
    foreignTerm: 'Internal Consistency',
    scientificField: 'ئاماری ئەکادیمی (Academic Statistics)',
    definition: 'پێوەری هاوتەریبی و لێکچوونی وەڵامەکانی بەشداربووان لەنێوان بڕگە جیاوازەکانی هەمان پێوەردا.',
    contextualExample: 'ڕێژەی جێگیریی ناوەکی (Internal Consistency) بە هاوکێشەی کڕۆنباخ ئەلفا (Cronbach\'s Alpha = 0.89) دەستەبەر کرا.'
  },
  {
    id: 'term-3',
    kurdishTerm: 'سێگۆشەسازیی میتۆدۆلۆژی',
    foreignTerm: 'Methodological Triangulation',
    scientificField: 'دیزاینی توێژینەوە (Research Design)',
    definition: 'بەگەڕخستنی هاوکاتی فرەمیتۆدی چەندایەتی و چۆنایەتی بۆ دوورکەوتنەوە لە لایەنگری و شێواندنی داتا.',
    contextualExample: 'توێژەر بۆ دڵنیابوون لە فرەڕەهەندیی دەرئەنجامەکان، سێگۆشەسازیی میتۆدۆلۆژی (Methodological Triangulation)ی پەسەند کرد.'
  },
  {
    id: 'term-4',
    kurdishTerm: 'بۆشایی زانستی',
    foreignTerm: 'Research Gap / Literature Gap',
    scientificField: 'ئەدەبیاتی پێشوو (Literature Review)',
    definition: 'ئەو کەلەبەر و پرسە شیکارنەکراوەی لە ئەدەبیاتی پێشوودا چارەسەر نەکراوە و توێژینەوەکە ئامانجییەتی پڕی بکاتەوە.',
    contextualExample: 'ئەم توێژینەوەیە بە ئامانجی پڕکردنەوەی بۆشایی زانستی (Literature Gap) لە بواری مۆرفۆلۆژیی کوردی ئەنجام دراوە.'
  },
  {
    id: 'term-5',
    kurdishTerm: 'تێربوونی بیردۆزی',
    foreignTerm: 'Theoretical Saturation',
    scientificField: 'توێژینەوەی چۆنایەتی (Qualitative Research)',
    definition: 'ئەو خاڵەی کە لە داتای چاوپێکەوتنەکاندا هیچ کۆد یان تەوەرێکی نوێ سەرهەڵنادات و زانیارییەکان دووبارە دەبنەوە.',
    contextualExample: 'دوای ئەنجامدانی ١٨ چاوپێکەوتنی قووڵ، تێربوونی بیردۆزی (Theoretical Saturation) لە کۆکردنەوەی داتادا بەدەست هات.'
  }
];

const STORAGE_KEY = 'academic_terminology_manager_v1';

@Component({
  selector: 'app-academic-terminology-manager',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-right" dir="rtl">
      <!-- سەرپەڕی بەڕێوەبەری زاراوە ئەکادیمییەکان -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <mat-icon>auto_stories</mat-icon>
            </span>
            <h2 class="text-xl font-bold text-stone-900">بەڕێوەبەری زاراوە ئەکادیمییە پسپۆڕییەکان (Academic Terminology Manager)</h2>
          </div>
          <p class="text-sm text-stone-600 mt-1">
            پێناسەکردن، جێگیرکردن و یەکخستنی زاراوە زانستییە کوردییەکان بۆ پاراستنی هاوئاهەنگیی تێرمینۆلۆژی لە تەواوی توێژینەوەدا.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showAddModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition cursor-pointer">
            <mat-icon class="text-sm">add_circle</mat-icon>
            <span>زیادکردنی زاراوەی نوێ</span>
          </button>
          <button
            type="button"
            (click)="exportTerms()"
            class="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition cursor-pointer">
            <mat-icon class="text-sm">download</mat-icon>
            <span>هەناردەکردن (JSON)</span>
          </button>
        </div>
      </div>

      <!-- فلتەر و گەڕان -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="relative">
          <mat-icon class="absolute right-3 top-2.5 text-stone-400 text-sm">search</mat-icon>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="گەڕان بەدوای زاراوە، هاوتا یان چەمک..."
            class="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition" />
        </div>

        <div>
          <select
            [ngModel]="selectedField()"
            (ngModelChange)="selectedField.set($event)"
            class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition">
            <option value="ALL">سەرجەم بوارە زانستییەکان (All Fields)</option>
            @for (f of availableFields(); track f) {
              <option [value]="f">{{ f }}</option>
            }
          </select>
        </div>

        <div class="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <span class="font-medium">ژمارەی زاراوە چالاکەکان:</span>
          <span class="font-bold text-sm px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg">
            {{ filteredTerms().length }} لە {{ terms().length }}
          </span>
        </div>
      </div>

      <!-- کارتی هاوئاهەنگی لە دەستنووسدا -->
      <div class="bg-gradient-to-l from-emerald-50 to-stone-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <mat-icon class="text-emerald-600 mt-0.5">verified</mat-icon>
          <div>
            <h4 class="text-sm font-bold text-emerald-950">پشکنەری یەکگرتوویی زاراوەسازی لە دەستنووسدا (Consistency Auditor)</h4>
            <p class="text-xs text-stone-600 mt-0.5">
              بە یەک کرتە زاراوەی هاوتادار بخەرە ناو بەشە چالاکەکەت بۆ ڕێگری لە دووبارەبوونەوەی هەڵە.
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="auditDocument()"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer">
          <mat-icon class="text-xs">find_in_page</mat-icon>
          <span>پشکنینی بەشەکان</span>
        </button>
      </div>

      <!-- پێڕستی زاراوە تۆمارکراوەکان -->
      <div class="space-y-3">
        @if (filteredTerms().length === 0) {
          <div class="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500">
            هیچ زاراوەیەک نەدۆزرایەوە.
          </div>
        } @else {
          @for (item of filteredTerms(); track item.id) {
            <div class="p-4 rounded-xl border border-stone-200 hover:border-emerald-300 transition-all bg-white hover:shadow-xs space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-base font-bold text-stone-900">{{ item.kurdishTerm }}</span>
                  <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100" dir="ltr">
                    ({{ item.foreignTerm }})
                  </span>
                  <span class="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {{ item.scientificField }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    (click)="insertIntoDocument(item)"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium transition cursor-pointer">
                    <mat-icon class="text-xs">post_add</mat-icon>
                    <span>تێخستنە دەق</span>
                  </button>
                  <button
                    type="button"
                    (click)="deleteTerm(item.id)"
                    class="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer">
                    <mat-icon class="text-xs">delete_outline</mat-icon>
                  </button>
                </div>
              </div>

              <div class="text-xs text-stone-700 leading-relaxed bg-stone-50/70 p-3 rounded-lg border border-stone-100 space-y-1.5">
                <div class="flex items-start gap-1.5">
                  <strong class="text-stone-900 shrink-0">پێناسەی زانستی:</strong>
                  <span>{{ item.definition }}</span>
                </div>
                <div class="flex items-start gap-1.5 text-emerald-900">
                  <strong class="text-emerald-950 shrink-0">نموونە لە دەقدا:</strong>
                  <span class="italic">«{{ item.contextualExample }}»</span>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- مۆداڵی زیادکردنی زاراوە -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4" dir="rtl">
            <div class="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 class="text-base font-bold text-stone-900">تۆمارکردنی زاراوەی ئەکادیمی نوێ</h3>
              <button type="button" (click)="showAddModal.set(false)" class="text-stone-400 hover:text-stone-600 p-1 cursor-pointer">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-stone-800 mb-1">زاراوەی پێشنیارکراو بە کوردی *</label>
                <input type="text" [(ngModel)]="newKurdishTerm" placeholder="وەک: ڕەوایی نێوەڕۆک" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block font-semibold text-stone-800 mb-1">هاوتای بیانی/ئینگلیزی (Foreign Equivalent) *</label>
                <input type="text" [(ngModel)]="newForeignTerm" placeholder="وەک: Content Validity" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500" dir="ltr" />
              </div>
              <div>
                <label class="block font-semibold text-stone-800 mb-1">بواری زانستی *</label>
                <input type="text" [(ngModel)]="newField" placeholder="وەک: میتۆدۆلۆژیا، ئامار، زمانەوانی" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block font-semibold text-stone-800 mb-1">پێناسەی وردی زانستی *</label>
                <textarea [(ngModel)]="newDefinition" rows="2" placeholder="پێناسەی کارپێکراو یان تیۆری..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500"></textarea>
              </div>
              <div>
                <label class="block font-semibold text-stone-800 mb-1">نموونەی بەکارهێنان لە دەقدا *</label>
                <textarea [(ngModel)]="newExample" rows="2" placeholder="ڕستەیەکی نموونەیی بۆ ڕێنمایی نووسەر..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button type="button" (click)="showAddModal.set(false)" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer">
                پاشگەزبوونەوە
              </button>
              <button type="button" (click)="saveTerm()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AcademicTerminologyManagerComponent {
  chapters = input<ChapterItem[]>([]);

  private editor = inject(EditorService);
  private notifications = inject(AppNotificationsService);

  terms = signal<SpecializedAcademicTerm[]>(this.loadTerms());
  searchQuery = signal<string>('');
  selectedField = signal<string>('ALL');
  showAddModal = signal<boolean>(false);

  newKurdishTerm = '';
  newForeignTerm = '';
  newField = '';
  newDefinition = '';
  newExample = '';

  availableFields = computed(() => {
    const set = new Set<string>();
    for (const t of this.terms()) {
      if (t.scientificField) set.add(t.scientificField);
    }
    return Array.from(set);
  });

  filteredTerms = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.selectedField();
    return this.terms().filter(item => {
      const matchField = f === 'ALL' || item.scientificField === f;
      if (!matchField) return false;
      if (!q) return true;
      return (
        item.kurdishTerm.toLowerCase().includes(q) ||
        item.foreignTerm.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.contextualExample.toLowerCase().includes(q)
      );
    });
  });

  private loadTerms(): SpecializedAcademicTerm[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return INITIAL_SPECIALIZED_TERMS;
  }

  private persist(items: SpecializedAcademicTerm[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {}
  }

  saveTerm() {
    if (!this.newKurdishTerm.trim() || !this.newForeignTerm.trim()) {
      this.notifications.showWarning('فۆرم', 'تکایە زاراوەی کوردی و هاوتا بیانییەکە دیاری بکە.');
      return;
    }
    const term: SpecializedAcademicTerm = {
      id: 'term-' + Date.now(),
      kurdishTerm: this.newKurdishTerm.trim(),
      foreignTerm: this.newForeignTerm.trim(),
      scientificField: this.newField.trim() || 'گشتی (General Academic)',
      definition: this.newDefinition.trim() || 'پێناسەی زانستی.',
      contextualExample: this.newExample.trim() || `${this.newKurdishTerm} (${this.newForeignTerm}) بەکارهێنرا.`
    };
    const updated = [term, ...this.terms()];
    this.terms.set(updated);
    this.persist(updated);
    this.newKurdishTerm = '';
    this.newForeignTerm = '';
    this.newField = '';
    this.newDefinition = '';
    this.newExample = '';
    this.showAddModal.set(false);
    this.notifications.showSuccess('پاشەکەوت کرا', `زاراوەی «${term.kurdishTerm}» پاشەکەوت کرا.`);
  }

  deleteTerm(id: string) {
    const updated = this.terms().filter(t => t.id !== id);
    this.terms.set(updated);
    this.persist(updated);
    this.notifications.showInfo('سڕایەوە', 'زاراوەکە سڕایەوە.');
  }

  insertIntoDocument(item: SpecializedAcademicTerm) {
    const snippet = ` **${item.kurdishTerm} (${item.foreignTerm})** `;
    const ch = this.chapters().find(c => c.id === this.editor.activeChapterId()) || this.chapters()[0];
    if (ch) {
      const current = (ch.content || '').trim();
      const updated = current ? `${current} ${snippet}` : snippet.trim();
      this.editor.updateChapterContent(ch.id, updated, 'دانانی زاراوەی ئەکادیمی');
      this.notifications.showSuccess('دانرا', `زاراوەی «${item.kurdishTerm}» خرایە ناو دەستنووس.`);
    } else {
      this.notifications.showWarning('ئاگاداری', 'سەرەتا بەشێک لە سەرنووسەر هەڵبژێرە.');
    }
  }

  auditDocument() {
    let count = 0;
    for (const term of this.terms()) {
      for (const ch of this.chapters()) {
        if (ch.content && ch.content.includes(term.kurdishTerm)) count++;
      }
    }
    this.notifications.showInfo('پشکنین', `پشکنین: ${count} جار زاراوەکان لە دەستنووسدا دۆزرانەوە.`);
  }

  exportTerms() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.terms(), null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `academic_terms_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.notifications.showSuccess('هەناردەکردن', 'فەرهەنگی زاراوەکان هەناردە کرا.');
  }
}
