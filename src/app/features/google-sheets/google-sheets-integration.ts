import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GoogleSheetsService, Spreadsheet } from '../../services/google-sheets.service';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-google-sheets-integration',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 dir-rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <mat-icon>table_chart</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              پێوەندیکردن بە Google Sheets (Google Sheets Integration)
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal flex items-center gap-1">
                <mat-icon class="!w-3 !h-3 !text-[12px]">check_circle</mat-icon>
                Sheets Active
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              هەناردەکردنی سەرچاوەکان، داتاکانی ڕاپرسی و دۆزراوە ئامارییەکانی توێژینەوە بۆ ناو فایلی Google Sheets
            </p>
          </div>
        </div>

        @if (sheetsService.isAuthenticated()) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <img [src]="sheetsService.currentUser()?.photoURL || 'https://picsum.photos/seed/user/100/100'" 
                   alt="User" 
                   class="w-6 h-6 rounded-full border border-slate-600"
                   referrerpolicy="no-referrer" />
              <span class="text-xs text-slate-200 font-medium">
                {{ sheetsService.currentUser()?.displayName || sheetsService.currentUser()?.email }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Not Authenticated View -->
      @if (!sheetsService.isAuthenticated()) {
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
            <mat-icon class="!w-8 !h-8 !text-[32px]">grid_on</mat-icon>
          </div>
          <h4 class="text-base font-bold text-white mb-2">به‌ستنه‌وه‌ی هەژماری Google Sheets</h4>
          <p class="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            بۆ هەناردەکردنی داتای ئەکادیمی، خشتەکانی ئامار و خەمڵاندنی سەرچاوەکان بۆ ناو Google Sheets بە شێوەیەکی ڕاستەوخۆ، هەژمارەکەت ببەستەوە.
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
                  [disabled]="sheetsService.isLoading()"
                  class="relative inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-6 py-3 rounded-xl border border-emerald-500/30 transition duration-200 shadow-lg disabled:opacity-50">
            @if (sheetsService.isLoading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
              <span>لە حاڵەتی پێوەندیکردندایە...</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>چوونەژوورەوە لەگەڵ Google Sheets</span>
            }
          </button>
        </div>
      }

      <!-- Authenticated View -->
      @if (sheetsService.isAuthenticated()) {
        <div class="space-y-6">
          <div class="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <mat-icon class="text-emerald-400 !w-5 !h-5 !text-[20px]">note_add</mat-icon>
              دروستکردنی فایلی نوێ لە Google Sheets
            </h4>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">ناونیشانی فایلی اکسڵ / خشتە (Spreadsheet Title):</label>
                <input type="text"
                       [(ngModel)]="sheetTitle"
                       placeholder="داتاکانی توێژینەوەی ئەکادیمی 2026"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">ناونیشانی ستوونەکان (خۆکارانە یان بە کاما جیاکراوە):</label>
                <input type="text"
                       [(ngModel)]="columnHeadersText"
                       placeholder="سەرچاوە, جۆر, ساڵ, نوسەر, تێبینی"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="promptConfirm()"
                      [disabled]="!sheetTitle"
                      class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-40">
                <mat-icon class="!w-4 !h-4 !text-[16px]">cloud_upload</mat-icon>
                دروستکردن و هەناردەکردن بۆ Google Sheets
              </button>
            </div>
          </div>

          <!-- Created Sheets list -->
          @if (createdSheets().length > 0) {
            <div class="space-y-3">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="!w-4 !h-4 !text-[16px] text-emerald-400">task</mat-icon>
                پەڕە دروستکراوەکانی ئەم دواییە
              </h4>

              <div class="space-y-2">
                @for (s of createdSheets(); track s.spreadsheetId) {
                  <div class="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2.5">
                      <mat-icon class="text-emerald-400 !w-5 !h-5 !text-[20px]">grid_on</mat-icon>
                      <span class="font-bold text-slate-200">{{ s.properties.title }}</span>
                    </div>

                    <a [href]="s.spreadsheetUrl"
                       target="_blank"
                       class="px-3 py-1 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium transition flex items-center gap-1">
                      <span>کردنەوە لە Sheets</span>
                      <mat-icon class="!w-3 h-3 !text-[12px]">open_in_new</mat-icon>
                    </a>
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
            <div class="flex items-center gap-3 text-emerald-400">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <mat-icon>table_chart</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white">پشتڕاستکردنەوەی دروستکردنی Google Sheet</h4>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
              ئایا دڵنیایت لە دروستکردنی فایلی نوێ لە هەژماری Google Sheets؟
            </p>

            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-400">ناونیشانی پەڕە: <span class="text-white font-medium">{{ sheetTitle }}</span></p>
              <p class="text-slate-400">ستوونەکان: <span class="text-slate-200">{{ columnHeadersText }}</span></p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="showConfirmModal.set(false)"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
                پەشیمانبوونەوە
              </button>

              <button (click)="executeExport()"
                      [disabled]="isExecuting()"
                      class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition shadow-lg flex items-center gap-1.5">
                @if (isExecuting()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  <span>لە دروستکردندایە...</span>
                } @else {
                  <span>پشتڕاستکردنەوە</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Status Notification Message -->
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
export class GoogleSheetsIntegrationComponent {
  sheetsService = inject(GoogleSheetsService);
  oauthHelper = inject(WorkspaceOAuthHelperService);
  thesisTitle = input<string>('');

  sheetTitle = 'خشتەی سەرچاوە و داتاکانی توێژینەوە';
  columnHeadersText = 'ژمارە, ناونیشانی بەش, نوسەر / سەرچاوە, ساڵ, دۆخ';

  createdSheets = signal<Spreadsheet[]>([]);

  showConfirmModal = signal<boolean>(false);
  isExecuting = signal<boolean>(false);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  async handleConnect() {
    const token = await this.sheetsService.authenticateWithSheets();
    if (token) {
      this.showStatus('بە سەرکەوتوویی بەستنەوە لەگەڵ Google Sheets ئەنجامدرا.', 'success');
    }
  }

  promptConfirm() {
    this.showConfirmModal.set(true);
  }

  async executeExport() {
    this.isExecuting.set(true);
    try {
      const headers = this.columnHeadersText.split(',').map(h => h.trim());
      const sampleRows = [
        ['1', 'پێشەکی و گوێنەدان', 'کوردۆ حەمە', '2025', 'تەواوکراو'],
        ['2', 'چەمک و تیۆرەکان', 'ڕێباز عەلی', '2024', 'لە پێداچوونەوەدا'],
        ['3', 'شیکاریی ئاماری', 'ئومێد سەعید', '2026', 'پێشنیارکراو']
      ];

      const sheet = await this.sheetsService.createResearchDataSheet(
        this.sheetTitle,
        headers,
        sampleRows
      );

      this.createdSheets.update(prev => [sheet, ...prev]);
      this.showStatus(`فایلی '${sheet.properties.title}' دروستکرا!`, 'success');
      this.showConfirmModal.set(false);
    } catch (err: any) {
      this.showStatus(`هەڵە لە دروستکردنی فایلی Sheets: ${err.message}`, 'error');
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
