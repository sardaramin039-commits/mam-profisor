import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface DefenseQuestion {
  id: string;
  examinerRole: 'chair' | 'external' | 'internal' | 'methodologist';
  roleTitleKurdish: string;
  questionKurdish: string;
  questionCategory: string;
  purpose: string;
  recommendedResponseGuide: string;
  scoringCriteria: string[];
}

const DEFAULT_DEFENSE_QUESTIONS: DefenseQuestion[] = [
  {
    id: 'q-1',
    examinerRole: 'external',
    roleTitleKurdish: 'ناوبژیوانی دەرەکی (External Examiner)',
    questionKurdish: 'بۆچی ئەم میتۆدە دیاریکراوەت لە جیاتی میتۆدی هاوتا هەڵبژارد، و چۆن دڵنیا بوویت لە کەمکردنەوەی لایەنگری (Bias)؟',
    questionCategory: 'میتۆدۆلۆژیا و دیزاین (Methodology & Design)',
    purpose: 'تاقیکردنەوەی ئاستی زانستیی توێژەر لە شەرعیەتدان بە هەڵبژاردنی میتۆد و دوورکەوتنەوە لە پەسەندکردنی کوێرانە.',
    recommendedResponseGuide: 'وەڵامەکە لەسەر سێگۆشەسازیی زانیاری (Triangulation) بنیاد بنێ؛ ئاماژە بە سنووردارێتییەکانی لێکۆڵینەوە بکە و ڕوونی بکەرەوە کە چۆن داتای چەندایەتی و چۆنایەتی یەکتریان تەواو کردووە.',
    scoringCriteria: ['ڕوونکردنەوەی فەلسەفەی میتۆد', 'ئاماژەدان بە سنووردارێتی داتا', 'ئارامی و متمانە بەخۆبوون']
  },
  {
    id: 'q-2',
    examinerRole: 'internal',
    roleTitleKurdish: 'ئەندامی لێژنەی ناوخۆ (Internal Examiner)',
    questionKurdish: 'زیادکردنی نوێی (Original Contribution) ئەم توێژینەوەیە چییە کە ئەدەبیاتی پێشوو نەیانبووە؟',
    questionCategory: 'ڕەسەنایەتی و بۆشایی زانستی (Originality & Gap)',
    purpose: 'دەرخستنی بەهای زانستیی نامەکە و دڵنیابوون لەوەی کاری دووبارەکراوە نییە.',
    recommendedResponseGuide: 'بە دیاریکراوی تیشک بخەرە سەر ئەو بۆشاییە زانستییەی (Literature Gap) کە لە بەشی دووەمدا دیاریت کردبوو، و دەستکەوتە نوێیە مەیدانی یان تیۆرییەکان بە ژمارە یان بەڵگە بخەرەڕوو.',
    scoringCriteria: ['دیاریکردنی ڕوونی خاڵی نوێگەری', 'بەستنەوە بە ئەدەبیاتی پێشوو', 'ڕاستگۆیی ئەکادیمی']
  },
  {
    id: 'q-3',
    examinerRole: 'chair',
    roleTitleKurdish: 'سەرۆکی لێژنەی تاوتوێکردن (Committee Chair)',
    questionKurdish: 'ئەگەر دەرفەت هەبێت جارێکی تر ئەم توێژینەوەیە ئەنجام بدەیتەوە، چ شتێک بە شێوازێکی جیاواز دەکەیت؟',
    questionCategory: 'هەڵسەنگاندنی ڕەخنەگرانە و ئایندەیی (Critical Reflection)',
    purpose: 'پێوانەی ڕادەی پێگەیشتنی ئەکادیمی و داننان بەو ئاستەنگانەی لە کاتی مەیدانیدا هاتوونەتە پێش.',
    recommendedResponseGuide: 'هەرگیز مەڵێ "هیچ شتێک ناگۆڕم"؛ باس لە فراوانکردنی قەبارەی نموونە، درێژکردنەوەی ماوەی چاودێری، یان بەکارهێنانی کەرەستەی ئەلیکترۆنیی سەردەمیانە بکە.',
    scoringCriteria: ['دانپێدانانی زانستی بە کەمکوڕییەکان', 'پێشنیاری داهاتووانە بۆ توێژەران']
  },
  {
    id: 'q-4',
    examinerRole: 'methodologist',
    roleTitleKurdish: 'شارەزای ئامار و پێوانە (Statistician / Methodologist)',
    questionKurdish: 'ئاستی جێگیریی کەرەستەکەت (Cronbach Alpha) چۆن بوو و چۆن وەڵامی داتای ونبوو (Missing Data)ت دایەوە؟',
    questionCategory: 'شیکاریی ئاماری و داتا (Data & Reliability)',
    purpose: 'تاقیکردنەوەی ئاگاداریی توێژەر لە شیکارییە ئامارییەکان و بەستنەوەی هاوکێشەکان بە واقیعەوە.',
    recommendedResponseGuide: 'ڕێژەی ئەلفا (سەروو ٠.٧٠) بخەرەڕوو، باسی خاوێنکردنەوەی داتا (Data Screening) و شێوازی قەرەبووکردنەوە یان لادانی داتای پڕنەکراوە بکە بە بەڵگەی سەلمێنراو.',
    scoringCriteria: ['شارەزایی لە پێوەرە ئامارییەکان', 'پابەندبوون بە مەرجی شیکار']
  }
];

