import { Injectable, signal, computed, inject } from '@angular/core';
import { AppNotificationsService } from '../core/app.notifications';

@Injectable({
  providedIn: 'root'
})
export class LiveProgressService {
  private notifications = inject(AppNotificationsService);

  public isBusy = signal<boolean>(false);
  public activeActionKey = signal<string | null>(null);
  public taskDescription = signal<string>('');
  public progressPercent = signal<number>(0);
  public elapsedSeconds = signal<number>(0);
  public estimatedTotalSeconds = signal<number>(60);

  private timerInterval: any = null;

  public elapsedTimeFormatted = computed(() => {
    const s = this.elapsedSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm}:${ss}`;
  });

  public estimatedTimeFormatted = computed(() => {
    const total = this.estimatedTotalSeconds();
    const elapsed = this.elapsedSeconds();
    const remaining = Math.max(0, total - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (mins > 0) {
      return `کاتی ماوە بۆ تەواوبوون: ~${mins} خولەک و ${secs} چرکە`;
    }
    return `کاتی ماوە بۆ تەواوبوون: ~${secs} چرکە`;
  });

  public isActionActive(key: string): boolean {
    return this.isBusy() && this.activeActionKey() === key;
  }

  public startTask(actionKey: string, description: string, estimatedSeconds = 45): void {
    this.stopTimer();
    this.isBusy.set(true);
    this.activeActionKey.set(actionKey);
    this.taskDescription.set(description);
    this.progressPercent.set(5);
    this.elapsedSeconds.set(0);
    this.estimatedTotalSeconds.set(estimatedSeconds);

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
      const curr = this.progressPercent();
      if (curr < 92) {
        const remainingTime = Math.max(1, this.estimatedTotalSeconds() - this.elapsedSeconds());
        const step = Math.max(0.3, (92 - curr) / remainingTime);
        this.progressPercent.set(Math.min(94, Math.round(curr + step)));
      }
    }, 1000);
  }

  public updateProgress(percent: number, description?: string, remainingSeconds?: number): void {
    this.progressPercent.set(Math.min(99, Math.max(0, Math.round(percent))));
    if (description) {
      this.taskDescription.set(description);
    }
    if (remainingSeconds !== undefined) {
      this.estimatedTotalSeconds.set(this.elapsedSeconds() + remainingSeconds);
    }
  }

  public finishTask(successMessage?: string): void {
    this.stopTimer();
    this.progressPercent.set(100);
    this.notifications.showSuccess('سەرکەوتوو بوو', successMessage || 'کردارەکە بە سەرکەوتوویی بە ئەنجام گەیشت.');
    setTimeout(() => {
      this.isBusy.set(false);
      this.activeActionKey.set(null);
      this.taskDescription.set('');
      this.progressPercent.set(0);
      this.elapsedSeconds.set(0);
    }, 1200);
  }

  public failTask(errorMessage?: string): void {
    this.stopTimer();
    this.notifications.showError('ئاگاداری', errorMessage || 'پڕۆسەکە سەرکەوتوو نەبوو.');
    this.isBusy.set(false);
    this.activeActionKey.set(null);
    this.taskDescription.set('');
    this.progressPercent.set(0);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
