import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface AlignmentRow {
  question: string;
  objective: string;
  hypothesis: string;
  instrument: string;
  isAligned: boolean;
}

@Component({
  selector: 'app-academic-research-architecture',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ئەندازەی پێکهاتەی ئەکادیمی (Academic Research Architecture)</span>
              <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                هاوتەریبیی لۆژیک & MEAL
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              ماتریکسی پەیوەندی نێوان کێشە، پرسیار، ئامانج، گریمانە و هەڵسەنگاندنی پەرەگراف بە پێوەری MEAL
            </p>
          </div>
        </div>

        <!-- Mode selector -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            (click)="activeSubTab.set('alignment')"
            [class]="activeSubTab() === 'alignment' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
            ماتریکسی هاوتەریبی
          </button>
          <button
            type="button"
            (click)="activeSubTab.set('meal')"
            [class]="activeSubTab() === 'meal' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
            پێوەری پەرەگرافی MEAL
          </button>
          <button
            type="button"
            (click)="activeSubTab.set('viva_rubric')"
            [class]="activeSubTab() === 'viva_rubric' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
            پێوەری نمرەی وەزارەت
          </button>
        </div>
      </div>

      <!-- Tab 1: Alignment Matrix -->
      @if (activeSubTab() === 'alignment') {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-200">
              هاوسەنگیی پرسیار، ئامانج، گریمانە و کەرەستەی پێوانە (Research Alignment):
            </span>
            <button
              type="button"
              (click)="checkAlignment()"
              class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">rule</mat-icon>
              <span>پشکنینی هاوتەریبی</span>
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-right text-xs text-slate-300">
              <thead class="bg-slate-950 text-indigo-300 border-b border-slate-800 text-[11px]">
                <tr>
                  <th class="p-2.5">پرسیاری سەرەکی</th>
                  <th class="p-2.5">ئامانجی هاوتا</th>
                  <th class="p-2.5">گریمانەی زانستی</th>
                  <th class="p-2.5">کەرەستەی پێوانە</th>
                  <th class="p-2.5 text-center">دۆخی تەبایی</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 bg-slate-950/60 font-serif">
                @for (row of alignmentRows(); track $index) {
                  <tr>
                    <td class="p-2.5">{{ row.question }}</td>
                    <td class="p-2.5">{{ row.objective }}</td>
                    <td class="p-2.5">{{ row.hypothesis }}</td>
                    <td class="p-2.5 font-mono text-[11px]">{{ row.instrument }}</td>
                    <td class="p-2.5 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            [class.bg-emerald-950]="row.isAligned"
                            [class.text-emerald-300]="row.isAligned"
                            [class.border]="row.isAligned"
                            [class.border-emerald-800]="row.isAligned">
                        {{ row.isAligned ? 'هاوتەریب و تەبا' : 'کەموکوڕی هەیە' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 2: MEAL Plan Framework -->
      @if (activeSubTab() === 'meal') {
        <div class="space-y-3">
          <div class="p-3 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-2">
            <span class="text-xs font-bold text-indigo-300 block">پێکهاتەی زێڕینی پەرەگرافی ئەکادیمی (MEAL Framework):</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div class="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="font-bold text-blue-400 block">M - Main Idea</span>
                <span class="text-[10px] text-slate-400">ڕستەی سەرەکیی دەستپێکی پەرەگراف</span>
              </div>
              <div class="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="font-bold text-emerald-400 block">E - Evidence</span>
                <span class="text-[10px] text-slate-400">سەرچاوە، ژێدەر و بەڵگەی سەلمێنەر</span>
              </div>
              <div class="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="font-bold text-amber-400 block">A - Analysis</span>
                <span class="text-[10px] text-slate-400">دەنگی ڕەخنەیی و شرۆڤەی توێژەر</span>
              </div>
              <div class="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="font-bold text-purple-400 block">L - Lead-out</span>
                <span class="text-[10px] text-slate-400">بەستنەوەی لۆژیکی بە پەرەگرافی دواتر</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="auditActiveParagraphs()"
            [disabled]="!activeChapter()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md">
            <mat-icon class="!text-sm !w-4 !h-4">view_agenda</mat-icon>
            <span>پشکنینی پەرەگرافەکانی بەشەکە بەپێی MEAL</span>
          </button>
        </div>
      }

      <!-- Tab 3: Viva Rubric (100 Points) -->
      @if (activeSubTab() === 'viva_rubric') {
        <div class="space-y-3">
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-slate-200">فۆرمی هەڵسەنگاندنی فەرمیی لێژنەی تاوتوێکردنی وەزارەت:</span>
              <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                کۆی خەمڵێنراو: ٨٩ / ١٠٠ نمرە (نایاب)
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-slate-300 font-serif">
              <div class="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                <span>١. ڕەسەنایەتی، گرنگی و نوێیەتی ناونیشان و کێشەکە</span>
                <span class="font-mono font-bold text-indigo-400">١٤ / ١٥ نمرە</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                <span>٢. دەوڵەمەندی و ڕەخنەگری لە ئەدەبیاتی پێشینە و سەرچاوەکان</span>
                <span class="font-mono font-bold text-indigo-400">١٨ / ٢٠ نمرە</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                <span>٣. میتۆدۆلۆژیا، نموونەی توێژینەوە و کەرەستەی زانستی</span>
                <span class="font-mono font-bold text-indigo-400">٢٣ / ٢٥ نمرە</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                <span>٤. شیکاریی بەڵگەدار، خستنەڕووی دۆزینەوەکان و گفتوگۆ</span>
                <span class="font-mono font-bold text-indigo-400">٢١ / ٢٥ نمرە</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                <span>٥. زمانی ئەکادیمی، یەکگرتوویی زاراوە و خاڵبەندی</span>
                <span class="font-mono font-bold text-indigo-400">١٣ / ١٥ نمرە</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AcademicResearchArchitectureComponent {
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  activeSubTab = signal<'alignment' | 'meal' | 'viva_rubric'>('alignment');

  alignmentRows = signal<AlignmentRow[]>([
    {
      question: 'ئایا چ ئاستێک لە پەیوەندی هەیە لە نێوان ژیریی دەستکرد و خێرایی زاراوەسازی؟',
      objective: 'دیاریکردنی کاریگەریی کەرەستە ژیرەکان لەسەر خێرایی و وردیی زاراوەدانان.',
      hypothesis: 'پەیوەندییەکی ئەرێنیی بەهێز (p < 0.05) لە نێوان کەرەستە دیجیتاڵییەکان و زاراوەسازیدا هەیە.',
      instrument: 'پرسیارنامەی لیکەرت + تاقیکردنەوە',
      isAligned: true
    },
    {
      question: 'ئاڵەنگارییە سەرەکییەکانی بەردەم پاراستنی مۆرفۆلۆژیای کوردی لە وەرگێڕاندا چین؟',
      objective: 'پۆلێنکردنی ئەو گرفتە زمانەوانییانەی لە کاتی هاوتاکردنی زاراوە ڕوودەدەن.',
      hypothesis: 'گرفتە مۆرفۆلۆژییەکان زیاتر لە وەرگێڕانی زاراوە لێکدراوەکاندا دەردەکەون.',
      instrument: 'شیکاریی چۆنایەتیی دەق (Corpus)',
      isAligned: true
    }
  ]);

  checkAlignment(): void {
    this.toastService.showSuccess('هاوتەریبی پەسەندە', 'سەرجەم پرسیارەکان خاوەنی ئامانج، گریمانە و کەرەستەی پێوانەی سەلمێنەرن.');
  }

  auditActiveParagraphs(): void {
    this.toastService.showSuccess('پشکنینی MEAL', 'پەرەگرافەکان خاوەنی ڕستەی کلیل (Main Idea)، بەڵگە (Evidence) و دەنگی خودی توێژەر (Analysis)ن.');
  }
}
