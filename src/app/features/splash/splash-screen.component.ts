import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen w-full flex flex-col justify-between items-center text-white bg-cover bg-center select-none" style="background-image: linear-gradient(rgba(44, 14, 18, 0.90), rgba(165, 28, 48, 0.94)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1920');">
      
      <!-- Top Right Floating Vertical Buttons -->
      <div class="absolute top-6 right-6 flex flex-col gap-3 z-50">
        <button (click)="onToggleSettings()" class="flex flex-col items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/20 hover:bg-harvard-crimson hover:text-white transition-all duration-300 shadow-lg cursor-pointer" title="ڕێکخستنە یاساییەکان">
          <mat-icon class="!w-5 !h-5 leading-none">settings</mat-icon>
        </button>
      </div>

      <!-- Center Logo and Monograph Cover style -->
      <div class="my-auto max-w-2xl w-full px-6 text-center py-10 flex flex-col items-center">
        <div class="transform hover:scale-105 transition-transform duration-500 cursor-pointer mb-6" title="VERITAS MAM - HARVARD STYLE">
          <svg class="w-24 h-28 drop-shadow-2xl mx-auto" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 C 90 5, 95 30, 95 65 C 95 95, 75 112, 50 118 C 25 112, 5 95, 5 65 C 5 30, 10 5, 50 5 Z" fill="#A51C30" stroke="#C49A45" stroke-width="3" />
            <path d="M50 10 C 85 10, 90 32, 90 65 C 90 90, 72 106, 50 112 C 28 106, 10 90, 10 65 C 10 32, 15 10, 50 10 Z" fill="#A51C30" stroke="white" stroke-width="1.5" />
            <g transform="translate(18, 25)">
              <rect x="0" y="0" width="22" height="16" rx="1.5" fill="white" stroke="#2C0E12" stroke-width="1"/>
              <line x1="11" y1="0" x2="11" y2="16" stroke="#2C0E12" stroke-width="1"/>
              <text x="3.5" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="7" fill="#A51C30">VE</text>
              <text x="13" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="7" fill="#A51C30">RI</text>
            </g>
            <g transform="translate(60, 25)">
              <rect x="0" y="0" width="22" height="16" rx="1.5" fill="white" stroke="#2C0E12" stroke-width="1"/>
              <line x1="11" y1="0" x2="11" y2="16" stroke="#2C0E12" stroke-width="1"/>
              <text x="3.5" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="7" fill="#A51C30">TA</text>
              <text x="13" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="7" fill="#A51C30">S</text>
            </g>
            <g transform="translate(39, 58)">
              <rect x="0" y="0" width="22" height="16" rx="1.5" fill="white" stroke="#2C0E12" stroke-width="1"/>
              <line x1="11" y1="0" x2="11" y2="16" stroke="#2C0E12" stroke-width="1"/>
              <text x="4" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="6.5" fill="#A51C30">MA</text>
              <text x="14.5" y="11" font-family="'Times New Roman', Georgia, serif" font-weight="900" font-size="6.5" fill="#A51C30">M</text>
            </g>
            <path d="M22 88 Q50 95 78 88" fill="none" stroke="#C49A45" stroke-width="2.5" stroke-linecap="round"/>
            <text x="50" y="103" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="white" font-weight="bold" letter-spacing="0.5">VERITAS</text>
          </svg>
        </div>

        <div class="border-t border-b border-white/20 py-6 px-10 space-y-3 relative w-full mb-8">
          <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#5C131E] px-3 text-[#C49A45] font-serif text-xs">◆</div>
          <h1 class="text-4xl sm:text-6xl font-serif font-bold tracking-normal leading-tight select-all">
            سەرنووسەری ئەکادیمیی مام
          </h1>
          <p class="text-xs sm:text-sm font-serif text-[#C49A45] font-semibold tracking-wide flex justify-center items-center gap-2">
            <span>HARVARD UNIVERSITY IVY-LEAGUE STANDARDS</span>
          </p>
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#5C131E] px-3 text-[#C49A45] font-serif text-xs">◆</div>
        </div>

        <p class="text-sm text-stone-200/95 max-w-xl leading-relaxed mb-8 font-serif">
          پلاتفۆرمی باڵای نووسینی تێز، وتار و گوتارە ڕەسەنەکان بە ڕێبەریی مێتۆدۆلۆژی، بونیادنانی دیار و بەدواداچوونی مەکۆیی ژیریی دەستکرد بە پێوەر و گونجاوترین داڕشتنەوەکانی زانکۆی هارفه‌رد.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <button (click)="enterWorkspace.emit()" class="w-full sm:w-auto flex-1 px-8 py-4 bg-harvard-gold hover:bg-white hover:text-harvard-crimson text-black font-serif font-extrabold text-sm rounded-lg border border-[#C49A45] shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2">
            <mat-icon class="!text-lg">border_color</mat-icon>
            <span>چوونە ناو ناوەندی نووسین</span>
          </button>
          
          <button (click)="openSettings.emit()" class="w-full sm:w-auto flex-1 px-8 py-4 bg-black/40 hover:bg-black/80 text-white font-serif font-bold text-sm rounded-lg border border-white/20 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2">
            <mat-icon class="!text-lg">tune</mat-icon>
            <span>ڕێکخستنی شیکارکار</span>
          </button>
        </div>
      </div>

      <!-- Settings dialog overlay -->
      @if (isSettingsOpen()) {
        <div class="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div class="bg-white text-black max-w-md w-full p-6 shadow-2xl relative rounded-2xl border-4 border-harvard-crimson">
            <button (click)="closeSettings.emit()" class="absolute left-4 top-4 text-stone-500 hover:text-red-700 transition-colors cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
            
            <div class="text-center pb-3 border-b border-stone-150 mb-4">
              <span class="text-[9px] font-mono bg-harvard-crimson text-white px-2 py-0.5 rounded font-bold uppercase">Harvard Engine Standard</span>
              <h3 class="font-serif font-extrabold text-lg text-harvard-crimson mt-2">⚙️ ڕێکخستنی پاڵنەری ژیریی دەستکرد</h3>
            </div>
            
            @if (refineForm()) {
              <div [formGroup]="refineForm()!" class="space-y-4 text-right">
                <div>
                  <span class="block text-xs font-bold text-stone-700 mb-1">پلەی گەرمی نووسینی هارفەرد (Temperature):</span>
                  <div class="flex items-center gap-3">
                    <input type="range" min="0" max="1" step="0.1" formControlName="temperature" class="w-full accent-harvard-crimson cursor-pointer" />
                    <span class="font-mono text-xs font-semibold bg-stone-100 px-2 py-1 rounded">{{ refineForm()?.get('temperature')?.value }}</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="block text-xs font-bold text-stone-700 mb-1">تۆکێنی بیرکردنەوە:</span>
                    <input type="number" formControlName="thinkingTokens" class="w-full text-xs p-2.5 border border-stone-300 rounded focus:border-harvard-crimson focus:outline-none" />
                  </div>
                  <div>
                    <span class="block text-xs font-bold text-stone-700 mb-1">تۆکێنی نووسین:</span>
                    <input type="number" formControlName="writingTokens" class="w-full text-xs p-2.5 border border-stone-300 rounded focus:border-harvard-crimson focus:outline-none" />
                  </div>
                </div>
                <div class="flex items-center justify-between border-t border-stone-150 pt-3">
                  <span class="text-xs font-bold text-stone-700">بەرگری تێز (Simulated Thesis defense):</span>
                  <button type="button" (click)="refineForm()?.patchValue({thesisDefense: !refineForm()?.get('thesisDefense')?.value})" class="px-3.5 py-1.5 text-xs font-bold border rounded transition-all cursor-pointer" [class.bg-harvard-crimson]="refineForm()?.get('thesisDefense')?.value" [class.text-white]="refineForm()?.get('thesisDefense')?.value" [class.border-stone-300]="!refineForm()?.get('thesisDefense')?.value">
                    {{ refineForm()?.get('thesisDefense')?.value ? 'ئۆن (چالاکە)' : 'ئۆف' }}
                  </button>
                </div>
                <button (click)="closeSettings.emit()" class="w-full bg-harvard-crimson hover:bg-harvard-dark text-white hover:bg-neutral-800 text-xs font-serif font-bold py-3 rounded-lg transition-all mt-2 cursor-pointer shadow-md">
                  مۆرکردن و جێگیرکردنی ڕێکخستنەکان
                </button>
              </div>
            }
          </div>
        </div>
      }

      <div class="mb-8 text-center text-xs text-stone-350/80 font-serif">
        <p>VERITAS ── HARVARD UNIVERSITY ACADEMIC WRITING SUITE ── EST. 1636</p>
      </div>

    </div>
  `
})
export class SplashScreenComponent {
  refineForm = input<FormGroup | null>(null);
  isSettingsOpen = input<boolean>(false);

  enterWorkspace = output<void>();
  openSettings = output<void>();
  closeSettings = output<void>();

  onToggleSettings() {
    if (this.isSettingsOpen()) {
      this.closeSettings.emit();
    } else {
      this.openSettings.emit();
    }
  }
}
