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

export interface CommitteeMemberFeedback {
  name: string;
  role: string;
  avatar: string;
  grade: number;
  decisionStatus: 'پەسەندکرا بە ئەنجامی نایاب' | 'پەسەندکرا بە چاکسازیی بچووک' | 'پێویستی بە پێداچوونەوەی دووبارەیە';
  gradientBg: string;
  feedbackText: string;
  recommendations: string[];
}

const DEFAULT_DEFENSE_QUESTIONS: DefenseQuestion[] = [
  {
    id: 'q-1',
    examinerRole: 'external',
    roleTitleKurdish: 'ناوبژیوانی دەرەکی (External Examiner)',
    questionKurdish: 'بۆچی ئەم میتۆدە دیاریکراوەت لە جیاتی میتۆدی هاوتا هەڵبژارد، و چۆن دڵنیا بوویت لە کەمکردنەوەی لایەنگری (Bias)؟',
    questionCategory: 'میتۆدۆلۆژیا و دیزاین',
    purpose: 'تاقیکردنەوەی شەرعیەتدان بە هەڵبژاردنی میتۆد و دوورکەوتنەوە لە پەسەندکردنی کوێرانە.',
    recommendedResponseGuide: 'وەڵامەکە لەسەر سێگۆشەسازیی زانیاری (Triangulation) بنیاد بنێ؛ ئاماژە بە سنووردارێتییەکان بکە.',
    scoringCriteria: ['ڕوونکردنەوەی فەلسەفەی میتۆد', 'ئاماژەدان بە سنووردارێتی داتا', 'ئارامی و متمانە بەخۆبوون']
  },
  {
    id: 'q-2',
    examinerRole: 'internal',
    roleTitleKurdish: 'ئەندامی لێژنەی ناوخۆ (Internal Examiner)',
    questionKurdish: 'زیادکردنی نوێی (Original Contribution) ئەم توێژینەوەیە چییە کە ئەدەبیاتی پێشوو نەیانبووە؟',
    questionCategory: 'ڕەسەنایەتی و بۆشایی زانستی',
    purpose: 'دەرخستنی بەهای زانستیی نامەکە و دڵنیابوون لەوەی کاری دووبارەکراوە نییە.',
    recommendedResponseGuide: 'بە دیاریکراوی تیشک بخەرە سەر ئەو بۆشاییە زانستییەی (Literature Gap) کە دەستنیشانت کردووە.',
    scoringCriteria: ['دیاریکردنی خاڵی نوێگەری', 'بەستنەوە بە ئەدەبیاتی پێشوو', 'ڕاستگۆیی ئەکادیمی']
  },
  {
    id: 'q-3',
    examinerRole: 'chair',
    roleTitleKurdish: 'سەرۆکی لێژنەی تاوتوێکردن (Committee Chair)',
    questionKurdish: 'ئەگەر دەرفەت هەبێت جارێکی تر ئەم توێژینەوەیە ئەنجام بدەیتەوە، چ شتێک بە شێوازێکی جیاواز دەکەیت؟',
    questionCategory: 'هەڵسەنگاندنی ڕەخنەگرانە و ئایندەیی',
    purpose: 'پێوانەی ڕادەی پێگەیشتنی ئەکادیمی و داننان بەو ئاستەنگانەی هاتوونەتە پێش.',
    recommendedResponseGuide: 'باس لە فراوانکردنی قەبارەی نموونە یان بەکارهێنانی کەرەستەی ئەلیکترۆنیی نوێ بکە.',
    scoringCriteria: ['دانپێدانانی زانستی بە کەمکوڕییەکان', 'پێشنیاری داهاتووانە بۆ توێژەران']
  },
  {
    id: 'q-4',
    examinerRole: 'methodologist',
    roleTitleKurdish: 'شارەزای ئامار و پێوانە (Statistician)',
    questionKurdish: 'ئاستی جێگیریی کەرەستەکەت (Cronbach Alpha) چۆن بوو و چۆن وەڵامی داتای ونبووت دایەوە؟',
    questionCategory: 'شیکاریی ئاماری و داتا',
    purpose: 'تاقیکردنەوەی ئاگاداریی توێژەر لە شیکارییە ئامارییەکان.',
    recommendedResponseGuide: 'ڕێژەی ئەلفا (سەروو ٠.٧٠) بخەرەڕوو، باسی خاوێنکردنەوەی داتا (Data Screening) بکە.',
    scoringCriteria: ['شارەزایی لە پێوەرە ئامارییەکان', 'پابەندبوون بە مەرجی شیکار']
  }
];

