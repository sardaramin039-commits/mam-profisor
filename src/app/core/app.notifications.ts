import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  messageKurdish: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  durationMs: number;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppNotificationsService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly activeToasts = signal<ToastItem[]>([]);

  addNotification(title: string, messageKurdish: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      messageKurdish,
      type,
      timestamp: new Date(),
      read: false
    };
    this.notifications.update(prev => [newNotif, ...prev.slice(0, 49)]);
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', durationMs = 4500) {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const item: ToastItem = {
      id,
      type,
      title,
      message,
      durationMs,
      createdAt: Date.now()
    };

    // Keep max 4 active toasts visible at once
    this.activeToasts.update(prev => [item, ...prev.slice(0, 3)]);

    // Also record in historical notifications log
    this.addNotification(title, message, type);

    // Auto dismiss after durationMs
    if (durationMs > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, durationMs);
    }
  }

  showSuccess(title: string, message: string) {
    this.showToast(title, message, 'success', 4000);
  }

  showError(title: string, message: string) {
    this.showToast(title, message, 'error', 6000);
  }

  showWarning(title: string, message: string) {
    this.showToast(title, message, 'warning', 5000);
  }

  showInfo(title: string, message: string) {
    this.showToast(title, message, 'info', 4000);
  }

  dismissToast(id: string) {
    this.activeToasts.update(prev => prev.filter(t => t.id !== id));
  }

  markAsRead(id: string) {
    this.notifications.update(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  clearAll() {
    this.notifications.set([]);
    this.activeToasts.set([]);
  }
}
