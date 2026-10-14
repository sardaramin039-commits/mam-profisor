import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import {
  AcademicTerm as AuditorTerm,
  TerminologyDocumentAudit,
  auditDocumentTerminology,
  standardizeTermAcrossChapters
} from '../../helpers/terminology-consistency-checker';

export interface AcademicTerm {
  id: string;
  kurdishTerm: string;
  foreignTerm: string;
  field: string;
  definition: string;
  academicExample: string;
  source?: string;
}

export interface ScholasticWordMapping {
  colloquial: string;
  highRegisterSynonyms: string[];
  scholasticContext: string;
  category: 'connective' | 'evaluative' | 'argumentative' | 'descriptive';
}

const DEFAULT_TERMS: AcademicTerm[] = [
  { id: 't-1', kurdishTerm: 'ڕەوایی نێوەڕۆک', foreignTerm: 'Content Validity', field: 'میتۆدۆلۆژیا', definition: 'ئاستی گونجان و پێوانەکردنی دروستی ئامرازەکە بۆ تەواوی ئەو بوارەی لێکۆڵینەوەی لەسەر دەکات.', academicExample: 'بۆ مسۆگەرکردنی ڕەوایی نێوەڕۆک، پرسیارنامەکە خرایە بەردەم دەستەیەک لە پسپۆڕان.', source: 'کۆمەڵەی زانستی کوردی' },
  { id: 't-2', kurdishTerm: 'جێگیریی پێوانە', foreignTerm: 'Reliability', field: 'ئامار و پێوانە', definition: 'پابەندبوون بە دەستکەوتنی هەمان ئەنجام لە کاتی دووبارەکردنەوەی تاقیکردنەوە لە هەمان بارودۆخدا.', academicExample: 'هاوکۆلکەی جێگیری بە هاوکێشەی کڕۆنباخ ئەلفا (Cronbach Alpha) ئەژمار کرا.', source: 'مەنهەجی زانستی' },
  { id: 't-3', kurdishTerm: 'چوارچێوەی چەمکی', foreignTerm: 'Conceptual Framework', field: 'تیۆری', definition: 'نەخشەی پەیوەندی نێوان گۆڕاوە سەرەکییەکان (پێوەبەستراو و سەربەخۆ) لە توێژینەوەدا.', academicExample: 'چوارچێوەی چەمکی لە بەشی دووەمدا شی کراوەتەوە.', source: 'زاراوەسازی ئەکادیمی' },
  { id: 't-4', kurdishTerm: 'سێگۆشەسازیی بەڵگە', foreignTerm: 'Triangulation', field: 'میتۆدۆلۆژیا', definition: 'بەکارهێنانی فرەشێوازی (چاوپێکەوتن، ڕاپرسی، بەڵگەنامە) بۆ پشتڕاستکردنەوەی دروستیی ئەنجامەکان.', academicExample: 'بەمەبەستی زیادکردنی باوەڕپێکراوی، سێگۆشەسازی ئەنجام درا.', source: 'بنەماکانی توێژینەوە' },
  { id: 't-5', kurdishTerm: 'تێربوونی بیردۆزی', foreignTerm: 'Theoretical Saturation', field: 'توێژینەوەی چۆنایەتی', definition: 'ئەو قۆناغەی لە کۆکردنەوەی داتادا هیچ زانیاری یان کۆدێکی نوێ لە چاوپێکەوتنەکاندا سەرهەڵنادات.', academicExample: 'تێربوونی بیردۆزی لە داتاکاندا بەدەست هات.', source: 'میتۆدی کیفی' },
  { id: 't-6', kurdishTerm: 'بۆشایی زانستی', foreignTerm: 'Research Gap', field: 'ئەدەبیاتی پێشوو', definition: 'ئەو کەلەبەرەی لە توێژینەوەکانی پێشوودا چارەسەر نەکراوە و توێژەر دەستنیشانی دەکات.', academicExample: 'ئەم توێژینەوەیە هەوڵ دەدات بۆشایی زانستی پڕ بکاتەوە.', source: 'ڕێبەری ئەکادیمی' }
];