@Component({
  selector: 'app-thesis-defense-simulator',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <mat-icon>school</mat-icon>
            </span>
            <h3 class="text-xl font-bold text-stone-900">تاقیکردنەوەی ئەزموونیی بەرگریی تێز (Viva Voce Defense Simulator)</h3>
          </div>
          <p class="text-xs md:text-sm text-stone-600 mt-1 leading-relaxed">
            ڕاهێنانی پێشوەختە لەسەر پرسیارە ئاڵۆز و هەستیارەکانی لێژنەی تاوتوێکردن (سەرۆکی لێژنە، ناوبژیوانی دەرەکی، ناوخۆ و میتۆدۆلۆژیست).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="generateCustomQuestion()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm">
            <mat-icon class="text-sm">psychology</mat-icon>
            <span>پرسیاری چاوەڕوانکراوی بەشەکان</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500 font-medium">کۆی پرسیارەکان</span>
          <p class="text-lg font-bold text-stone-900 mt-0.5">{{ questions().length }}</p>
        </div>
        <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
          <span class="text-[11px] text-indigo-800 font-medium">وەڵامدراوەکان</span>
          <p class="text-lg font-bold text-indigo-900 mt-0.5">{{ answeredCount() }}</p>
        </div>
        <div class="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <span class="text-[11px] text-emerald-800 font-medium">نمرەی ئامادەیی</span>
          <p class="text-lg font-bold text-emerald-900 mt-0.5">{{ readinessScore() }}٪</p>
        </div>
        <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
          <span class="text-[11px] text-amber-800 font-medium">ئاستی دڵنیایی</span>
          <p class="text-lg font-bold text-amber-900 mt-0.5">بەرز (High)</p>
        </div>
      </div>

      <!-- Questions List -->
      <div class="space-y-4">
        @for (q of questions(); track q.id; let idx = $index) {
          <div class="p-4 rounded-xl border border-stone-200 hover:border-indigo-200 transition bg-white shadow-2xs space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  {{ q.roleTitleKurdish }}
                </span>
                <span class="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {{ q.questionCategory }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="toggleActive(q.id)"
                  class="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer flex items-center gap-1">
                  <span>{{ expandedId() === q.id ? 'داخستنی شیکار' : 'ڕێنوێنیی وەڵامدانەوە' }}</span>
                  <mat-icon class="text-xs">{{ expandedId() === q.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Question Text -->
            <h4 class="text-sm font-bold text-stone-900 leading-relaxed">
              «{{ q.questionKurdish }}»
            </h4>

            <p class="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <strong class="text-stone-800">ئامانجی لیژنە لەم پرسیارە: </strong>
              <span>{{ q.purpose }}</span>
            </p>

            <!-- Expanded Details -->
            @if (expandedId() === q.id) {
              <div class="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-2.5">
                <div>
                  <strong class="text-indigo-950 font-bold block mb-1">ستراتیژیی پێشنیارکراوی وەڵامدانەوە:</strong>
                  <p class="text-stone-700 leading-relaxed">{{ q.recommendedResponseGuide }}</p>
                </div>

                <div>
                  <strong class="text-indigo-950 font-bold block mb-1">پێوەرەکانی نمرەدان بە توێژەر:</strong>
                  <ul class="list-disc list-inside space-y-0.5 text-stone-600">
                    @for (criterion of q.scoringCriteria; track criterion) {
                      <li>{{ criterion }}</li>
                    }
                  </ul>
                </div>

                <div class="pt-2 flex items-center justify-between border-t border-indigo-100">
                  <span class="text-[11px] text-stone-500">خۆت هەڵبسەنگێنە:</span>
                  <button
                    type="button"
                    (click)="markAnswered(q.id)"
                    class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer transition">
                    وەڵامەکەم ئامادە کرد
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ThesisDefenseSimulatorComponent {
  chapters = input<ChapterItem[]>([]);
  private notifications = inject(AppNotificationsService);

  questions = signal<DefenseQuestion[]>(DEFAULT_DEFENSE_QUESTIONS);
  expandedId = signal<string | null>('q-1');
  answeredIds = signal<Set<string>>(new Set());

  answeredCount = computed(() => this.answeredIds().size);
  readinessScore = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  });

  toggleActive(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  markAnswered(id: string) {
    const next = new Set(this.answeredIds());
    next.add(id);
    this.answeredIds.set(next);
    this.notifications.showSuccess('تەواو کرا', 'وەڵامەکە وەک ئامادەکراو تۆمار کرا.');
  }

  generateCustomQuestion() {
    const currentChapters = this.chapters();
    const title = currentChapters.length > 0 ? currentChapters[0].title : 'تێزی ئەکادیمی';
    const newQ: DefenseQuestion = {
      id: `q-dynamic-${Date.now()}`,
      examinerRole: 'external',
      roleTitleKurdish: 'پرسیاری دەرهێنراو لە تێزەکەت',
      questionKurdish: `بەپێی بەشی «${title}»، چۆن دڵنیا بوویت لە ڕەسەنایەتیی داتاکانت و چۆن وەڵامی ڕەخنەی ناهاوسەنگیی نموونە دەدەیتەوە؟`,
      questionCategory: 'شیکاریی تایبەت بە دەستنووس',
      purpose: 'تاقیکردنەوەی خێرای پەیوەندیی نێوان تیۆری و داتای بەشەکان.',
      recommendedResponseGuide: 'پشتیوانی لە داتاکەت بکە بە بەڵگەی دەنگنووس و ڕێژەی بەشداری لە پرسیارنامەکە.',
      scoringCriteria: ['پشتڕاستکردنەوەی بەڵگەکان', 'ڕوونکردنەوەی کاتی کۆکردنەوەی داتا']
    };
    this.questions.update(list => [newQ, ...list]);
    this.expandedId.set(newQ.id);
    this.notifications.showSuccess('پرسیاری نوێ', 'پرسیارێکی نوێ بەپێی بەشەکانی تێزەکەت زیاد کرا.');
  }
}
