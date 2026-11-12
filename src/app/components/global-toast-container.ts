import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService, ToastItem } from '../core/app.notifications';

@Component({
  selector: 'app-global-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notificationService.activeToasts().length > 0) {
      <div
        class="fixed top-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (toast of notificationService.activeToasts(); track toast.id) {
          <div
            class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in relative overflow-hidden backdrop-blur-md"
            [ngClass]="getToastStyle(toast.type)"
          >
            <!-- Toast Icon -->
            <div class="p-1.5 rounded-lg shrink-0 mt-0.5" [ngClass]="getIconBg(toast.type)">
              <mat-icon class="!w-5 !h-5 !text-xl" [ngClass]="getIconColor(toast.type)">
                {{ getToastIcon(toast.type) }}
              </mat-icon>
            </div>

            <!-- Toast Content -->
            <div class="flex-1 min-w-0 pr-1">
              <h4 class="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-snug">
                {{ toast.title }}
              </h4>
              <p class="text-xs text-stone-600 dark:text-stone-300 font-sans mt-0.5 leading-relaxed break-words">
                {{ toast.message }}
              </p>
            </div>

            <!-- Dismiss Button -->
            <button
              type="button"
              (click)="notificationService.dismissToast(toast.id)"
              class="shrink-0 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="داخستن"
              aria-label="داخستنی ئاگاداری"
            >
              <mat-icon class="!w-4 !h-4 !text-base">close</mat-icon>
            </button>

            <!-- Auto-dismiss Progress Bar -->
            <div class="absolute bottom-0 inset-x-0 h-1 bg-stone-200/50 dark:bg-stone-700/50 overflow-hidden">
              <div
                class="h-full transition-all ease-linear"
                [ngClass]="getProgressBarColor(toast.type)"
                [style.animation-duration]="toast.durationMs + 'ms'"
                style="animation-name: toastProgress; animation-timing-function: linear; animation-fill-mode: forwards;"
              ></div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-slide-in {
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class GlobalToastContainerComponent {
  public notificationService = inject(AppNotificationsService);

  getToastIcon(type: ToastItem['type']): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': default: return 'info';
    }
  }

  getToastStyle(type: ToastItem['type']): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/60 shadow-emerald-900/5';
      case 'error':
        return 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800/60 shadow-rose-900/5';
      case 'warning':
        return 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800/60 shadow-amber-900/5';
      case 'info':
      default:
        return 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800/60 shadow-sky-900/5';
    }
  }

  getIconBg(type: ToastItem['type']): string {
    switch (type) {
      case 'success': return 'bg-emerald-100 dark:bg-emerald-900/50';
      case 'error': return 'bg-rose-100 dark:bg-rose-900/50';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/50';
      case 'info': default: return 'bg-sky-100 dark:bg-sky-900/50';
    }
  }

  getIconColor(type: ToastItem['type']): string {
    switch (type) {
      case 'success': return 'text-emerald-700 dark:text-emerald-400';
      case 'error': return 'text-rose-700 dark:text-rose-400';
      case 'warning': return 'text-amber-700 dark:text-amber-400';
      case 'info': default: return 'text-sky-700 dark:text-sky-400';
    }
  }

  getProgressBarColor(type: ToastItem['type']): string {
    switch (type) {
      case 'success': return 'bg-emerald-600 dark:bg-emerald-400';
      case 'error': return 'bg-rose-600 dark:bg-rose-400';
      case 'warning': return 'bg-amber-600 dark:bg-amber-400';
      case 'info': default: return 'bg-sky-600 dark:bg-sky-400';
    }
  }
}