const SCHOLASTIC_DICTIONARY: ScholasticWordMapping[] = [
  { colloquial: 'بۆیە', highRegisterSynonyms: ['لەبەر ئەم هۆکارە', 'بەم پێیەش', 'کەواتە', 'لێرەوە دەردەکەوێت کە'], scholasticContext: 'پەیوەندیی هۆ و ئەنجام بە شێوازی فەرمی', category: 'connective' },
  { colloquial: 'دەڵێت', highRegisterSynonyms: ['دووپاتی دەکاتەوە کە', 'ئاماژە بەوە دەدات کە', 'جەخت لەوە دەکاتەوە', 'بەیانی دەکات'], scholasticContext: 'ئاماژەدان بە گوتە یان دۆزینەوەی سەرچاوە و توێژەران', category: 'argumentative' },
  { colloquial: 'باشە', highRegisterSynonyms: ['گونجاو و شیاوە', 'جێگەی بایەخە', 'لەبار و پەسەندکراوە', 'خاوەن بەهای زانستییە'], scholasticContext: 'هەڵسەنگاندنی ئەرێنی بۆ بەڵگە یان میتۆد', category: 'evaluative' },
  { colloquial: 'زۆر', highRegisterSynonyms: ['ڕادەیەکی بەرچاو', 'بە شێوەیەکی بەرفراوان', 'پلەیەکی باڵا', 'قەبارەیەکی باڵادەست'], scholasticContext: 'دەربڕینی بڕ و ئاست بە شێوازێکی پێوانەیی', category: 'descriptive' },
  { colloquial: 'گرنگە', highRegisterSynonyms: ['جێگەی سەرنج و بایەخی بنەڕەتییە', 'بایەخێکی ستراتیژی هەیە', 'سەنگێکی زانستیی گرنگی هەیە'], scholasticContext: 'دەستنیشانکردنی گرنگی و کاریگەریی تەوەر', category: 'evaluative' },
  { colloquial: 'باسی دەکات', highRegisterSynonyms: ['شیکاریی وردی بۆ دەکات', 'دەستنیشانی دەکات', 'دەیخاتە بەر باس و توێژینەوە'], scholasticContext: 'ڕوونکردنەوەی ناواخنی بابەت', category: 'argumentative' }
];

