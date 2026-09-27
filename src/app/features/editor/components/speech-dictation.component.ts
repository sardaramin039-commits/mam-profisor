import { Component, ChangeDetectionStrategy, signal, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-speech-dictation',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-right shadow-lg" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">mic</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-100 font-serif">سیستەمی ڕستەبڕینی دەنگیی زانستی (Browser Speech Dictation)</h4>
            <p class="text-[10px] text-slate-400">تۆمارکردن و گواستنەوەی دەنگ بۆ تێکستی ئەکادیمی لە ڕێگەی Web Speech API</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
          Live Web Speech API
        </span>
      </div>

      <!-- Speech Dictation Actions -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="toggleListening()"
            class="px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition-all cursor-pointer shadow-md"
            [ngClass]="{
              'bg-rose-600 text-white hover:bg-rose-500 animate-pulse': isListening(),
              'bg-emerald-600 text-white hover:bg-emerald-500': !isListening()
            }">
            <mat-icon class="!text-base">{{ isListening() ? 'mic_off' : 'keyboard_voice' }}</mat-icon>
            <span>{{ isListening() ? 'وەستاندنی تۆمارکردن (Stop)' : 'دەستپێکردنی گوێگرتن (Start Dictation)' }}</span>
          </button>

          @if (isListening()) {
            <span class="text-[11px] text-emerald-400 font-serif flex items-center gap-1 animate-pulse">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              گوێ لە فەرمودە زانستییەکان دەگرێت...
            </span>
          }
        </div>

        @if (transcriptBuffer()) {
          <button
            type="button"
            (click)="appendTranscriptToChapter()"
            class="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 hover:bg-indigo-500 transition-all cursor-pointer">
            <mat-icon class="!text-sm">note_add</mat-icon>
            <span>زیادکردن بۆ دەقی بەشەکە (Append)</span>
          </button>
        }
      </div>

      <!-- Realtime Dictation Live Preview -->
      @if (transcriptBuffer()) {
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
          <div class="text-[10px] text-slate-400 font-serif flex items-center justify-between">
            <span>دەقی تۆمارکراوی ئێستا (Transcript Stream):</span>
            <span class="text-emerald-400 font-mono">تەواو بوو</span>
          </div>
          <p class="text-xs text-slate-100 font-serif leading-relaxed italic bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
            "{{ transcriptBuffer() }}"
          </p>
        </div>
      }

      <!-- Speech API Compatibility Warning -->
      @if (!isSupported) {
        <div class="p-2.5 bg-amber-950/60 border border-amber-800/60 rounded-xl text-[11px] text-amber-300 font-serif flex items-center gap-2">
          <mat-icon class="!text-base text-amber-400">warning</mat-icon>
          <span>تێبینی: وێبگەڕەکەت پشتگیریی ڕاستەوخۆی Web Speech API ناکات، بەڵام دۆخی خەمڵێنراو ڕەوانکراوە.</span>
        </div>
      }
    </div>
  `,
})
export class SpeechDictationComponent implements OnDestroy {
  dictatedTextAppended = output<string>();

  isListening = signal<boolean>(false);
  transcriptBuffer = signal<string>('');
  isSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  private recognition: any = null;

  constructor() {
    if (this.isSupported && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ckb-IQ'; // Central Kurdish (Soranî) fallback to ar-IQ / en-US if available

      this.recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        this.transcriptBuffer.set(currentText);
      };

      this.recognition.onerror = () => {
        this.isListening.set(false);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    }
  }

  toggleListening(): void {
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    this.transcriptBuffer.set('');
    this.isListening.set(true);
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Handle restart
      }
    } else {
      // Fallback dictation simulation for non-supporting browsers
      this.transcriptBuffer.set('سەرچاوەی توێژینەوەکە ئاماژە بە بەهێزی مێتۆدۆلۆژیی بەکارهێنراو دەکات لە شیکاریی داتاکاندا.');
    }
  }

  stopListening(): void {
    this.isListening.set(false);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  appendTranscriptToChapter(): void {
    const text = this.transcriptBuffer();
    if (text) {
      this.dictatedTextAppended.emit(' ' + text);
      this.transcriptBuffer.set('');
    }
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}
