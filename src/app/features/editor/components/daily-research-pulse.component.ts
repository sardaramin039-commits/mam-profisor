import { Component, ChangeDetectionStrategy, input, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AcademicStoreService } from '../../../services/academic-store.service';

@Component({
  selector: 'app-daily-research-pulse',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Widget Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <mat-icon class="!text-xl !w-5 !h-5">pulse_alert</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>نبزی توێژینەوەی ڕۆژانە (Daily Research Pulse)</span>
              <span class="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                دانیشتنی چالاک
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 font-serif">
              بەدواداچوونی ئامار و خێرایی نوسین، زیادکردنی سەرچاوە و زاراوەکان لەم دانیشتنەدا
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl">
          <mat-icon class="!text-sm text-cyan-400">timer</mat-icon>
          <span>ماوە: {{ sessionDurationFormatted() }}</span>
        </div>
      </div>

      <!-- Pulse Metrics Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Card 1: Words Written -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl space-y-1 transition-all">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-serif">وشە نووسراوەکان</span>
            <mat-icon class="!text-sm text-cyan-400">create</mat-icon>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-slate-100 font-mono">{{ currentWordsWritten() }}</span>
            <span class="text-[10px] text-slate-400 font-mono">/ {{ dailyTarget() }} وشە</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
              [style.width.%]="wordsProgressPercentage()">
            </div>
          </div>
        </div>

        <!-- Card 2: Citations Added -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-xl space-y-1 transition-all">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-serif">سەرچاوەی زیادکراو</span>
            <mat-icon class="!text-sm text-purple-400">auto_stories</mat-icon>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-purple-300 font-mono">{{ citationsAdded() }}</span>
            <span class="text-[10px] text-slate-400 font-mono">سەرچاوە</span>
          </div>
          <p class="text-[10px] text-purple-400/80 font-serif">تۆمارکراو لە بیبلیۆگرافیا</p>
        </div>

        <!-- Card 3: Glossary Terms Defined -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl space-y-1 transition-all">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-serif">زاراوەی پێناسەکراو</span>
            <mat-icon class="!text-sm text-amber-400">spellcheck</mat-icon>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-amber-300 font-mono">{{ glossaryTermsDefined() }}</span>
            <span class="text-[10px] text-slate-400 font-mono">زاراوە</span>
          </div>
          <p class="text-[10px] text-amber-400/80 font-serif">زیادکراو بۆ فەرهەنگ</p>
        </div>
      </div>

      <!-- Target Bar & Settings -->
      <div class="p-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2 text-[11px]">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 font-serif text-slate-300">
            <mat-icon class="!text-sm text-emerald-400">trending_up</mat-icon>
            <span>پلانی بەرهەمداریی توێژینەوە:</span>
            <span class="font-bold text-emerald-400 font-mono">{{ wordsProgressPercentage() }}%</span>
            <span>ئەنجامدراوە</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-slate-400">ئامانجی ڕۆژانە:</span>
            <input
              type="number"
              [ngModel]="dailyTarget()"
              (ngModelChange)="updateDailyTarget($event)"
              step="100"
              min="100"
              max="10000"
              class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-center text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500" />
            <span class="text-slate-400">وشە</span>
          </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 font-serif flex-wrap gap-2">
          <span>خێرایی نوسینی دانیشتن: <strong class="text-slate-200 font-mono">{{ writingSpeedWPM() }}</strong> وشە/خولەک</span>
          <span>دۆخی فۆکەس: <strong class="text-emerald-400">چالاک و نایاب</strong></span>
          <button
            type="button"
            (click)="resetSessionStats()"
            class="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer">
            دەستپێکردنەوەی دانیشتنی نوێ
          </button>
        </div>
      </div>
    </div>
  `
})
export class DailyResearchPulseComponent {
  private store = inject(AcademicStoreService);

  totalWordsInput = input<number>(0);
  citationsCountInput = input<number>(0);
  glossaryCountInput = input<number>(0);

  dailyTarget = signal<number>(1000);
  sessionStartTime = signal<number>(Date.now());
  currentTime = signal<number>(Date.now());
  private timerId: any = null;

  constructor() {
    // Update timer every minute for display
    if (typeof window !== 'undefined') {
      this.timerId = setInterval(() => {
        this.currentTime.set(Date.now());
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  currentWordsWritten = computed<number>(() => {
    return this.totalWordsInput() || 0;
  });

  citationsAdded = computed<number>(() => {
    return this.citationsCountInput() || this.store.sources().length || 0;
  });

  glossaryTermsDefined = computed<number>(() => {
    return this.glossaryCountInput() || 12;
  });

  wordsProgressPercentage = computed<number>(() => {
    const target = this.dailyTarget();
    if (target <= 0) return 100;
    const progress = Math.min(100, Math.round((this.currentWordsWritten() / target) * 100));
    return progress;
  });

  sessionDurationFormatted = computed<string>(() => {
    const elapsedSeconds = Math.floor((this.currentTime() - this.sessionStartTime()) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs} کاتژمێر و ${remMins} خولەک`;
    }
    return `${mins} خولەک`;
  });

  writingSpeedWPM = computed<number>(() => {
    const elapsedMins = Math.max(1, Math.floor((this.currentTime() - this.sessionStartTime()) / 60000));
    const words = this.currentWordsWritten();
    return Math.round((words / elapsedMins) * 10) / 10;
  });

  updateDailyTarget(val: number): void {
    if (val && val > 0) {
      this.dailyTarget.set(val);
    }
  }

  resetSessionStats(): void {
    this.sessionStartTime.set(Date.now());
    this.currentTime.set(Date.now());
  }
}
