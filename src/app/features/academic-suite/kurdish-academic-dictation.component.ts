import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

@Component({
  selector: 'app-kurdish-academic-dictation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div [class]="isListening() ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-br from-indigo-500 to-purple-600'"
               class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all">
            <mat-icon class="!text-xl !w-5 !h-5">{{ isListening() ? 'mic' : 'mic_none' }}</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>دەنگبێژی و دەنگنووسی ئەکادیمی (Kurdish Academic Dictation)</span>
              <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                Web Speech API
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              تۆمارکردنی دەنگیی تێبینی و دەقەکانی توێژینەوە بە زمانی کوردی بەبێ بەکارهێنانی دەست
            </p>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2">
          @if (isListening()) {
            <button (click)="stopListening()"
                    class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer animate-pulse">
              <mat-icon class="!text-sm !w-4 !h-4">stop</mat-icon>
              <span>ڕاگرتنی تۆمارکردن</span>
            </button>
          } @else {
            <button (click)="startListening()"
                    [disabled]="!isSupported()"
                    class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer">
              <mat-icon class="!text-sm !w-4 !h-4">mic</mat-icon>
              <span>دەستپێکردنی دەنگنووس</span>
            </button>
          }
        </div>
      </div>

      @if (!isSupported()) {
        <div class="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center gap-2">
          <mat-icon class="text-amber-400 !text-base !w-4 !h-4">warning</mat-icon>
          <span>وێبگەڕەکەت پشتگیریی Speech Recognition ناکات. تکایە Chrome یان Edge بەکاربهێنە.</span>
        </div>
      }

      <!-- Speech Status & Live Pulse -->
      <div class="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800/80 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full"
                [class]="isListening() ? 'bg-rose-500 animate-ping' : 'bg-slate-600'"></span>
          <span class="text-slate-300">
            {{ isListening() ? 'خەریکی گوێگرتنە... ئێستا بدوێ بە کوردی' : 'ئامادەیە بۆ گوێگرتن' }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span>زمان: کوردی (سۆرانی / ناوەندی)</span>
          <span class="text-indigo-400">|</span>
          <span>وشە: {{ wordCount() }}</span>
        </div>
      </div>

      <!-- Transcript Area -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-300">دەقی دەنگنووسراو (Live Transcript):</label>
        <textarea
          [ngModel]="transcript()"
          (ngModelChange)="transcript.set($event)"
          rows="4"
          placeholder="دەنگت لەم بۆشاییەدا دەگۆڕێت بۆ دەق... یاخود ڕاستەوخۆ دەتوانیت لێرە دەستکاریی بکەیت."
          class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 font-serif leading-relaxed focus:outline-none resize-y">
        </textarea>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
        <div class="flex items-center gap-2">
          <button (click)="appendAcademicConnector('هەروەها، ')"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition cursor-pointer">
            + هەروەها
          </button>
          <button (click)="appendAcademicConnector('لە لایەکی ترەوە، ')"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition cursor-pointer">
            + لە لایەکی ترەوە
          </button>
          <button (click)="appendAcademicConnector('بۆیە، دەکرێت بگوترێت کە ')"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition cursor-pointer">
            + دەرئەنجام
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="copyTranscript()"
                  [disabled]="!transcript().trim()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer">
            <mat-icon class="!text-xs !w-3.5 !h-3.5 text-indigo-400">content_copy</mat-icon>
            <span>کۆپیکردن</span>
          </button>

          <button (click)="insertIntoActiveChapter()"
                  [disabled]="!transcript().trim() || !activeChapter()"
                  class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs">
            <mat-icon class="!text-sm !w-4 !h-4">post_add</mat-icon>
            <span>ناردن بۆ ناو بەشی چالاک</span>
          </button>

          <button (click)="clearTranscript()"
                  [disabled]="!transcript().trim()"
                  class="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs transition cursor-pointer"
                  title="سڕینەوە">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">delete</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class KurdishAcademicDictationComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);

  activeChapter = input<ChapterItem | null>(null);

  isListening = signal<boolean>(false);
  transcript = signal<string>('');
  isSupported = signal<boolean>(true);

  private recognition: any = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.isSupported.set(false);
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ckb-IQ'; // Kurdish Central / Sorani fallback

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          const current = this.transcript();
          this.transcript.set(current ? `${current.trim()} ${finalTranscript.trim()}` : finalTranscript.trim());
        }
      };

      this.recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err?.error);
        if (err?.error === 'not-allowed') {
          this.toastService.showWarning('ڕێگەپێدانی مایکرۆفۆن', 'تکایە لە وێبگەڕەکەتدا مۆڵەتی بەکارهێنانی مایکرۆفۆن بدە.');
          this.isListening.set(false);
        }
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    } catch (e) {
      this.isSupported.set(false);
    }
  }

  startListening(): void {
    if (!this.recognition) return;
    try {
      this.recognition.start();
      this.isListening.set(true);
      this.toastService.showInfo('دەنگنووس چالاک کرا', 'مایکرۆفۆن کراوەیە؛ دەتوانیت دەست بە ئاخاوتن بکەیت.');
    } catch {
      this.isListening.set(false);
    }
  }

  stopListening(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
      this.isListening.set(false);
      this.toastService.showSuccess('تۆمارکردن ڕاگیرا', 'دەقە دەنگنووسراوەکە ئامادەیە بۆ سوودوەرگرتن.');
    } catch {
      this.isListening.set(false);
    }
  }

  appendAcademicConnector(connector: string): void {
    const current = this.transcript();
    this.transcript.set(current ? `${current.trim()} ${connector}` : connector);
  }

  copyTranscript(): void {
    const text = this.transcript();
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.showSuccess('کۆپی کرا', 'دەق خرایە ناو کلیپبۆردەوە.');
    });
  }

  insertIntoActiveChapter(): void {
    const text = this.transcript().trim();
    const ch = this.activeChapter();
    if (!ch || !text) {
      this.toastService.showWarning('ناردن', 'تکایە سەرەتا بەشێک دیاری بکە و کەمێک دەق دەنگنووس بکە.');
      return;
    }

    const current = (ch.content || '').trim();
    const updated = current ? `${current}\n\n${text}` : text;
    this.editorService.updateChapterContent(ch.id, updated, 'دەنگنووسی ئەکادیمی');
    this.toastService.showSuccess('زیاد کرا', `دەقی دەنگنووسراو بۆ ناو «${ch.title}» زیاد کرا.`);
    this.transcript.set('');
  }

  clearTranscript(): void {
    this.transcript.set('');
  }

  wordCount(): number {
    const text = this.transcript().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }
}
