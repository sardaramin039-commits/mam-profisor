import { Component, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleDriveService, DriveFile } from '../../services/google-drive.service';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-google-drive-integration',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 dir-rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <mat-icon>cloud_sync</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              پێوەندیکردن بە گووگڵ درایڤ و دۆکس (Google Drive & Docs)
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal flex items-center gap-1">
                <mat-icon class="!w-3 !h-3 !text-[12px]">check_circle</mat-icon>
                Drive & Docs
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              هاوکاتکردن، دروستکردن و خەزنکردنی بەڵگەنامەی Google Docs و داتاکان لەسەر هەور
            </p>
          </div>
        </div>

        @if (driveService.isAuthenticated()) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <img [src]="driveService.currentUser()?.photoURL || 'https://picsum.photos/seed/user/100/100'" 
                   alt="User" 
                   class="w-6 h-6 rounded-full border border-slate-600"
                   referrerpolicy="no-referrer" />
              <span class="text-xs text-slate-200 font-medium">
                {{ driveService.currentUser()?.displayName || driveService.currentUser()?.email }}
              </span>
            </div>
            <button (click)="handleSignOut()" 
                    class="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1">
              <mat-icon class="!w-4 !h-4 !text-[16px]">logout</mat-icon>
              دەرچوون
            </button>
          </div>
        }
      </div>

      <!-- Not Authenticated View -->
      @if (!driveService.isAuthenticated()) {
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>
          <h4 class="text-base font-bold text-white mb-2">بەستنەوەی هەژماری گووگڵ بۆ هێنانی فایلەکان</h4>
          <p class="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            بۆ هێنانی فایلە ئەکادیمییەکان، توێژینەوەکان و هەناردەکردنی بەڵگەنامەی تێز بۆ گووگڵ درایڤ، تکایە ڕێگەپێدان بە هەژمارەکەت بدە.
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
                  [disabled]="driveService.isLoading()"
                  class="relative inline-flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition duration-200 shadow-lg disabled:opacity-50">
            @if (driveService.isLoading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
              <span>لە حاڵەتی پێوەندیکردندایە...</span>
            } @else {
              <svg class="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>چوونەژوورەوە لەگەڵ Google Drive</span>
            }
          </button>
        </div>
      }

      <!-- Authenticated Drive Manager -->
      @if (driveService.isAuthenticated()) {
        <div class="space-y-6">
          <!-- Actions Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <!-- Search Input -->
            <div class="relative flex-1 min-w-[240px]">
              <mat-icon class="absolute left-3 top-2.5 text-slate-500 !w-5 !h-5 !text-[20px]">search</mat-icon>
              <input type="text"
                     [value]="searchQuery()"
                     (input)="onSearchInput($event)"
                     placeholder="گەڕان لە فایلەکانی گووگڵ درایڤ..."
                     class="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-10 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition" />
            </div>

            <div class="flex items-center gap-2">
              <button (click)="loadFiles()"
                      [disabled]="driveService.isLoading()"
                      class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700/80 transition flex items-center gap-1.5">
                <mat-icon [class.animate-spin]="driveService.isLoading()" class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
                تازەکردنەوە
              </button>

              @if (thesisContent()) {
                <button (click)="promptExportConfirm('gdoc')"
                        class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-blue-600/20 flex items-center gap-1.5">
                  <mat-icon class="!w-4 !h-4 !text-[16px]">description</mat-icon>
                  دروستکردنی Google Doc
                </button>

                <button (click)="promptExportConfirm('drive')"
                        class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5">
                  <mat-icon class="!w-4 !h-4 !text-[16px]">upload_file</mat-icon>
                  هەناردەکردنی تێز بۆ Drive
                </button>
              }
            </div>
          </div>

          <!-- Files List -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-[16px] text-blue-400">folder_open</mat-icon>
              فایلەکانی درایڤی تۆ (Google Drive Files)
            </h4>

            @if (driveService.isLoading() && files().length === 0) {
              <div class="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <mat-icon class="animate-spin text-blue-400 !w-8 !h-8 !text-[32px]">sync</mat-icon>
                لە داگرتنی لیستەکەدایە...
              </div>
            } @else if (files().length === 0) {
              <div class="py-10 text-center text-slate-500 text-xs bg-slate-950/20 border border-slate-800/60 rounded-xl">
                هیچ فایلێک نەدۆزرایەوە یان لیستەکە خاڵییە.
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                @for (file of files(); track file.id) {
                  <div class="p-3 bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800/80 rounded-xl transition flex items-center justify-between group">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        @if (file.mimeType.includes('document')) {
                          <mat-icon class="text-blue-400">description</mat-icon>
                        } @else if (file.mimeType.includes('pdf')) {
                          <mat-icon class="text-rose-400">picture_as_pdf</mat-icon>
                        } @else if (file.mimeType.includes('spreadsheet')) {
                          <mat-icon class="text-emerald-400">table_chart</mat-icon>
                        } @else {
                          <mat-icon class="text-amber-400">insert_drive_file</mat-icon>
                        }
                      </div>

                      <div class="min-w-0">
                        <p class="text-xs font-medium text-slate-200 truncate group-hover:text-blue-400 transition" [title]="file.name">
                          {{ file.name }}
                        </p>
                        <p class="text-[10px] text-slate-500">
                          {{ file.modifiedTime | date:'short' }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      @if (file.webViewLink) {
                        <a [href]="file.webViewLink" target="_blank" rel="noopener noreferrer" 
                           class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                           title="کردنەوە لە گووگڵ درایڤ">
                          <mat-icon class="!w-4 !h-4 !text-[16px]">open_in_new</mat-icon>
                        </a>
                      }
                      <button (click)="importDriveFile(file)"
                              class="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-[11px] font-medium transition">
                        هێنان بۆ ئەپ
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Export Confirmation Modal (Required for mutating user data) -->
      @if (showExportConfirm()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center gap-3" [class.text-blue-400]="exportType() === 'gdoc'" [class.text-emerald-400]="exportType() === 'drive'">
              <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <mat-icon>{{ exportType() === 'gdoc' ? 'description' : 'upload_file' }}</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white">
                {{ exportType() === 'gdoc' ? 'پشتڕاستکردنەوەی دروستکردنی Google Doc' : 'پشتڕاستکردنەوەی هەناردەکردن بۆ Drive' }}
              </h4>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
              {{ exportType() === 'gdoc' ? 'ئایا دڵنیایت لە دروستکردن و خەزنکردنی لەگەڵ بەڵگەنامەی ڕاستەوخۆی Google Docs؟' : 'ئایا دڵنیایت لە دروستکردن و پاشەکەوتکردنی فایلی نوێ لە هەژماری گووگڵ درایڤەکەتدا؟' }}
            </p>

            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-400">ناونیشانی بەڵگەنامە: <span class="text-white font-medium">{{ exportFilename() }}</span></p>
              <p class="text-slate-400">جۆری بەڵگەنامە: <span class="text-slate-300">{{ exportType() === 'gdoc' ? 'Google Docs Document' : 'Text / Markdown (.txt)' }}</span></p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="showExportConfirm.set(false)"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
                پەشیمانبوونەوە
              </button>
              <button (click)="confirmExport()"
                      [disabled]="isExporting()"
                      class="px-5 py-2 text-white rounded-xl text-xs font-medium transition shadow-lg flex items-center gap-1.5"
                      [class.bg-blue-600]="exportType() === 'gdoc'"
                      [class.hover:bg-blue-500]="exportType() === 'gdoc'"
                      [class.bg-emerald-600]="exportType() === 'drive'"
                      [class.hover:bg-emerald-500]="exportType() === 'drive'">
                @if (isExporting()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  <span>لە دروستکردندایە...</span>
                } @else {
                  <span>پشتڕاستکردنەوە و خەزنکەر</span>
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
export class GoogleDriveIntegrationComponent {
  driveService = inject(GoogleDriveService);
  oauthHelper = inject(WorkspaceOAuthHelperService);

  thesisTitle = input<string>('');
  thesisContent = input<string>('');
  fileImported = output<{ name: string; content: string }>();

  files = signal<DriveFile[]>([]);
  searchQuery = signal<string>('');
  showExportConfirm = signal<boolean>(false);
  exportType = signal<'gdoc' | 'drive'>('gdoc');
  exportFilename = signal<string>('Academic-Thesis-Draft');
  isExporting = signal<boolean>(false);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  async handleConnect() {
    const token = await this.driveService.authenticateWithDrive();
    if (token) {
      this.loadFiles();
      this.showStatus('بە سەرکەوتوویی پەیوەندی لەگەڵ گووگڵ درایڤ بەسترا.', 'success');
    }
  }

  async handleSignOut() {
    await this.driveService.signOutDrive();
    this.files.set([]);
    this.showStatus('لە درایڤ دەرچوویت.', 'success');
  }

  async loadFiles() {
    try {
      const driveFiles = await this.driveService.listFiles(20, this.searchQuery());
      this.files.set(driveFiles);
    } catch (err: any) {
      this.showStatus(err.message || 'نەتوانرا لیستەکە دابگیرێت.', 'error');
    }
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.loadFiles();
  }

  async importDriveFile(file: DriveFile) {
    try {
      this.showStatus(`داگرتنی '${file.name}'...`, 'success');
      const content = await this.driveService.importFileContent(file.id, file.mimeType);
      this.fileImported.emit({ name: file.name, content });
      this.showStatus(`فایلی '${file.name}' بە سەرکەوتوویی هێنرا بۆ ئەپەکە.`, 'success');
    } catch (err: any) {
      this.showStatus(`شکست لە هێنانی فایل: ${err.message}`, 'error');
    }
  }

  promptExportConfirm(type: 'gdoc' | 'drive' = 'gdoc') {
    this.exportType.set(type);
    if (type === 'gdoc') {
      this.exportFilename.set(`Academic Thesis - ${new Date().toISOString().slice(0, 10)}`);
    } else {
      this.exportFilename.set(`Thesis-Draft-${new Date().toISOString().slice(0, 10)}.txt`);
    }
    this.showExportConfirm.set(true);
  }

  async confirmExport() {
    this.isExporting.set(true);
    try {
      if (this.exportType() === 'gdoc') {
        const doc = await this.driveService.exportThesisAsGoogleDoc(
          this.exportFilename(),
          this.thesisContent() || 'ناوەڕۆکی تێز'
        );
        this.showExportConfirm.set(false);
        this.showStatus(`بەڵگەنامەی Google Docs '${doc.title}' دروستکرا!`, 'success');
      } else {
        const file = await this.driveService.exportDocumentToDrive(
          this.exportFilename(),
          this.thesisContent() || 'ناوەڕۆکی تێز'
        );
        this.showExportConfirm.set(false);
        this.showStatus(`فایلی '${file.name}' لە گووگڵ درایڤ پاشەکەوت کرا!`, 'success');
      }
      this.loadFiles();
    } catch (err: any) {
      this.showStatus(`هەڵە لە دروستکردن/پاشەکەوتکردن: ${err.message}`, 'error');
    } finally {
      this.isExporting.set(false);
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
