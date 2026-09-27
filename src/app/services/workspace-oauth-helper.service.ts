import { Injectable, inject, signal } from '@angular/core';
import { AppNotificationsService } from '../core/app.notifications';

export interface OAuthNoticeState {
  isOpen: boolean;
  serviceName: string;
  reason: string;
  isIframe: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceOAuthHelperService {
  private notifications = inject(AppNotificationsService);

  public noticeState = signal<OAuthNoticeState>({
    isOpen: false,
    serviceName: '',
    reason: '',
    isIframe: false
  });

  /**
   * Detects if running inside an iframe (like AI Studio navframe preview).
   */
  public isRunningInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  /**
   * Shows an informative Kurdish notification and modal state when OAuth popup is needed or blocked.
   */
  public showOAuthGuidance(serviceName: string, errorReason?: string): void {
    const isIframe = this.isRunningInIframe();
    
    this.noticeState.set({
      isOpen: true,
      serviceName,
      reason: errorReason || (isIframe 
        ? 'پەنجەرەی ڕێگەپێدانی گووگڵ لەناو فرەیمی پێشبینیندا (Preview Iframe) لەوانەیە بلۆک بکرێت.'
        : 'پێویستە ڕێگەپێدانی دەستگەیشتن بە گووگڵ پەسەند بکەیت.'),
      isIframe
    });

    if (isIframe) {
      this.notifications.showWarning(
        `ڕێگەپێدانی ${serviceName}`,
        'بۆ ئەوەی وێبگەڕ ڕێگری لە پەنجەرەی ڕێگەپێدان (Popup) نەکات، تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.'
      );
    } else {
      this.notifications.showInfo(
        `چوونەژوورەوەی ${serviceName}`,
        'تکایە لە پەنجەرەی گووگڵدا ڕێگەپێدانی داواکراو پەسەند بکە.'
      );
    }
  }

  /**
   * Opens the application in a new browser tab for clean OAuth flow.
   */
  public openAppInNewTab(): void {
    if (typeof window === 'undefined') return;
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
      this.closeNotice();
    } catch (e) {
      console.warn('Failed to open new tab:', e);
    }
  }

  /**
   * Closes the OAuth notice dialog.
   */
  public closeNotice(): void {
    this.noticeState.update(s => ({ ...s, isOpen: false }));
  }
}
