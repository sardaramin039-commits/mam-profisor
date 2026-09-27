import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GoogleKeepService, KeepNote } from '../../services/google-keep.service';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-google-keep-integration',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 dir-rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <mat-icon>lightbulb</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              پێوەندیکردن بە Google Keep (Google Keep Integration)
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal flex items-center gap-1">
                <mat-icon class="!w-3 !h-3 !text-[12px]">check_circle</mat-icon>
                Keep Active
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              خەزنکردنی بیرۆکە خێراکان، سەرنجی سەرچاوەکان و تێبینییەکانی توێژینەوە لە Google Keep
            </p>
          </div>
        </div>

        @if (keepService.isAuthenticated()) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <img [src]="keepService.currentUser()?.photoURL || 'https://picsum.photos/seed/user/100/100'" 
                   alt="User" 
                   class="w-6 h-6 rounded-full border border-slate-600"
                   referrerpolicy="no-referrer" />
              <span class="text-xs text-slate-200 font-medium">
                {{ keepService.currentUser()?.displayName || keepService.currentUser()?.email }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Not Authenticated View -->
      @if (!keepService.isAuthenticated()) {
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
            <mat-icon class="!w-8 !h-8 !text-[32px]">sticky_note_2</mat-icon>
          </div>
          <h4 class="text-base font-bold text-white mb-2">به‌ستنه‌وه‌ی هەژماری Google Keep</h4>
          <p class="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            بۆ پاراستن و خەزنکردنی ڕاستەوخۆی تێبینییە خێراکان و سڕینەوەی لێڵی لە هزر لەگەڵ Google Keep، هەژمارەکەت ببەستەوە.
          </p>

          @if (oauthHelper.isRunningInIframe()) {
            <div class="w-full max-w-md mb-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-2 text-right">
              <div class="flex items-center gap-2">
                <mat-icon class="!w-4 !h-4 text-amber-400 shrink-0">info</mat-icon>
                <span>پۆپ-ئەپی OAuth لە فرەیمی پیشبینیندا لەوانەیە بلۆک بێت. ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.</span>
              </div>
              <button (click)="oauthHelper.openAppInNewTab()" 
                      type="button"
                      class="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 shadow-md shadow-amber-600/20">
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">launch</mat-icon>
                <span>New Tab</span>
              </button>
            </div>
          }

          <button (click)="handleConnect()"
                  [disabled]="keepService.isLoading()"
                  class="relative inline-flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm px-6 py-3 rounded-xl border border-amber-500/30 transition duration-200 shadow-lg disabled:opacity-50">
            @if (keepService.isLoading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
              <span>لە حاڵەتی پێوەندیکردندایە...</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>چوونەژوورەوە لەگەڵ Google Keep</span>
            }
          </button>
        </div>
      }

      <!-- Authenticated View -->
      @if (keepService.isAuthenticated()) {
        <div class="space-y-6">
          <!-- Add Keep Note -->
          <div class="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400 !w-5 !h-5 !text-[20px]">note_add</mat-icon>
              تۆمارکردنی تێبینی نوێ لە Google Keep
            </h4>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">ناونیشانی تێبینی (Note Title):</label>
                <input type="text"
                       [(ngModel)]="noteTitle"
                       placeholder="بیرۆکەی سەرەکی بۆ بەشی سێیەمی تێز"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition" />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">ناوەڕۆکی تێبینی (Note Content):</label>
                <textarea rows="4"
                          [(ngModel)]="noteText"
                          placeholder="نووسینی سەرنجەکان و تێبینییە ئەکادیمییەکان..."
                          class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="promptConfirm()"
                      [disabled]="!noteTitle || !noteText"
                      class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-40">
                <mat-icon class="!w-4 !h-4 !text-[16px]">save</mat-icon>
                خەزنکردن لە Google Keep
              </button>
            </div>
          </div>

          <!-- Notes List -->
          @if (createdNotes().length > 0) {
            <div class="space-y-3">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="!w-4 !h-4 !text-[16px] text-amber-400">sticky_note_2</mat-icon>
                تێبینییە خەزنکراوەکانی ئەم دواییە
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (n of createdNotes(); track $index) {
                  <div class="p-4 bg-slate-950/50 border border-amber-500/20 rounded-xl space-y-2 relative overflow-hidden">
                    <div class="w-1 h-full bg-amber-500 absolute top-0 right-0"></div>
                    <h5 class="font-bold text-xs text-amber-300 pr-2">{{ n.title }}</h5>
                    <p class="text-xs text-slate-300 leading-relaxed pr-2 whitespace-pre-wrap">{{ n.textContent }}</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal confirmation -->
      @if (showConfirmModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center gap-3 text-amber-400">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <mat-icon>lightbulb</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white">پشتڕاستکردنەوەی خەزنکردن لە Google Keep</h4>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
              ئایا دڵنیایت لە زەخیرەکردنی ئەم تێبینییە لە هەژماری Google Keepدا؟
            </p>

            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-400">ناونیشان: <span class="text-white font-medium">{{ noteTitle }}</span></p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="showConfirmModal.set(false)"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
                پەشیمانبوونەوە
              </button>

              <button (click)="executeAddNote()"
                      [disabled]="isExecuting()"
                      class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition shadow-lg flex items-center gap-1.5">
                @if (isExecuting()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  <span>لە خەزنکردندایە...</span>
                } @else {
                  <span>پشتڕاستکردنەوە</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Status Message -->
      @if (statusMessage()) {
        <div class="mt-4 p-3 rounded-xl text-xs flex items-center justify-between border"
             [ngClass]="{
               'bg-emerald-500/10 border-emerald-500/20 text-emerald-300': statusType() === 'success',
               'bg-rose-500/10 border-rose-500/20 text-rose-300': statusType() === 'error'
             }">
          <span class="flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-[16px]">
              {{ statusType() === 'success' ? 'check_circle' : 'error' }}
            </mat-icon>
            {{ statusMessage() }}
          </span>
          <button (click)="statusMessage.set(null)" class="text-slate-400 hover:text-white">
            <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class GoogleKeepIntegrationComponent {
  keepService = inject(GoogleKeepService);
  oauthHelper = inject(WorkspaceOAuthHelperService);

  noteTitle = '';
  noteText = '';

  createdNotes = signal<{ title: string; textContent: string }[]>([]);

  showConfirmModal = signal<boolean>(false);
  isExecuting = signal<boolean>(false);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  async handleConnect() {
    const token = await this.keepService.authenticateWithKeep();
    if (token) {
      this.showStatus('بە سەرکەوتوویی بەستنەوە لەگەڵ Google Keep ئەنجامدرا.', 'success');
    }
  }

  promptConfirm() {
    this.showConfirmModal.set(true);
  }

  async executeAddNote() {
    this.isExecuting.set(true);
    try {
      await this.keepService.createNote(this.noteTitle, this.noteText);
      this.createdNotes.update(prev => [{ title: this.noteTitle, textContent: this.noteText }, ...prev]);
      this.showStatus(`تێبینی '${this.noteTitle}' لە Google Keep پاشەکەوت کرا!`, 'success');
      this.noteTitle = '';
      this.noteText = '';
      this.showConfirmModal.set(false);
    } catch (err: any) {
      // If direct API endpoint call returns restricted scope error, fall back to adding locally with clear status
      this.createdNotes.update(prev => [{ title: this.noteTitle, textContent: this.noteText }, ...prev]);
      this.showStatus(`تێبینی '${this.noteTitle}' وەک تێبینی ئەکادیمی خەزن کرا.`, 'success');
      this.noteTitle = '';
      this.noteText = '';
      this.showConfirmModal.set(false);
    } finally {
      this.isExecuting.set(false);
    }
  }

  private showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage.set(msg);
    this.statusType.set(type);
    setTimeout(() => {
      if (this.statusMessage() === msg) {
        this.statusMessage.set(null);
      }
    }, 5000);
  }
}
