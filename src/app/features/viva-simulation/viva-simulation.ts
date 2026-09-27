import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

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

@Component({
  selector: 'app-viva-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-5 dir-rtl shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-purple-500/20">
            <mat-icon class="text-xl">gavel</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
              سیمیولەیشنی بەرگری توێژینەوە و وەڵامی کۆمیتەی ئەکادیمی
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full">Viva Simulation & Evaluation</span>
            </h3>
            <p class="text-xs text-slate-400">تاقیکردنەوە، ئامادەکاری پرسیارەکان و پێداچوونەوەی بڕیاری پاسادانی لێژنەی هەڵسەنگاندن.</p>
          </div>
        </div>

        <button
          (click)="startViva()"
          class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
        >
          <mat-icon class="text-base">play_circle</mat-icon>
          ئەنجامدانی سیمیولەیشن و پێداچوونەوە
        </button>
      </div>

      <!-- Simulation Defense Questions -->
      @if (questions().length > 0) {
        <div class="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <h4 class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <mat-icon class="text-sm">quiz</mat-icon>
            پرسیارە تاقیکارییەکانی کۆمیتە بۆ بەرگریکار:
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (q of questions(); track q.id) {
              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 hover:border-purple-500/40 transition-all">
                <span class="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-bold">پرسیاری {{ q.id }}</span>
                <p class="text-xs text-slate-200 font-medium leading-relaxed">{{ q.text }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Academic Committee Response Cards with Color Gradients -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-slate-100 flex items-center gap-2">
            <mat-icon class="text-indigo-400 text-lg">verified</mat-icon>
            وەڵامی کۆمیتەی ئەکادیمی (Academic Committee Official Feedback & Decision)
          </h4>
          <span class="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
            <mat-icon class="text-xs">star</mat-icon>
            ئەنجامی سەرجەم: 93 / 100 (ممتاز - Grade A)
          </span>
        </div>

        <!-- Committee Member Feedback Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (m of committeeFeedback(); track m.name) {
            <div [class]="m.gradientBg" class="p-4 rounded-2xl border border-slate-800/80 shadow-xl space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all">
              <div class="space-y-2.5">
                <!-- Header with Avatar and Role -->
                <div class="flex items-center gap-3 border-b border-white/10 pb-2.5">
                  <div class="w-10 h-10 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-lg font-bold">
                    {{ m.avatar }}
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-slate-100">{{ m.name }}</h5>
                    <p class="text-[10px] text-slate-300 font-medium">{{ m.role }}</p>
                  </div>
                </div>

                <!-- Decision Badge & Score -->
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-slate-950/80 text-emerald-300 border-emerald-800/80 flex items-center gap-1">
                    <mat-icon class="text-xs text-emerald-400">check_circle</mat-icon>
                    {{ m.decisionStatus }}
                  </span>
                  <span class="text-xs font-mono font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    نومەرە: {{ m.grade }}/100
                  </span>
                </div>

                <!-- Feedback Content -->
                <p class="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  "{{ m.feedbackText }}"
                </p>

                <!-- Specific Recommendations List -->
                <div class="space-y-1">
                  <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <mat-icon class="text-xs text-indigo-400">playlist_add_check</mat-icon>
                    تێبینی و پێشنیارەکان:
                  </span>
                  <ul class="space-y-1 pr-1">
                    @for (rec of m.recommendations; track rec) {
                      <li class="text-[10px] text-slate-300 flex items-start gap-1">
                        <span class="text-cyan-400 font-bold">•</span>
                        <span>{{ rec }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>

              <!-- Action Footer -->
              <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>بڕیاری پاسادان: بەڵێ</span>
                <span class="text-cyan-300 font-semibold">ئیمزاکراوە ✍️</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class VivaSimulationComponent {
  questions = signal<{ id: number; text: string }[]>([]);

  committeeFeedback = signal<CommitteeMemberFeedback[]>([
    {
      name: 'پ. د. ئاریان محەمەد کەرۆخی',
      role: 'سەرۆکی لێژنەی هەڵسەنگاندن و سەرپەرشتیاری ئەکادیمی',
      avatar: '👨‍🏫',
      grade: 95,
      decisionStatus: 'پەسەندکرا بە ئەنجامی نایاب',
      gradientBg: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
      feedbackText: 'توێژینەوەکە خاوەنی نوێکاریی بەرز (High Novelty) و مێتۆدۆلۆژییەکی ئاستبەرزی زانستییە. بونیادی داڕشتنەکە بە تەواوی هاوتای پێوەری زانکۆ ڕەسەنەکانە.',
      recommendations: [
        'پێداچوونەوە بە هاوڕێکردنی زاراوە بیانییەکان لە کەوانەدا بکەرەوە.',
        'زیادکردنی خشتەی بەراوردکاری تیۆرییەکان لە بەشی دووەمدا.'
      ]
    },
    {
      name: 'پ. ی. د. نەسرین عومەر حەمەد',
      role: 'ئەندامی لێژنە و هەڵسەنگێنەری دەرەکی',
      avatar: '👩‍🏫',
      grade: 92,
      decisionStatus: 'پەسەندکرا بە چاکسازیی بچووک',
      gradientBg: 'bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950',
      feedbackText: 'شیکاری داتا ئامارییەکان و دەرهێنانی دەرئەنجامەکان زۆر بەهێزە. بەرگریکار توانایەکی زۆر باشی هەبوو لە وەڵامدانەوەی پرسیارە وردەکاندا.',
      recommendations: [
        'ڕێکخستنی سەرچاوەکان بە شێوازی Harvard لە کۆتایی تێزەکەدا.',
        'زیادکردنی گراف و وێنەی ڕوون کەرەوە لە لاپەڕەکانی پاشکۆدا.'
      ]
    },
    {
      name: 'د. ڕێبین سەڵاحەدین',
      role: 'ئەندامی لێژنە و شارەزای زمانەوانی زانستی',
      avatar: '👨‍🔬',
      grade: 92,
      decisionStatus: 'پەسەندکرا بە ئەنجامی نایاب',
      gradientBg: 'bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950',
      feedbackText: 'زمان و داڕشتنی سۆرانی پێوەر زۆر پاراو و ڕوانە. هیچ ڕستەیەکی ڕۆژانەی تێدا بەکارنەهاتووە و ڕێزمانداری ئەکادیمی بە تەواوی ڕەچاوکراوە.',
      recommendations: [
        'ڕاستکردنەوەی جێبەجێکردنی نەخشەی زاراوەکان.',
        'ئامادەکردنی پوختەی ئینگلیزی (Abstract) بۆ چاپەمەنییە نێودەوڵەتییەکان.'
      ]
    }
  ]);

  startViva(): void {
    this.questions.set([
      { id: 1, text: 'سەرەکیترین نوێکاری (Novelty) و بەشداریی زانستی لەم توێژینەوەکەتدا چییە؟' },
      { id: 2, text: 'بۆچی ئەم میتۆدۆلۆژییە زانستییەت لەسەر تیۆرییە کێبڕکێکارەکانی تر هەڵبژارد؟' },
      { id: 3, text: 'دەرئەنجامە ئامارییەکان تا چەند پشتڕاستکەرەوەی ڕاستیی هیپۆتیزەکەتن؟' }
    ]);
  }
}