const INITIAL_COMMITTEE_FEEDBACK: CommitteeMemberFeedback[] = [
  {
    name: 'پ. د. ئاریان محەمەد کەرۆخی',
    role: 'سەرۆکی لێژنەی هەڵسەنگاندن و سەرپەرشتیاری ئەکادیمی',
    avatar: '👨‍🏫',
    grade: 95,
    decisionStatus: 'پەسەندکرا بە ئەنجامی نایاب',
    gradientBg: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
    feedbackText: 'توێژینەوەکە خاوەنی نوێکاریی بەرز (High Novelty) و مێتۆدۆلۆژییەکی ئاستبەرزی زانستییە. بونیادی داڕشتنەکە بە تەواوی هاوتای پێوەری زانکۆ ڕەسەنەکانە.',
    recommendations: ['پێداچوونەوە بە هاوڕێکردنی زاراوە بیانییەکان لە کەوانەدا بکەرەوە.', 'زیادکردنی خشتەی بەراوردکاری تیۆرییەکان لە بەشی دووەمدا.']
  },
  {
    name: 'پ. ی. د. نەسرین عومەر حەمەد',
    role: 'ئەندامی لێژنە و هەڵسەنگێنەری دەرەکی',
    avatar: '👩‍🏫',
    grade: 92,
    decisionStatus: 'پەسەندکرا بە چاکسازیی بچووک',
    gradientBg: 'bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950',
    feedbackText: 'شیکاری داتا ئامارییەکان و دەرهێنانی دەرئەنجامەکان زۆر بەهێزە. توێژەر توانایەکی زۆر باشی هەبوو لە وەڵامدانەوەی پرسیارە وردەکاندا.',
    recommendations: ['ڕێکخستنی سەرچاوەکان بە شێوازی پێوەردار لە کۆتایی تێزەکەدا.', 'زیادکردنی وێنەی ڕوونکەرەوە لە لاپەڕەکانی پاشکۆدا.']
  },
  {
    name: 'د. ڕێبین سەڵاحەدین',
    role: 'ئەندامی لێژنە و شارەزای زمانەوانی زانستی',
    avatar: '👨‍🔬',
    grade: 92,
    decisionStatus: 'پەسەندکرا بە ئەنجامی نایاب',
    gradientBg: 'bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950',
    feedbackText: 'زمان و داڕشتنی سۆرانی پێوەر زۆر پاراو و ڕەوانە. هیچ ڕستەیەکی ڕۆژانەی تێدا بەکارنەهاتووە و ڕێزمانی ئەکادیمی بە تەواوی ڕەچاوکراوە.',
    recommendations: ['ڕاستکردنەوەی جێبەجێکردنی نەخشەی زاراوەکان.', 'ئامادەکردنی پوختەی ئینگلیزی (Abstract) بۆ بڵاوکردنەوەی نێودەوڵەتی.']
  }
];

