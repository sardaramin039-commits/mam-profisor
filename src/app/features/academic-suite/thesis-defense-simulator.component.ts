import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { GeminiSseStreamService } from '../../services/gemini-sse.service';

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
          <button type="button" (click)="generateCustomQuestion()" [disabled]="isGeneratingQuestion()" class="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">{{ isGeneratingQuestion() ? 'hourglass_top' : 'psychology' }}</mat-icon><span>{{ isGeneratingQuestion() ? 'پرسیارەکە ئامادە دەکرێت...' : 'پرسیاری نوێ لە بەشەکان' }}</span>
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
                  <div class="pt-2 flex items-center justify-between border-t border-purple-900/30 flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="toggleRecordVivaAnswer(q)"
                        [disabled]="isEvaluatingViva() && recordingQuestionId() !== q.id"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md"
                        [ngClass]="{
                          'bg-rose-600 text-white hover:bg-rose-500 animate-pulse': recordingQuestionId() === q.id,
                          'bg-indigo-600 hover:bg-indigo-500 text-white': recordingQuestionId() !== q.id
                        }">
                        <mat-icon class="!text-xs !w-4 !h-4">{{ recordingQuestionId() === q.id ? 'stop' : 'mic' }}</mat-icon>
                        <span>{{ recordingQuestionId() === q.id ? 'ڕاگرتن و هەڵسەنگاندن' : 'وەڵامدانەوە بە دەنگ (Gemini Viva Audio)' }}</span>
                      </button>

                      @if (recordingQuestionId() === q.id && isEvaluatingViva()) {
                        <span class="text-[10px] text-amber-300 font-serif flex items-center gap-1 animate-pulse">
                          <mat-icon class="!text-[12px] animate-spin">autorenew</mat-icon>
                          لێژنە گوێ لە وەڵامە دەنگییەکەت دەگرێت...
                        </span>
                      }
                    </div>

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
  private geminiSse = inject(GeminiSseStreamService);

  activeView = signal<'questions' | 'committee'>('questions');
  questions = signal<DefenseQuestion[]>(DEFAULT_DEFENSE_QUESTIONS);
  expandedId = signal<string | null>('q-1');
  answeredIds = signal<Set<string>>(new Set());
  committeeFeedback = signal<CommitteeMemberFeedback[]>(INITIAL_COMMITTEE_FEEDBACK);

  recordingQuestionId = signal<string | null>(null);
  isEvaluatingViva = signal<boolean>(false);
  isGeneratingQuestion = signal<boolean>(false);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

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

  async toggleRecordVivaAnswer(q: DefenseQuestion): Promise<void> {
    if (this.recordingQuestionId() === q.id) {
      await this.stopRecordingViva(q);
    } else {
      await this.startRecordingViva(q);
    }
  }

  private async startRecordingViva(q: DefenseQuestion): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.notifications.showError('مایکرۆفۆن', 'مایکرۆفۆن لەم وێبگەڕەدا پشتگیری ناکرێت.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        await this.evaluateSpokenViva(audioBlob, mimeType, q);
      };

      this.mediaRecorder.start();
      this.recordingQuestionId.set(q.id);
      this.notifications.showSuccess('تۆمارکردنی دەنگ', 'تۆمارکردنی دەنگی وەڵامەکەت دەستی پێکرد. بە کوردی وەڵام بدەرەوە...');
    } catch (err: any) {
      console.error('Viva mic error:', err);
      this.recordingQuestionId.set(null);
      this.notifications.showError('هەڵەی مایکرۆفۆن', 'دەستگەیشتن بە مایکرۆفۆن ڕەتکرایەوە.');
    }
  }

  private async stopRecordingViva(_q: DefenseQuestion): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.recordingQuestionId.set(null);
  }

  private async evaluateSpokenViva(audioBlob: Blob, mimeType: string, q: DefenseQuestion): Promise<void> {
    this.isEvaluatingViva.set(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      this.geminiSse.evaluateVivaSpokenAnswer({
        audioBase64,
        mimeType,
        questionText: q.questionKurdish,
        examinerRole: q.roleTitleKurdish,
        scoringCriteria: q.scoringCriteria
      }).subscribe({
        next: (res) => {
          this.isEvaluatingViva.set(false);
          if (res.success && res.evaluation) {
            const ev = res.evaluation;
            this.markAnswered(q.id);

            // Add or update committee member feedback based on spoken viva
            const newFeedback: CommitteeMemberFeedback = {
              name: q.roleTitleKurdish,
              role: 'هەڵسەنگاندنی ڕاستەوخۆی دەنگی (Spoken Viva Evaluation)',
              avatar: '🎙️',
              grade: ev.grade || 90,
              decisionStatus: (ev.decisionStatus as any) || 'پەسەندکرا بە ئەنجامی نایاب',
              gradientBg: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
              feedbackText: ev.critique || 'وەڵامە دەنگییەکەت بە سەرکەوتوویی لەلایەن لێژنەوە تاوتوێ کرا.',
              recommendations: ev.recommendations || []
            };

            this.committeeFeedback.update((prev) => [newFeedback, ...prev]);
            this.activeView.set('committee');
            this.notifications.showSuccess(
              'وەڵامەکەت هەڵسەنگێندرا',
              `نمرە: ${ev.grade}/100 — بڕیار: ${ev.decisionStatus}`
            );
          }
        },
        error: (err) => {
          this.isEvaluatingViva.set(false);
          console.error('Audio viva evaluation error:', err);
          this.notifications.showError('هەڵەی هەڵسەنگاندن', 'پشکنینی دەنگیی لێژنە سەرکەوتوو نەبوو.');
        }
      });
    } catch (err) {
      this.isEvaluatingViva.set(false);
      console.error('Error in evaluateSpokenViva:', err);
    }
  }

  async generateCustomQuestion(): Promise<void> {
    const currentChapters = this.chapters();
    const thesisContext = currentChapters.map((chapter) => {
      const branchContent = (chapter.axes || [])
        .flatMap((axis) => [
          `## ${axis.title}`,
          ...(axis.branches || []).map((branch) => `### ${branch.title}\n${branch.content || ''}`)
        ])
        .join('\n\n');
      return `# ${chapter.title}\n${chapter.content || ''}\n${branchContent}`;
    }).join('\n\n').trim().slice(0, 20_000);

    if (!thesisContext) {
      this.notifications.showWarning('ناوەڕۆکی بەش نییە', 'پێش دروستکردنی پرسیاری تایبەت، دەقی بەشەکانی تێزەکە بنووسە.');
      return;
    }

    this.isGeneratingQuestion.set(true);
    try {
      const raw = await this.geminiSse.streamAcademicGeneration({
        systemInstruction: 'تۆ ئەندامی ڕەخنەگری لێژنەی تاوتوێی تێزی ئەکادیمیت. تەنها JSON ـێکی دروست بە کوردیی سۆرانی بنووسە، بێ مارک‌داون.',
        prompt: `لەسەر بنەمای دەقی ڕاستەقینەی بەشەکانی تێزەکە، یەک پرسیاری زۆر قووڵ و ڕەخنەگرانەی تاوتوێ دروست بکە و ڕێنمایی وەڵامی نموونەیی بدە. پرسیارەکە دەبێت بە وردی بە ناوەڕۆک، بانگەشە یان بەڵگەی دەقەکەوە ببەسترێتەوە و نابێت زانیاریی دەرەکیی گریمانەیی زیاد بکات.

شێوازی JSON:
{"questionKurdish":"...","questionCategory":"...","purpose":"...","recommendedResponseGuide":"وەڵامی نموونەیی و خاڵە سەرەکییەکان","scoringCriteria":["...","..."]}

ناونیشان و ناوەڕۆکی بەشەکان:
${thesisContext}`
      });
      const jsonText = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonText) throw new Error('The defense-question response did not contain JSON.');
      const parsed = JSON.parse(jsonText) as Partial<DefenseQuestion>;
      if (
        typeof parsed.questionKurdish !== 'string' ||
        typeof parsed.recommendedResponseGuide !== 'string'
      ) {
        throw new Error('The defense-question response is missing required question or answer fields.');
      }

      const newQ: DefenseQuestion = {
        id: `q-dynamic-${Date.now()}`,
        examinerRole: 'external',
        roleTitleKurdish: 'پرسیاری دەرهێنراو لە دەقی تێزەکەت',
        questionKurdish: parsed.questionKurdish,
        questionCategory: parsed.questionCategory || 'شیکاریی تایبەت بە دەستنووس',
        purpose: parsed.purpose || 'هەڵسەنگاندنی بانگەشە و بەڵگەکانی ناوەڕۆکی توێژینەوە.',
        recommendedResponseGuide: parsed.recommendedResponseGuide,
        scoringCriteria: Array.isArray(parsed.scoringCriteria)
          ? parsed.scoringCriteria.filter((item): item is string => typeof item === 'string')
          : []
      };
      this.questions.update(list => [newQ, ...list]);
      this.expandedId.set(newQ.id);
      this.notifications.showSuccess('پرسیاری نوێ', 'پرسیار و ڕێنمایی وەڵامی نموونەیی بەپێی ناوەڕۆکی تێزەکە زیاد کرا.');
    } catch (error) {
      console.error('Viva question generation failed:', error);
      this.notifications.showError('هەڵەی دروستکردنی پرسیار', 'پرسیاری تایبەت بە ناوەڕۆکی تێز دروست نەکرا؛ تکایە دووبارە هەوڵ بدە.');
    } finally {
      this.isGeneratingQuestion.set(false);
    }
  }
}

// Backwards-compatible alias
export { ThesisDefenseSimulatorComponent as VivaSimulationComponent };
