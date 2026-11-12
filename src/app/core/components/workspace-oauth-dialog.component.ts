import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-workspace-oauth-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (oauthHelper.noticeState().isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-serif" dir="rtl">
        <div class="bg-stone-900 border border-stone-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white text-right">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-stone-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <mat-icon class="!w-5 !h-5">lock_open</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-amber-300">ڕێگەپێدانی {{ oauthHelper.noticeState().serviceName || 'Google Workspace' }}</h3>
                <p class="text-[11px] text-stone-400">بەستنەوەی ئەکادیمی و سەلامەت بە خزمەتگوزارییەکانی گووگڵ</p>
              </div>
            </div>
            <button 
              (click)="oauthHelper.closeNotice()"
              class="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer">
              <mat-icon class="!w-5 !h-5">close</mat-icon>
            </button>
          </div>

          <!-- Description -->
          <div class="bg-stone-800/80 p-4 rounded-xl border border-stone-700/60 space-y-2 text-xs text-stone-200 leading-relaxed">
            <p>{{ oauthHelper.noticeState().reason }}</p>
            
            @if (oauthHelper.noticeState().isIframe) {
              <div class="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-start gap-2">
                <mat-icon class="!w-4 !h-4 text-xs mt-0.5 shrink-0">info</mat-icon>
                <span>پێشبینینی وێبگەڕ (Iframe) ڕەنگە پەنجەرەی Pop-up بلۆک بکات. کردنەوە لە تابلۆی نوێ سەلامەتترین و خێراترین ڕێگایە.</span>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              (click)="oauthHelper.closeNotice()"
              class="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer">
              داخستن
            </button>

            @if (oauthHelper.noticeState().isIframe) {
              <button
                (click)="oauthHelper.openAppInNewTab()"
                class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-600/30 cursor-pointer">
                <mat-icon class="!w-4 !h-4 text-xs">open_in_new</mat-icon>
                <span>کردنەوە لە پەڕەیەکی نوێدا (New Tab)</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class WorkspaceOAuthDialogComponent {
  public oauthHelper = inject(WorkspaceOAuthHelperService);
}