@Component({
  selector: 'app-kurdish-terminology-manager, app-academic-terminology-manager, app-kurdish-terminology-refiner, app-terminology-consistency-auditor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">auto_stories</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ناوەندی یەکگرتووی زاراوەسازی و پاڵاوتنی ئەکادیمی</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">Kurdish Lexicon Hub</span>
            </h3>
            <p class="text-xs text-slate-400">بەڕێوەبردنی فەرهەنگ، پاڵاوتنی دەستەواژەی زانستی، و پشکنینی یەکگرتوویی زاراوەکان لە تەواوی تێزدا.</p>
          </div>
        </div>

        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button type="button" (click)="activeTab.set('glossary')" [class.bg-emerald-600]="activeTab() === 'glossary'" [class.text-white]="activeTab() === 'glossary'" [class.text-slate-400]="activeTab() !== 'glossary'" class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">menu_book</mat-icon><span>فەرهەنگ</span>
          </button>
          <button type="button" (click)="activeTab.set('refiner')" [class.bg-emerald-600]="activeTab() === 'refiner'" [class.text-white]="activeTab() === 'refiner'" [class.text-slate-400]="activeTab() !== 'refiner'" class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">auto_fix_high</mat-icon><span>پاڵاوتن</span>
          </button>
          <button type="button" (click)="activeTab.set('auditor'); runAudit()" [class.bg-emerald-600]="activeTab() === 'auditor'" [class.text-white]="activeTab() === 'auditor'" [class.text-slate-400]="activeTab() !== 'auditor'" class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">spellcheck</mat-icon><span>پشکنینی یەکگرتوویی</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: GLOSSARY & TERMINOLOGY -->
      @if (activeTab() === 'glossary') {
        <div class="space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-1 min-w-[200px]">
              <div class="relative flex-1">
                <mat-icon class="absolute right-3 top-2.5 text-slate-500 !text-sm !w-4 !h-4">search</mat-icon>
                <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="گەڕان لە زاراوەکان..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
              </div>
              <select [ngModel]="selectedField()" (ngModelChange)="selectedField.set($event)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
                <option value="all">هەموو بوارەکان</option>
                <option value="میتۆدۆلۆژیا">میتۆدۆلۆژیا</option>
                <option value="ئامار و پێوانە">ئامار و پێوانە</option>
                <option value="تیۆری">تیۆری</option>
                <option value="توێژینەوەی چۆنایەتی">توێژینەوەی چۆنایەتی</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="isAddingNew.set(!isAddingNew())" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">add</mat-icon><span>زاراوەی نوێ</span>
              </button>
              <button type="button" (click)="exportTermsJson()" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">download</mat-icon><span>هەناردەکردن</span>
              </button>
            </div>
          </div>

          @if (isAddingNew()) {
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" [(ngModel)]="newKurdishTerm" placeholder="ناوی زاراوە بە کوردی *" class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                <input type="text" [(ngModel)]="newForeignTerm" placeholder="هاوتای ئینگلیزی / لاتینی" class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                <input type="text" [(ngModel)]="newField" placeholder="بواری زانستی" class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
              </div>
              <textarea [(ngModel)]="newDefinition" placeholder="پێناسەی زانستی..." rows="2" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"></textarea>
              <div class="flex justify-end gap-2">
                <button (click)="isAddingNew.set(false)" class="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg cursor-pointer">پاشگەزبوونەوە</button>
                <button (click)="saveNewTerm()" class="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer">پاشەکەوت</button>
              </div>
            </div>
          }

          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            @for (item of filteredTerms(); track item.id) {
              <div class="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-800/50 p-3 rounded-xl transition space-y-1.5">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-emerald-300">{{ item.kurdishTerm }}</span>
                    @if (item.foreignTerm) {
                      <span class="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{{ item.foreignTerm }}</span>
                    }
                    <span class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{{ item.field }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button (click)="insertTermOnly(item)" [disabled]="!activeChapter()" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer">
                      <mat-icon class="!text-xs !w-3 !h-3">add</mat-icon><span>دانان</span>
                    </button>
                    <button (click)="insertWithDefinition(item)" [disabled]="!activeChapter()" class="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                      <mat-icon class="!text-xs !w-3 !h-3">menu_book</mat-icon><span>دانان بە پێناسەوە</span>
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed font-serif">{{ item.definition }}</p>
                @if (item.academicExample) {
                  <div class="text-[11px] text-slate-400 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60 font-serif">
                    <span class="text-emerald-400 font-bold">نموونە: </span>«{{ item.academicExample }}»
                  </div>
                }
              </div>
            } @empty {
              <div class="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">هیچ زاراوەیەک بەپێی ئەم گەڕانە نەدۆزرایەوە.</div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: SCHOLASTIC REFINER -->
      @if (activeTab() === 'refiner') {
        <div class="space-y-3">
          <p class="text-xs text-slate-400">گۆڕینی دەستەواژە باوە ناکۆتاکان بۆ وشەسازیی فەرمی و ئاست‌بەرز لە بەشی چالاکدا:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            @for (mapping of scholasticMappings; track mapping.colloquial) {
              <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">وشەی باو: «{{ mapping.colloquial }}»</span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ mapping.category }}</span>
                </div>
                <p class="text-[11px] text-slate-400">{{ mapping.scholasticContext }}</p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  @for (syn of mapping.highRegisterSynonyms; track syn) {
                    <button type="button" (click)="refineWordInChapter(mapping, syn)" [disabled]="!activeChapter()" class="px-2 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg text-[10.5px] transition cursor-pointer flex items-center gap-1">
                      <mat-icon class="!text-[10px] !w-3 !h-3">swap_horiz</mat-icon><span>{{ syn }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: CONSISTENCY AUDITOR -->
      @if (activeTab() === 'auditor') {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">پشکنینی دێڕبەدێڕی یەکگرتوویی زاراوەکان لە تەواوی بەشەکاندا:</span>
            <button type="button" (click)="runAudit()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">refresh</mat-icon><span>پشکنینی دووبارە</span>
            </button>
          </div>

          @if (auditResult(); as res) {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block">نمرەی یەکگرتوویی</span>
                <span class="text-base font-bold font-mono" [class.text-emerald-400]="res.overallScore >= 80" [class.text-amber-400]="res.overallScore >= 50 && res.overallScore < 80" [class.text-rose-400]="res.overallScore < 50">{{ res.overallScore }}٪</span>
              </div>
              <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block">زاراوەی یەکگرتوو</span>
                <span class="text-base font-bold font-mono text-emerald-400">{{ res.optimalTermsCount }}</span>
              </div>
              <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block">ناڕێکی و هەڵە</span>
                <span class="text-base font-bold font-mono text-rose-400">{{ res.inconsistentCount }}</span>
              </div>
              <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block">بەکارهێنراو لە بەشەکان</span>
                <span class="text-base font-bold font-mono text-cyan-400">{{ res.totalDefinedTerms - res.unusedCount }}</span>
              </div>
            </div>

            @if (res.inconsistentCount > 0) {
              <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                @for (d of res.details; track d.term.id) {
                  @if (d.status === 'inconsistent') {
                    @for (issue of d.issues; track issue.chapterId + issue.matchedText) {
                      <div class="p-2.5 bg-rose-950/20 border border-rose-800/40 rounded-lg text-xs space-y-1">
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="font-bold text-rose-300">بەشی: {{ issue.chapterTitle }}</span>
                          <button type="button" (click)="standardize(issue.chapterId, issue.matchedText, issue.suggestion)" class="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded text-[10px] font-bold cursor-pointer">
                            یەکخستن بۆ «{{ issue.suggestion }}»
                          </button>
                        </div>
                        <p class="text-slate-300 font-serif">«...{{ issue.snippet }}...»</p>
                      </div>
                    }
                  }
                }
              </div>
            } @else {
              <div class="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-center text-xs text-emerald-300">هیچ ناڕێکییەک لە بەکارهێنانی زاراوەکاندا لە بەشەکاندا نەدۆزرایەوە؛ دەقەکە لە ئاستێکی یەکگرتووی باڵادایە.</div>
            }
          }
        </div>
      }
    </div>
  `
})
export class KurdishTerminologyManagerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);
  chapters = input<ChapterItem[]>([]);

  activeTab = signal<'glossary' | 'refiner' | 'auditor'>('glossary');
  terms = signal<AcademicTerm[]>(this.loadTerms());
  searchQuery = signal<string>('');
  selectedField = signal<string>('all');
  isAddingNew = signal<boolean>(false);

  newKurdishTerm = '';
  newForeignTerm = '';
  newField = 'میتۆدۆلۆژیا';
  newDefinition = '';

  scholasticMappings = SCHOLASTIC_DICTIONARY;
  auditResult = signal<TerminologyDocumentAudit | null>(null);

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
      academicExample: ''
    };
    const updated = [item, ...this.terms()];
    this.terms.set(updated);
    this.saveTerms(updated);
    this.newKurdishTerm = '';
    this.newForeignTerm = '';
    this.newDefinition = '';
    this.isAddingNew.set(false);
    this.toastService.showSuccess('زاراوە پاشەکەوت کرا', `زاراوەی «${item.kurdishTerm}» بە سەرکەوتوویی زیاد کرا.`);
  }

  exportTermsJson(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.terms(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'kurdish_academic_terms.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.toastService.showSuccess('هەناردەکردن', 'فایلی زاراوەکان بە فۆرماتی JSON دابەزێنرا.');
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
    const snippet = `\n\n**${item.kurdishTerm}** ${item.foreignTerm ? `(*${item.foreignTerm}*)` : ''}: ${item.definition}\n`;
    const updated = current ? `${current}${snippet}` : snippet.trim();
    this.editorService.updateChapterContent(ch.id, updated, 'دانانی پێناسەی زاراوە');
    this.toastService.showSuccess('دانرا', `پێناسەی «${item.kurdishTerm}» خرایە ناو بەشەکەوە.`);
  }

  refineWordInChapter(mapping: ScholasticWordMapping, selectedReplacement: string): void {
    const ch = this.activeChapter();
    if (!ch || !ch.content) return;
    const regex = new RegExp(`\\b${mapping.colloquial}\\b`, 'gu');
    if (!regex.test(ch.content)) {
      this.toastService.showWarning('پاڵاوتن', `وشەی «${mapping.colloquial}» لە بەشی چالاکدا نەدۆزرایەوە.`);
      return;
    }
    const updated = ch.content.replace(regex, selectedReplacement);
    this.editorService.updateChapterContent(ch.id, updated, `پاڵاوتنی دەستەواژەی «${mapping.colloquial}» بۆ «${selectedReplacement}»`);
    this.toastService.showSuccess('پاڵاوتن ئەنجامدرا', `«${mapping.colloquial}» گۆڕدرا بۆ «${selectedReplacement}».`);
  }

  runAudit(): void {
    const allChapters = this.chapters().length > 0 ? this.chapters() : (this.activeChapter() ? [this.activeChapter()!] : this.editorService.chapters());
    const auditorTerms: AuditorTerm[] = this.terms().map(t => ({
      id: t.id,
      kurdishTerm: t.kurdishTerm,
      foreignTerm: t.foreignTerm,
      field: t.field,
      definition: t.definition,
      academicExample: t.academicExample,
      source: t.source
    }));
    const res = auditDocumentTerminology(auditorTerms, allChapters);
    this.auditResult.set(res);
  }

  standardize(chapterId: number, oldText: string, standardText: string): void {
    const allChapters = this.chapters().length > 0 ? this.chapters() : this.editorService.chapters();
    const target = allChapters.find(c => c.id === chapterId);
    if (!target) return;
    const termObj: AuditorTerm = {
      id: 'term-std',
      kurdishTerm: standardText,
      foreignTerm: '',
      field: 'گشتی',
      definition: '',
      academicExample: '',
      colloquialVariants: [oldText]
    };
    const { updatedChapters, replacementsCount } = standardizeTermAcrossChapters(termObj, allChapters);
    const updatedTarget = updatedChapters.find(c => c.id === chapterId);
    if (updatedTarget) {
      this.editorService.updateChapterContent(chapterId, updatedTarget.content || '', `یەکخستنی زاراوەی «${oldText}» بۆ «${standardText}»`);
    }
    this.toastService.showSuccess('یەکخرا', `زاراوەکە لە بەشی «${target.title}» نوێکرایەوە (${replacementsCount} شوێن).`);
    this.runAudit();
  }
}

// Seamless aliases for backwards compatibility
export { KurdishTerminologyManagerComponent as AcademicTerminologyManagerComponent };
export { KurdishTerminologyManagerComponent as KurdishTerminologyRefinerComponent };
export { KurdishTerminologyManagerComponent as TerminologyConsistencyAuditorComponent };
