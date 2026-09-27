import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GmailService, GmailMessage } from '../../services/gmail.service';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-gmail-integration',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 dir-rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <mat-icon>mail</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              پێوەندیکردن بە Gmail (Gmail Workspace Integration)
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-normal flex items-center gap-1">
                <mat-icon class="!w-3 !h-3 !text-[12px]">mark_email_read</mat-icon>
                Gmail Active
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              خوێندنەوەی پەیامە ئەکادیمییەکان و ناردنی راستەوخۆی تێز و هەڵسەنگاندنەکان بۆ سەرپەرشتیار و زانکۆ
            </p>
          </div>
        </div>

        @if (gmailService.isAuthenticated()) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <img [src]="gmailService.currentUser()?.photoURL || 'https://picsum.photos/seed/user/100/100'" 
                   alt="User" 
                   class="w-6 h-6 rounded-full border border-slate-600"
                   referrerpolicy="no-referrer" />
              <span class="text-xs text-slate-200 font-medium">
                {{ gmailService.currentUser()?.displayName || gmailService.currentUser()?.email }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Not Authenticated View -->
      @if (!gmailService.isAuthenticated()) {
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <mat-icon class="!w-8 !h-8 !text-[32px]">email</mat-icon>
          </div>
          <h4 class="text-base font-bold text-white mb-2">به‌ستنه‌وه‌ی هەژماری Gmail</h4>
          <p class="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            بۆ ناردنی ڕاستەوخۆی ڕەشنووسی تێز، پەیوەندیکردن لەگەڵ مامۆستای سەرپەرشتیار و خوێندنەوەی پەیامە ئەکادیمییەکان، بەستنەوە ئەنجام بدە.
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
                  [disabled]="gmailService.isLoading()"
                  class="relative inline-flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm px-6 py-3 rounded-xl border border-rose-500/30 transition duration-200 shadow-lg disabled:opacity-50">
            @if (gmailService.isLoading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
              <span>لە حاڵەتی پێوەندیکردندایە...</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>چوونەژوورەوە لەگەڵ Gmail</span>
            }
          </button>
        </div>
      }

      <!-- Authenticated Gmail Workspace View -->
      @if (gmailService.isAuthenticated()) {
        <div class="space-y-6">
          <!-- Active Tabs -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <button type="button"
                      (click)="activeTab.set('compose')"
                      class="px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2"
                      [ngClass]="activeTab() === 'compose' ? 'bg-rose-600 text-white' : 'bg-slate-800/60 text-slate-300'">
                <mat-icon class="!w-4 !h-4 !text-[16px]">send</mat-icon>
                ناردنی ئیمەیڵ / ڕاپۆرت
              </button>

              <button type="button"
                      (click)="activeTab.set('inbox'); loadInbox()"
                      class="px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2"
                      [ngClass]="activeTab() === 'inbox' ? 'bg-rose-600 text-white' : 'bg-slate-800/60 text-slate-300'">
                <mat-icon class="!w-4 !h-4 !text-[16px]">inbox</mat-icon>
                پەیامەکان (Inbox)
              </button>
            </div>

            <button (click)="prefillThesisEmail()"
                    class="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-[16px]">auto_awesome</mat-icon>
              داڕشتنی ئیمەیڵی تێز بۆ سەرپەرشتیار
            </button>
          </div>

          <!-- Tab 1: Compose / Send Email -->
          @if (activeTab() === 'compose') {
            <div class="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 class="text-sm font-bold text-white flex items-center gap-2">
                <mat-icon class="text-rose-400 !w-5 !h-5 !text-[20px]">edit_note</mat-icon>
                داڕشتنی پەیامی نوێ لە Gmail
              </h4>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">ئیمەیڵی وەرگر (Recipient):</label>
                  <input type="email"
                         [(ngModel)]="emailTo"
                         placeholder="advisor@university.edu.krd"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">ناونیشانی ئیمەیڵ (Subject):</label>
                  <input type="text"
                         [(ngModel)]="emailSubject"
                         placeholder="ڕەشنووسی تێزی ئەکادیمی - بەشی یەکەم"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">ناوەڕۆکی پەیام (Email Body):</label>
                  <textarea rows="6"
                            [(ngModel)]="emailBody"
                            placeholder="ڕێز و سڵاوی ئه‌کادیمی..."
                            class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none"></textarea>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-2">
                <button (click)="promptConfirm('draft')"
                        [disabled]="!emailTo || !emailSubject"
                        class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-40">
                  <mat-icon class="!w-4 !h-4 !text-[16px]">drafts</mat-icon>
                  خەزنکردن وەک پیشنووس (Draft)
                </button>

                <button (click)="promptConfirm('send')"
                        [disabled]="!emailTo || !emailSubject"
                        class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-rose-600/20 flex items-center gap-1.5 disabled:opacity-40">
                  <mat-icon class="!w-4 !h-4 !text-[16px]">send</mat-icon>
                  ناردنی ئیمەیڵ
                </button>
              </div>
            </div>
          }

          <!-- Tab 2: Inbox View -->
          @if (activeTab() === 'inbox') {
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <mat-icon class="!w-4 !h-4 !text-[16px] text-rose-400">mail</mat-icon>
                  دوایین پەیامەکانی Gmail
                </h4>

                <button (click)="loadInbox()"
                        [disabled]="gmailService.isLoading()"
                        class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5">
                  <mat-icon [class.animate-spin]="gmailService.isLoading()" class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
                  تازەکردنەوە
                </button>
              </div>

              @if (gmailService.isLoading() && messages().length === 0) {
                <div class="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <mat-icon class="animate-spin text-rose-400 !w-8 !h-8 !text-[32px]">sync</mat-icon>
                  لە خوێندنەوەی پەیامەکاندا...
                </div>
              } @else if (messages().length === 0) {
                <div class="py-10 text-center text-slate-500 text-xs bg-slate-950/20 border border-slate-800 rounded-xl">
                  هیچ پەیامێک لە سندوقی هاتوو نەدۆزرایەوە.
                </div>
              } @else {
                <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
                  @for (msg of messages(); track msg.id) {
                    <div class="p-3 bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800 rounded-xl transition space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-200 truncate max-w-[200px]">{{ msg.from }}</span>
                        <span class="text-[10px] text-slate-500">{{ msg.date }}</span>
                      </div>
                      <p class="text-xs font-medium text-rose-300 truncate">{{ msg.subject }}</p>
                      <p class="text-[11px] text-slate-400 line-clamp-2">{{ msg.snippet }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- User Confirmation Modal for Destructive/Mutating Operations -->
      @if (showConfirmModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center gap-3 text-rose-400">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <mat-icon>{{ actionType() === 'send' ? 'send' : 'drafts' }}</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white">
                {{ actionType() === 'send' ? 'پشتڕاستکردنەوەی ناردنی ئیمەیڵ' : 'پشتڕاستکردنەوەی پاشەکەوتکردنی پیشنووس' }}
              </h4>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
              {{ actionType() === 'send' ? 'ئایا دڵنیایت لە ناردنی ئەم ئیمەیڵە بە ڕاستەوخۆ لەڕێگەی هەژماری Gmailەکەتەوە؟' : 'ئایا دڵنیایت لە تۆمارکردنی ئەم پەیامە وەک پێشنووس لە سندوقی Gmailدا؟' }}
            </p>

            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-400">وەرگر: <span class="text-white font-medium">{{ emailTo }}</span></p>
              <p class="text-slate-400">ناونیشان: <span class="text-slate-200">{{ emailSubject }}</span></p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="showConfirmModal.set(false)"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
                پەشیمانبوونەوە
              </button>

              <button (click)="executeAction()"
                      [disabled]="isExecuting()"
                      class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition shadow-lg flex items-center gap-1.5">
                @if (isExecuting()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  <span>لە ئەنجامداندایە...</span>
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
export class GmailIntegrationComponent {
  gmailService = inject(GmailService);
  oauthHelper = inject(WorkspaceOAuthHelperService);
  thesisContent = input<string>('');

  activeTab = signal<'compose' | 'inbox'>('compose');
  messages = signal<GmailMessage[]>([]);

  emailTo = '';
  emailSubject = '';
  emailBody = '';

  showConfirmModal = signal<boolean>(false);
  actionType = signal<'send' | 'draft'>('send');
  isExecuting = signal<boolean>(false);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  async handleConnect() {
    const token = await this.gmailService.authenticateWithGmail();
    if (token) {
      this.showStatus('بە سەرکەوتوویی بەستنەوە لەگەڵ Gmail ئەنجامدرا.', 'success');
    }
  }

  prefillThesisEmail() {
    this.emailTo = '';
    this.emailSubject = `ڕەشنووسی تێزی ئەکادیمی - ${new Date().toLocaleDateString('ku-IQ')}`;
    const excerpt = this.thesisContent()
      ? this.thesisContent().substring(0, 400) + '...'
      : 'لەگەڵ ڕێزدا، ئەمە پەیامی تایبەت بە ناردنی بەشی توێژینەوەی ئەکادیمییە.';

    this.emailBody = `بەرێز مامۆستای سەرپەرشتیار،\n\nسڵاوێکی ئەکادیمی بەرز؛\nتکایە بڕوانە ئەم کورتەیەی ڕەشنووسی توێژینەوەکەم:\n\n---\n${excerpt}\n---\n\nچاودێری و بڕیاری بەڕێزتان بەرز دەنرخێنم.\n\nلەگەڵ ڕێزدا،\n${this.gmailService.currentUser()?.displayName || 'توێژەر'}`;
    this.activeTab.set('compose');
  }

  async loadInbox() {
    try {
      const msgs = await this.gmailService.listMessages(10);
      this.messages.set(msgs);
    } catch (err: any) {
      this.showStatus(`هەڵە لە هێنانی پەیامەکان: ${err.message}`, 'error');
    }
  }

  promptConfirm(type: 'send' | 'draft') {
    this.actionType.set(type);
    this.showConfirmModal.set(true);
  }

  async executeAction() {
    this.isExecuting.set(true);
    try {
      if (this.actionType() === 'send') {
        await this.gmailService.sendEmail(this.emailTo, this.emailSubject, this.emailBody);
        this.showStatus('ئیمەیڵەکە بە سەرکەوتوویی لە ڕێگەی Gmail نێردرا!', 'success');
        this.emailTo = '';
        this.emailSubject = '';
        this.emailBody = '';
      } else {
        await this.gmailService.createDraft(this.emailTo, this.emailSubject, this.emailBody);
        this.showStatus('پەیامەکە وەک پیشنووس (Draft) لە Gmail پاشەکەوت کرا.', 'success');
      }
      this.showConfirmModal.set(false);
    } catch (err: any) {
      this.showStatus(`هەڵە: ${err.message}`, 'error');
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
