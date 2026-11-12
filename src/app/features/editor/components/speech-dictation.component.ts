import { Component, ChangeDetectionStrategy, signal, output, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GeminiSseStreamService } from '../../../services/gemini-sse.service';

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
            <h4 class="text-xs font-bold text-slate-100 font-serif">ڕستەبڕینی دەنگیی زیرەک (Gemini Multimodal inlineData Dictation)</h4>
            <p class="text-[10px] text-slate-400">گواستنەوەی دەنگ بۆ تێکستی ئەکادیمیی پاراو بە هێزی مۆدێلی فرەڕەهەندی Gemini</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
          <mat-icon class="!text-[10px] !w-3 !h-3 text-emerald-400">auto_awesome</mat-icon>
          Gemini Multimodal Audio
        </span>
      </div>

      <!-- Speech Dictation Actions -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="toggleGeminiAudioRecording()"
            [disabled]="isTranscribing()"
            class="px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            [ngClass]="{
              'bg-rose-600 text-white hover:bg-rose-500 animate-pulse': isRecording(),
              'bg-emerald-600 text-white hover:bg-emerald-500': !isRecording()
            }">
            <mat-icon class="!text-base">{{ isRecording() ? 'stop' : 'mic' }}</mat-icon>
            <span>{{ isRecording() ? 'ڕاگرتن و شیکارکردنی دەنگ' : 'تۆمارکردن بە دەنگی کوردی (Gemini Audio)' }}</span>
          </button>

          @if (isTranscribing()) {
            <span class="text-[11px] text-amber-400 font-serif flex items-center gap-1 animate-pulse">
              <mat-icon class="!text-sm animate-spin">autorenew</mat-icon>
              خەریکی وەرگێڕانی دەنگ بۆ دەقی ئەکادیمی بە Gemini...
            </span>
          }

          @if (isRecording()) {
            <span class="text-[11px] text-rose-400 font-serif flex items-center gap-1 animate-pulse">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              تۆمارکردن چالاکە... قسە بکە
            </span>
          }
        </div>

        @if (transcriptBuffer()) {
          <button
            type="button"
            (click)="appendTranscriptToChapter()"
            class="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 hover:bg-indigo-500 transition-all cursor-pointer shadow-md">
            <mat-icon class="!text-sm">note_add</mat-icon>
            <span>زیادکردن بۆ دەقی بەشەکە (Append)</span>
          </button>
        }
      </div>

      <!-- Realtime Dictation Live Preview -->
      @if (transcriptBuffer()) {
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
          <div class="text-[10px] text-slate-400 font-serif flex items-center justify-between">
            <span>دەقی وەرگێڕدراوی ئەکادیمی (Pristine Kurdish Academic Prose):</span>
            <span class="text-emerald-400 font-mono">ئامادەیە</span>
          </div>
          <p class="text-xs text-slate-100 font-serif leading-relaxed italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60 selection:bg-emerald-500 selection:text-white">
            "{{ transcriptBuffer() }}"
          </p>
        </div>
      }
    </div>
  `
})
export class SpeechDictationComponent implements OnDestroy {
  dictatedTextAppended = output<string>();

  private geminiSse = inject(GeminiSseStreamService);

  isRecording = signal<boolean>(false);
  isTranscribing = signal<boolean>(false);
  transcriptBuffer = signal<string>('');

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async toggleGeminiAudioRecording(): Promise<void> {
    if (this.isRecording()) {
      await this.stopGeminiAudioRecording();
    } else {
      await this.startGeminiAudioRecording();
    }
  }

  async startGeminiAudioRecording(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.transcriptBuffer.set('مایکرۆفۆن لەم وێبگەڕەدا پشتگیری ناکرێت.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        await this.processRecordedAudio(audioBlob, mimeType);
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      this.isRecording.set(false);
      this.transcriptBuffer.set('ڕێگەپێدانی مایکرۆفۆن ڕەتکرایەوە یان ئامێرەکە ئامادە نییە.');
    }
  }

  async stopGeminiAudioRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
  }

  private async processRecordedAudio(audioBlob: Blob, mimeType: string): Promise<void> {
    this.isTranscribing.set(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      this.geminiSse.transcribeAudio(audioBase64, mimeType).subscribe({
        next: (res) => {
          this.isTranscribing.set(false);
          if (res.success && res.transcript) {
            this.transcriptBuffer.set(res.transcript);
          }
        },
        error: (err) => {
          this.isTranscribing.set(false);
          console.error('Audio transcription failed:', err);
          this.transcriptBuffer.set('وەرگێڕانی دەنگ سەرکەوتوو نەبوو، تکایە دووبارە تاقی بکەرەوە.');
        }
      });
    } catch (err) {
      this.isTranscribing.set(false);
      console.error('Error processing audio:', err);
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
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
