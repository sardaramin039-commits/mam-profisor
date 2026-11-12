import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time?: string;
}

@Component({
  selector: 'app-chat-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/10">
            <mat-icon class="text-xl">psychology</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">یارمەتیدەری ئەکادیمیی AI</h3>
            <p class="text-xs text-slate-400">ڕاوێژکاری توێژینەوە و گوتاری زانستی</p>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        @if (messages().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 space-y-3">
            <mat-icon class="text-4xl text-amber-400">auto_awesome</mat-icon>
            <p class="text-sm font-medium">پرسیاری ئەکادیمی، شیكردنەوە یان داواکاری ڕەخنەیی خۆت بنووسە.</p>
          </div>
        } @else {
          @for (msg of messages(); track $index) {
            <div [class]="msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div [class]="msg.sender === 'user' 
                ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-md text-sm leading-relaxed' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md text-sm leading-relaxed'">
                <p class="whitespace-pre-wrap">{{ msg.text }}</p>
                @if (msg.time) {
                  <span class="text-[10px] opacity-60 block mt-1 text-left">{{ msg.time }}</span>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Input Bar -->
      <div class="p-3 bg-slate-800/90 border-t border-slate-700/60 flex items-center gap-2">
        <input
          #chatInput
          type="text"
          placeholder="پەیامەکەت بنووسە..."
          (keyup.enter)="sendMessage(chatInput)"
          class="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          (click)="sendMessage(chatInput)"
          class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center"
          title="ناردن">
          <mat-icon class="text-xl">send</mat-icon>
        </button>
      </div>
    </div>
  `
})
export class ChatFeatureComponent {
  messages = input<ChatMessage[]>([]);
  sendMessageEvent = output<string>();

  sendMessage(inputEl: HTMLInputElement) {
    const text = inputEl.value.trim();
    if (text) {
      this.sendMessageEvent.emit(text);
      inputEl.value = '';
    }
  }
}