@Component({
  selector: 'app-thesis-defense-simulator, app-viva-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">gavel</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>تاقیکردنەوەی ئەزموونیی بەرگری و سیمیولەیشنی ڤیڤا (Viva Voce Defense)</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">
                لێژنەی تاوتوێکردن
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              ئامادەکاریی پێشوەختە بۆ وەڵامدانەوەی پرسیارە ئاڵۆزەکانی لیژنە و پێداچوونەوەی بڕیاری فەرمیی کۆمیتە.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button type="button" (click)="activeView.set('questions')" [class.bg-purple-600]="activeView() === 'questions'" [class.text-white]="activeView() === 'questions'" [class.text-slate-400]="activeView() !== 'questions'" class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">quiz</mat-icon><span>پرسیارەکان</span>
            </button>
            <button type="button" (click)="activeView.set('committee')" [class.bg-purple-600]="activeView() === 'committee'" [class.text-white]="activeView() === 'committee'" [class.text-slate-400]="activeView() !== 'committee'" class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">verified</mat-icon><span>بڕیاری لێژنە</span>
            </button>
          </div>
          <button type="button" (click)="generateCustomQuestion()" class="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">psychology</mat-icon><span>پرسیاری نوێ لە بەشەکان</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">کۆی پرسیارەکان</span>
          <span class="text-lg font-bold font-mono text-purple-400">{{ questions().length }}</span>
        </div>
        <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">وەڵامدراوەکان</span>
          <span class="text-lg font-bold font-mono text-cyan-400">{{ answeredCount() }}</span>
        </div>
        <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">نمرەی ئامادەیی</span>
          <span class="text-lg font-bold font-mono text-emerald-400">{{ readinessScore() }}٪</span>
        </div>
        <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <span class="text-[10px] text-slate-400 block">ئەنجامی تێکڕا</span>
          <span class="text-xs font-bold text-emerald-300 block mt-1">93 / 100 (ممتاز - A)</span>
        </div>
      </div>

      <!-- VIEW 1: QUESTIONS & PREPARATION -->
      @if (activeView() === 'questions') {
        <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
          @for (q of questions(); track q.id; let idx = $index) {
            <div class="p-3.5 rounded-xl border border-slate-800 hover:border-purple-800/60 transition bg-slate-950/80 space-y-2">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-purple-900/60 text-purple-200 text-[10px] font-bold flex items-center justify-center font-mono">{{ idx + 1 }}</span>
                  <span class="text-xs font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">{{ q.roleTitleKurdish }}</span>
                  <span class="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{{ q.questionCategory }}</span>
                </div>
                <button type="button" (click)="toggleActive(q.id)" class="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer flex items-center gap-1">
                  <span>{{ expandedId() === q.id ? 'داخستن' : 'ڕێنوێنی و ستراتیژ' }}</span>
                  <mat-icon class="!text-xs !w-3.5 !h-3.5">{{ expandedId() === q.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </div>

              <h4 class="text-xs font-bold text-slate-100 leading-relaxed font-serif">«{{ q.questionKurdish }}»</h4>
              <p class="text-[11px] text-slate-400 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
                <strong class="text-slate-300">ئامانجی پرسیار: </strong>{{ q.purpose }}
              </p>

              @if (expandedId() === q.id) {
                <div class="p-3 bg-purple-950/20 rounded-xl border border-purple-900/40 text-xs space-y-2">
                  <div>
                    <strong class="text-purple-300 block mb-0.5 font-bold">ستراتیژیی پێشنیارکراوی وەڵامدانەوە:</strong>
                    <p class="text-slate-300 leading-relaxed font-serif">{{ q.recommendedResponseGuide }}</p>
                  </div>
                  <div>
                    <strong class="text-purple-300 block mb-0.5 font-bold">پێوەرەکانی نمرەدان:</strong>
                    <div class="flex flex-wrap gap-1.5">
                      @for (criterion of q.scoringCriteria; track criterion) {
                        <span class="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded">✓ {{ criterion }}</span>
                      }
                    </div>
                  </div>
                  <div class="pt-2 flex items-center justify-between border-t border-purple-900/30">
                    <span class="text-[10px] text-slate-400">ئایا ئامادەیت بۆ وەڵامدانەوە؟</span>
                    <button type="button" (click)="markAnswered(q.id)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition">
                      وەڵامەکەم ئامادە کرد
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- VIEW 2: COMMITTEE OFFICIAL DECISIONS & FEEDBACK -->
      @if (activeView() === 'committee') {
        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (m of committeeFeedback(); track m.name) {
              <div [class]="m.gradientBg" class="p-3.5 rounded-2xl border border-slate-800/80 shadow-xl space-y-2.5 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                    <div class="w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-sm font-bold">{{ m.avatar }}</div>
                    <div>
                      <h5 class="text-xs font-bold text-slate-100">{{ m.name }}</h5>
                      <p class="text-[9.5px] text-slate-300">{{ m.role }}</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[10px]">
                    <span class="px-2 py-0.5 rounded-full border bg-slate-950/80 text-emerald-300 border-emerald-800/80 font-bold flex items-center gap-1">
                      <mat-icon class="!text-[10px] !w-3 !h-3 text-emerald-400">check_circle</mat-icon>{{ m.decisionStatus }}
                    </span>
                    <span class="font-mono font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">نمرە: {{ m.grade }}/100</span>
                  </div>

                  <p class="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-white/5 font-serif">"{{ m.feedbackText }}"</p>

                  <div class="space-y-1">
                    <span class="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                      <mat-icon class="!text-[10px] !w-3 !h-3 text-indigo-400">playlist_add_check</mat-icon>تێبینییەکان:
                    </span>
                    <ul class="space-y-0.5 pr-1">
                      @for (rec of m.recommendations; track rec) {
                        <li class="text-[9.5px] text-slate-300 flex items-start gap-1"><span class="text-cyan-400 font-bold">•</span><span>{{ rec }}</span></li>
                      }
                    </ul>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                  <span>بڕیاری پاسادان: پەسەندکراو</span>
                  <span class="text-cyan-300 font-semibold">ئیمزاکراوە ✍️</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ThesisDefenseSimulatorComponent {
  chapters = input<ChapterItem[]>([]);
  private notifications = inject(AppNotificationsService);

  activeView = signal<'questions' | 'committee'>('questions');
  questions = signal<DefenseQuestion[]>(DEFAULT_DEFENSE_QUESTIONS);
  expandedId = signal<string | null>('q-1');
  answeredIds = signal<Set<string>>(new Set());
  committeeFeedback = signal<CommitteeMemberFeedback[]>(INITIAL_COMMITTEE_FEEDBACK);

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

// Backwards-compatible alias
export { ThesisDefenseSimulatorComponent as VivaSimulationComponent };
