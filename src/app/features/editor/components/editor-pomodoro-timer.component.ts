import { Component, ChangeDetectionStrategy, signal, computed, inject, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../../core/app.notifications';
import { toSoraniNumber } from '../../../pipes/sorani-number.pipe';

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

@Component({
  selector: 'app-editor-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <mat-icon class="!text-lg leading-none">timer</mat-icon>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 font-serif">
              کاتژمێری فۆکەسی پۆمۆدۆرۆ (Focus & Research Break Timer)
            </h3>
            <p class="text-[10px] text-slate-400 font-serif">
              بەڕێوەبردنی کاتەکانی نووسینی تێز و ئاگادارکردنەوە بۆ پشووی هۆشیاری
            </p>
          </div>
        </div>

        <!-- Mode Indicator Badge -->
        <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold font-serif" [class]="modeBadgeClass()">
          {{ modeLabel() }}
        </span>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex items-center justify-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          (click)="setMode('work')"
          [class]="mode() === 'work' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
          class="flex-1 py-1 rounded-lg text-center font-serif transition cursor-pointer">
          فۆکەسی نووسین (٢٥ خولەک)
        </button>
        <button
          type="button"
          (click)="setMode('shortBreak')"
          [class]="mode() === 'shortBreak' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
          class="flex-1 py-1 rounded-lg text-center font-serif transition cursor-pointer">
          پشووی کورت (٥ خولەک)
        </button>
        <button
          type="button"
          (click)="setMode('longBreak')"
          [class]="mode() === 'longBreak' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
          class="flex-1 py-1 rounded-lg text-center font-serif transition cursor-pointer">
          پشووی درێژ (١٥ خولەک)
        </button>
      </div>

      <!-- Timer Display & Ring -->
      <div class="flex flex-col items-center justify-center py-2 space-y-2">
        <div class="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-slate-100 drop-shadow-md">
          {{ formattedTime() }}
        </div>

        <!-- Progress bar -->
        <div class="w-full max-w-xs bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            [class]="mode() === 'work' ? 'bg-rose-500' : mode() === 'shortBreak' ? 'bg-emerald-500' : 'bg-indigo-500'"
            [style.width.%]="progressPercent()"></div>
        </div>
      </div>

      <!-- Action Controls -->
      <div class="flex items-center justify-center gap-2 pt-1">
        @if (!isRunning()) {
          <button
            type="button"
            (click)="startTimer()"
            class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-serif rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md">
            <mat-icon class="!text-base">play_arrow</mat-icon>
            <span>دەستپێکردن</span>
          </button>
        } @else {
          <button
            type="button"
            (click)="pauseTimer()"
            class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-serif rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md">
            <mat-icon class="!text-base">pause</mat-icon>
            <span>وەستاندنی کاتی</span>
          </button>
        }

        <button
          type="button"
          (click)="skipTimer()"
          class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-serif rounded-xl flex items-center gap-1 transition cursor-pointer border border-slate-700">
          <mat-icon class="!text-base">skip_next</mat-icon>
          <span>پەڕین بۆ داهاتوو</span>
        </button>

        <button
          type="button"
          (click)="resetTimer()"
          class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-xl flex items-center transition cursor-pointer border border-slate-700">
          <mat-icon class="!text-base">replay</mat-icon>
        </button>
      </div>

      <!-- Writing Velocity & Cognitive Fatigue Metrics -->
      <div class="p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-2 text-xs font-serif">
        <div class="flex items-center justify-between">
          <span class="text-slate-300 flex items-center gap-1.5">
            <mat-icon class="!text-sm text-cyan-400">speed</mat-icon>
            <span>خێرایی نووسین (Writing Velocity):</span>
          </span>
          <span class="font-mono font-bold text-cyan-400">
            {{ toSorani(writingVelocityWpm()) }} وشە/خولەک
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-slate-300 flex items-center gap-1.5">
            <mat-icon class="!text-sm text-amber-400">psychology</mat-icon>
            <span>ئاستی شەکەتبوونی مێشک (Cognitive Fatigue):</span>
          </span>
          <span
            class="text-[10px] px-2 py-0.5 rounded-md font-bold"
            [class]="fatigueLevel() === 'fatigued' ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : fatigueLevel() === 'moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'">
            {{ fatigueLabel() }}
          </span>
        </div>

        @if (fatigueLevel() === 'fatigued') {
          <div class="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-center justify-between gap-2 text-rose-200 text-[11px] animate-fade-in">
            <div class="flex items-center gap-1.5">
              <mat-icon class="!text-sm text-rose-400">warning</mat-icon>
              <span>نیشانەی شەکەتبوون بەدی دەکرێت! پێشنیاری پشووی ۵ خولەکی دەکرێت.</span>
            </div>
            <button
              type="button"
              (click)="takeCognitiveBreak()"
              class="px-2 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded font-bold text-[10px] shrink-0 cursor-pointer">
              پشووی خێرا
            </button>
          </div>
        }
      </div>

      <!-- Bottom Session Stats Log -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-serif">
        <span class="flex items-center gap-1">
          <mat-icon class="!text-xs text-rose-400">check_circle</mat-icon>
          <span>گەڕە تەواوکراوەکان: {{ toSorani(completedSessions()) }}</span>
        </span>
        <span class="flex items-center gap-1">
          <mat-icon class="!text-xs text-emerald-400">hourglass_bottom</mat-icon>
          <span>کۆی کاتی فۆکەس: {{ toSorani(totalFocusMinutes()) }} خولەک</span>
        </span>
      </div>
    </div>
  `
})
export class EditorPomodoroTimerComponent implements OnDestroy {
  private notificationsService = inject(AppNotificationsService);

  readonly activeText = input<string>('');

  readonly mode = signal<PomodoroMode>('work');
  readonly isRunning = signal<boolean>(false);
  readonly timeLeftSeconds = signal<number>(25 * 60);
  readonly initialDurationSeconds = signal<number>(25 * 60);
  readonly completedSessions = signal<number>(0);
  readonly totalFocusMinutes = signal<number>(0);

  // Velocity and Fatigue Signals
  readonly writingVelocityWpm = signal<number>(32);
  readonly fatigueLevel = signal<'fresh' | 'moderate' | 'fatigued'>('fresh');

  private intervalId: any = null;
  private lastWordCount = 0;
  private secondsInCurrentStreak = 0;

  toSorani(val: number | string): string {
    return toSoraniNumber(val);
  }

  fatigueLabel = computed(() => {
    switch (this.fatigueLevel()) {
      case 'fresh': return 'ئارام و پڕ وزە (Fresh)';
      case 'moderate': return 'مامناوەند (Moderate)';
      case 'fatigued': return 'شەکەت و ماندوو (Fatigued)';
    }
  });

  takeCognitiveBreak(): void {
    this.setMode('shortBreak');
    this.startTimer();
    this.notificationsService.showToast(
      'پشووی هۆشیاری و کەمکردنەوەی شەکەتی',
      'پشووی ٥ خولەکی دەستی پێکرد. چاوەکانت لە مۆنیتەر دوور بخەرەوە بۆ باشتربوونی سەرنج.',
      'info',
      5000
    );
  }

  private updateVelocityAndFatigue(): void {
    const text = this.activeText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (this.lastWordCount > 0 && this.secondsInCurrentStreak > 10) {
      const deltaWords = Math.max(0, words - this.lastWordCount);
      const wpm = Math.round((deltaWords / 5) * 60);
      this.writingVelocityWpm.set(Math.min(120, Math.max(15, wpm || 28)));
    }
    this.lastWordCount = words;

    if (this.secondsInCurrentStreak > 35 * 60) {
      this.fatigueLevel.set('fatigued');
    } else if (this.secondsInCurrentStreak > 20 * 60) {
      this.fatigueLevel.set('moderate');
    } else {
      this.fatigueLevel.set('fresh');
    }
  }

  modeLabel = computed(() => {
    switch (this.mode()) {
      case 'work': return 'نووسینی تێز (Focus)';
      case 'shortBreak': return 'پشووی توێژینەوە (Break)';
      case 'longBreak': return 'پشووی درێژ (Rest)';
    }
  });

  modeBadgeClass = computed(() => {
    switch (this.mode()) {
      case 'work': return 'bg-rose-950/60 text-rose-400 border border-rose-800';
      case 'shortBreak': return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800';
      case 'longBreak': return 'bg-indigo-950/60 text-indigo-400 border border-indigo-800';
    }
  });

  formattedTime = computed(() => {
    const totalSecs = this.timeLeftSeconds();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const padM = mins < 10 ? `0${mins}` : `${mins}`;
    const padS = secs < 10 ? `0${secs}` : `${secs}`;
    return `${toSoraniNumber(padM)}:${toSoraniNumber(padS)}`;
  });

  progressPercent = computed(() => {
    const initial = this.initialDurationSeconds();
    const left = this.timeLeftSeconds();
    if (initial === 0) return 0;
    return Math.round(((initial - left) / initial) * 100);
  });

  setMode(newMode: PomodoroMode): void {
    this.pauseTimer();
    this.mode.set(newMode);
    const duration = newMode === 'work' ? 25 * 60 : newMode === 'shortBreak' ? 5 * 60 : 15 * 60;
    this.initialDurationSeconds.set(duration);
    this.timeLeftSeconds.set(duration);
  }

  startTimer(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    this.intervalId = setInterval(() => {
      const current = this.timeLeftSeconds();
      if (current > 0) {
        this.timeLeftSeconds.set(current - 1);
        if (this.mode() === 'work') {
          this.secondsInCurrentStreak++;
          if (this.secondsInCurrentStreak % 5 === 0) {
            this.updateVelocityAndFatigue();
          }
        }
      } else {
        this.onTimerComplete();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resetTimer(): void {
    this.pauseTimer();
    const duration = this.initialDurationSeconds();
    this.timeLeftSeconds.set(duration);
  }

  skipTimer(): void {
    this.pauseTimer();
    if (this.mode() === 'work') {
      this.setMode('shortBreak');
    } else {
      this.setMode('work');
    }
  }

  private onTimerComplete(): void {
    this.pauseTimer();

    if (this.mode() === 'work') {
      this.completedSessions.update(c => c + 1);
      this.totalFocusMinutes.update(m => m + 25);

      // Trigger Research Break notification via AppNotificationsService
      this.notificationsService.showToast(
        'کاتی پشووی توێژینەوەیە! (Research Break Time)',
        'گەڕی نووسینی تێز بە سەرکەوتوویی تەواو بوو! ئێستا کاتی ٥ خولەک پشوودانی هزر و چاوەکانە.',
        'success',
        6000
      );

      // Next: suggest short break
      if (this.completedSessions() % 4 === 0) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
    } else {
      // Break finished, notify user to resume writing
      this.notificationsService.showToast(
        'دەستپێکردنەوەی نووسین (Resume Focus Session)',
        'کاتی پشوو کۆتایی هات! ئامادەبە بۆ گەڕێکی نوێی نووسین و پێداچوونەوەی تێزەکەت.',
        'info',
        5000
      );

      this.setMode('work');
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
