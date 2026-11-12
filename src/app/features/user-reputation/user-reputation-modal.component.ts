import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserReputationService } from '../../services/user-reputation.service';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';

@Component({
  selector: 'app-user-reputation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md" dir="rtl">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans text-right text-slate-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <mat-icon>{{ repService.profile().badgeIcon }}</mat-icon>
            </div>
            <div>
              <h3 class="text-sm md:text-base font-bold font-serif flex items-center gap-2">
                سیستەمی ناوبانگی ئەکادیمی (Scholar Reputation Suite)
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono border" [class]="repService.profile().badgeClass">
                  {{ repService.profile().tierNameKurdish }}
                </span>
              </h3>
              <p class="text-[10.5px] text-slate-400 font-serif">
                ناوبانگ لەسەر بنەمای کوالیتیی دەقی زانستی و پێداچوونەوەی ئەکادیمی بەدەست دێت.
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="close.emit()"
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer">
            <mat-icon class="!text-sm">close</mat-icon>
          </button>
        </div>

        <!-- KPI Score & Gating Status Ribbon -->
        <div class="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-serif block">خاڵەکانی ناوبانگ</span>
            <span class="text-lg font-black font-mono text-amber-400">{{ repService.profile().reputationScore }}</span>
            <span class="text-[9px] text-slate-500 block">Reputation Score</span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-serif block">بڵاوکردنەوەی بەش</span>
            <span [class]="'text-xs font-bold font-serif flex items-center justify-center gap-1 ' +
              (repService.profile().canPublishNewChapter ? 'text-emerald-400' : 'text-rose-400')">
              <mat-icon class="!text-xs">{{ repService.profile().canPublishNewChapter ? 'check_circle' : 'lock' }}</mat-icon>
              {{ repService.profile().canPublishNewChapter ? 'ڕێگەپێدراو' : 'قوفڵ (٥٠ خاڵ)' }}
            </span>
            <span class="text-[9px] text-slate-500 block">Publish Permission</span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-serif block">پێداچوونەوەی هاوتا</span>
            <span [class]="'text-xs font-bold font-serif flex items-center justify-center gap-1 ' +
              (repService.profile().canSubmitPeerReview ? 'text-emerald-400' : 'text-rose-400')">
              <mat-icon class="!text-xs">{{ repService.profile().canSubmitPeerReview ? 'check_circle' : 'lock' }}</mat-icon>
              {{ repService.profile().canSubmitPeerReview ? 'ڕێگەپێدراو' : 'قوفڵ (١٠٠ خاڵ)' }}
            </span>
            <span class="text-[9px] text-slate-500 block">Peer Review Gate</span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-serif block">بەرەو پلەی داهاتوو</span>
            <span class="text-sm font-bold font-mono text-cyan-400">{{ repService.profile().progressPercent }}٪</span>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div class="bg-cyan-400 h-full rounded-full transition-all" [style.width.%]="repService.profile().progressPercent"></div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-1.5 px-4 pt-3 border-b border-slate-800 text-xs font-serif overflow-x-auto">
          <button
            type="button"
            (click)="activeTab.set('PROFILE')"
            [class]="activeTab() === 'PROFILE' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1">
            <mat-icon class="!text-xs">account_box</mat-icon>
            <span>پڕۆفایل و پلەی زانستی</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('QUALITY')"
            [class]="activeTab() === 'QUALITY' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1">
            <mat-icon class="!text-xs">verified</mat-icon>
            <span>پێداچوونەوەی کوالیتی و بەدەستهێنانی خاڵ</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('PEER_REVIEW')"
            [class]="activeTab() === 'PEER_REVIEW' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1">
            <mat-icon class="!text-xs">rate_review</mat-icon>
            <span>پێشکەشکردنی پێداچوونەوەی هاوتا</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('HISTORY')"
            [class]="activeTab() === 'HISTORY' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1">
            <mat-icon class="!text-xs">history</mat-icon>
            <span>مێژووی خاڵەکان (Audit Log)</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-serif">
          
          <!-- TAB 1: PROFILE OVERVIEW -->
          @if (activeTab() === 'PROFILE') {
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-lg">
                    م.پ
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-white">{{ repService.profile().displayName }}</h4>
                    <p class="text-[11px] text-slate-400 font-mono">{{ repService.profile().email }}</p>
                    <div class="mt-1 flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [class]="repService.profile().badgeClass">
                        {{ repService.profile().tierNameKurdish }}
                      </span>
                      <span class="text-slate-400 text-[10px]">پلەی پێداچوونیاری ئەکادیمی</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span class="text-slate-400 block mb-0.5">پێداچوونەوە بەخشراوەکان:</span>
                    <strong class="text-amber-400 font-mono text-xs">{{ repService.profile().totalReviewsGiven }} پێداچوونەوە</strong>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span class="text-slate-400 block mb-0.5">پێداچوونەوە وەرگیراوەکان:</span>
                    <strong class="text-emerald-400 font-mono text-xs">{{ repService.profile().totalReviewsReceived }} هەڵسەنگاندن</strong>
                  </div>
                </div>
              </div>

              <!-- Rules & Permissions Explanation -->
              <div class="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60 space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <h5 class="font-bold text-indigo-300 flex items-center gap-1.5">
                  <mat-icon class="!text-sm text-indigo-400">gavel</mat-icon>
                  مەرجەکانی بەدەستهێنانی دەسەڵات لەسەر بنەمای ناوبانگ:
                </h5>
                <ul class="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>دانانی بەشی نوێ:</strong> پێویستی بە لانیکەم ٥٠ خاڵە بۆ دڵنیابوون لە کوالیتیی دەستپێکی توێژینەوە.</li>
                  <li><strong>پێداچوونەوەی هاوتا (Peer Review):</strong> تەنها ئەو توێژەرانەی خاوەنی ١٠٠ خاڵ یان زیاترن دەتوانن ڕەخنەی هاوتا بنووسن.</li>
                  <li><strong>چۆنیەتی بەدەستهێنانی خاڵ:</strong> لە ڕێگەی پێداچوونەوەی کوالیتیی دەقەکانت، سەلماندنی سەرچاوەی Crossref و بەشداریکردن لە دیالۆگی زانستیدا.</li>
                </ul>
              </div>
            </div>
          }

          <!-- TAB 2: QUALITY REVIEW TO EARN POINTS -->
          @if (activeTab() === 'QUALITY') {
            <div class="space-y-3">
              <div class="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <h5 class="font-bold text-slate-200 flex items-center gap-1.5">
                  <mat-icon class="!text-sm text-amber-400">auto_fix_high</mat-icon>
                  پێداچوونەوەی کوالیتی بۆ بەشەکانی دەستنووسەکەت:
                </h5>
                <p class="text-[11px] text-slate-400">
                  سیستەم شیکاری بۆ زمانەوانی، نەبوونی کڵیشە و بەڵگەمحوەریی بەشەکە دەکات و تاوەکو <strong>+٥٠ خاڵی ناوبانگ</strong> بەخشێت.
                </p>
              </div>

              <div class="space-y-2">
                @for (chapter of editorService.chapters(); track chapter.id) {
                  <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <h6 class="font-bold text-slate-200 truncate">{{ chapter.title }}</h6>
                      <p class="text-[10px] text-slate-400 font-mono mt-0.5">
                        {{ chapter.wordCount || 0 }} وشە • دۆخ: {{ (chapter.content || '').length > 300 ? 'ئامادەی هەڵسەنگاندنە' : 'دەق کەمە' }}
                      </p>
                    </div>

                    <button
                      type="button"
                      (click)="onEvaluateChapter(chapter)"
                      [disabled]="!(chapter.content && chapter.content.length > 100)"
                      class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition text-[11px] cursor-pointer flex items-center gap-1">
                      <mat-icon class="!text-xs">verified</mat-icon>
                      <span>پێداچوونەوە و بەدەستهێنانی خاڵ</span>
                    </button>
                  </div>
                } @empty {
                  <p class="text-center text-slate-500 py-6">هیچ بەشێک لە سەرنووسەردا تۆمار نەکراوە.</p>
                }
              </div>
            </div>
          }

          <!-- TAB 3: SUBMIT PEER REVIEW -->
          @if (activeTab() === 'PEER_REVIEW') {
            <div class="space-y-3">
              @if (!repService.profile().canSubmitPeerReview) {
                <div class="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 space-y-1">
                  <div class="flex items-center gap-2 font-bold">
                    <mat-icon class="!text-sm">lock</mat-icon>
                    <span>دەسەڵاتی پێداچوونەوەی هاوتا قوفڵکراوە</span>
                  </div>
                  <p class="text-[11px] text-rose-200/90 leading-relaxed">
                    ئەم دەسەڵاتە پێویستی بە لانیکەم ١٠٠ خاڵی ناوبانگ هەیە. ئێستا خاوەنی {{ repService.profile().reputationScore }} خاڵیت. تکایە سەرەتا لە بەشی 'پێداچوونەوەی کوالیتی' دەقەکانت هەڵبسەنگێنە تا خاڵی پێویست مسۆگەر بکەیت.
                  </p>
                </div>
              } @else {
                <div class="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <h5 class="font-bold text-slate-200 flex items-center gap-1.5">
                    <mat-icon class="!text-sm text-cyan-400">rate_review</mat-icon>
                    پێشکەشکردنی پێداچوونەوەی زانستی بۆ دەقی توێژەرانی تر:
                  </h5>

                  <div class="space-y-2">
                    <div>
                      <label class="block text-[10.5px] font-bold text-slate-400 mb-1">ناوی توێژەر / ئەکادیمیست:</label>
                      <input
                        type="text"
                        [(ngModel)]="peerAuthor"
                        placeholder="بۆ نموونە: د. ئارام، م. هەڵمەت..."
                        class="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label class="block text-[10.5px] font-bold text-slate-400 mb-1">ناونیشانی توێژینەوە یان بەشەکە:</label>
                      <input
                        type="text"
                        [(ngModel)]="peerTitle"
                        placeholder="ناونیشانی دەقەکە..."
                        class="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label class="block text-[10.5px] font-bold text-slate-400 mb-1">تێبینی، ڕەخنەی میتۆدی و پێشنیاری چاکسازی:</label>
                      <textarea
                        [(ngModel)]="peerCritique"
                        rows="3"
                        placeholder="تێبینییە ڕەخنەیی و ئەکادیمییەکانت لێرە بنووسە..."
                        class="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"></textarea>
                    </div>

                    <button
                      type="button"
                      (click)="onSubmitPeerReview()"
                      [disabled]="!peerAuthor.trim() || !peerTitle.trim() || !peerCritique.trim()"
                      class="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded-xl transition text-xs cursor-pointer flex items-center gap-1.5 shadow-md">
                      <mat-icon class="!text-xs">send</mat-icon>
                      <span>ناردنی پێداچوونەوە و وەرگرتنی +٣٥ خاڵ</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB 4: AUDIT LOG HISTORY -->
          @if (activeTab() === 'HISTORY') {
            <div class="space-y-2">
              @for (item of repService.profile().history; track item.id) {
                <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div class="space-y-0.5 min-w-0">
                    <strong class="text-slate-200 block truncate">{{ item.title }}</strong>
                    <p class="text-[10.5px] text-slate-400 leading-relaxed">{{ item.description }}</p>
                    <span class="text-[9.5px] text-slate-500 font-mono">{{ item.timestamp | date:'short' }}</span>
                  </div>

                  <div class="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono font-bold shrink-0">
                    +{{ item.points }}
                  </div>
                </div>
              }
            </div>
          }

        </div>

        <!-- Footer -->
        <div class="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span class="text-[10.5px] text-slate-400 font-serif">
            سیستەمی ناوبانگی مام پڕۆفیسۆر • بە پێوەری دەستپاکی و ڕەسەنایەتیی زانستی
          </span>
          <button
            type="button"
            (click)="close.emit()"
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer">
            داخستن
          </button>
        </div>

      </div>
    </div>
  `
})
export class UserReputationModalComponent {
  public repService = inject(UserReputationService);
  public editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  close = output<void>();

  activeTab = signal<'PROFILE' | 'QUALITY' | 'PEER_REVIEW' | 'HISTORY'>('PROFILE');

  peerAuthor = '';
  peerTitle = '';
  peerCritique = '';

  onEvaluateChapter(chapter: any): void {
    const res = this.repService.evaluateTextQualityAndAward(chapter.title, chapter.content || '');
    this.toastService.showSuccess('پلەی کوالیتی بەدەستهات', res.verdictKurdish);
  }

  onSubmitPeerReview(): void {
    const res = this.repService.submitPeerReviewAndAward(this.peerAuthor, this.peerTitle, this.peerCritique);
    if (res.success) {
      this.toastService.showSuccess('پێداچوونەوە تەواو بوو', res.message);
      this.peerAuthor = '';
      this.peerTitle = '';
      this.peerCritique = '';
    } else {
      this.toastService.showError('ڕێگری لە پێداچوونەوە', res.message);
    }
  }
}
