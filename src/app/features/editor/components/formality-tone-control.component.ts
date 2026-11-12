import { Component, ChangeDetectionStrategy, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface FormalityToneConfig {
  formalityLevel: 'strictly_formal' | 'semi_formal' | 'accessible' | 'hybrid_blend';
  depthLevel: 'deep_analysis' | 'standard_depth' | 'concise_summary';
  customStylePrompt?: string;
}

@Component({
  selector: 'app-formality-tone-control',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-right shadow-lg" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">tune</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-100 font-serif">ڕێکخستنی ئاستی فەرمییەتی و قووڵیی زمانی دەق</h4>
            <p class="text-[10px] text-slate-400">دەستکاریی تۆنی داڕشتن لە ڕەسمیی زۆرەوە تا ڕوونی سادە یان تێکەڵە</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono">
          Tone & Formality Switcher
        </span>
      </div>

      <!-- Main Controls Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <!-- Formality Level -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-slate-300 font-serif">
            ئاستی فەرمییەتی (Formality Level):
          </label>
          <select
            [ngModel]="currentConfig().formalityLevel"
            (ngModelChange)="updateFormality($event)"
            class="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 font-serif focus:outline-none focus:border-indigo-500 cursor-pointer">
            <option value="strictly_formal">🏛️ فەرمی زۆر (Strictly Formal) - گوتاری باڵای هارفەرد</option>
            <option value="semi_formal">📑 ئاستی مامناوەند (Semi-Formal) - زانستی و ڕوون</option>
            <option value="accessible">👥 ئاستی نزیک لە خەڵک (Accessible) - زمانی سادەکراو</option>
            <option value="hybrid_blend">⚡ تێکەڵەی ئەکادیمی و نزیک لە خەڵک (Hybrid Academic-Accessible)</option>
          </select>
        </div>

        <!-- Depth Level -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-slate-300 font-serif">
            قووڵیی شیکاری و زانیاری (Depth Level):
          </label>
          <select
            [ngModel]="currentConfig().depthLevel"
            (ngModelChange)="updateDepth($event)"
            class="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 font-serif focus:outline-none focus:border-indigo-500 cursor-pointer">
            <option value="deep_analysis">🔬 شیکاریی قووڵی ئەکادیمی (Deep Research & Analytical Depth)</option>
            <option value="standard_depth">📘 ئاستی پێوەری زانستی (Standard Academic Depth)</option>
            <option value="concise_summary">💡 کورتکراوە و ڕوونکردنەوەی خێرا (Concise Overview)</option>
          </select>
        </div>
      </div>

      <!-- Explanation Banner -->
      <div class="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-start gap-2 font-serif">
        <mat-icon class="text-indigo-400 !text-sm flex-none mt-0.5">info</mat-icon>
        <p class="leading-relaxed">
          @switch (currentConfig().formalityLevel) {
            @case ('strictly_formal') {
              <strong>فەرمی زۆر:</strong> دەقەکە بە زاراوەی توندی زانستی، مێتۆدۆلۆژیی پێشکەوتوو و بەبێ بەکارهێنانی ئیدیۆمی لۆکاڵی داڕێژرێتەوە.
            }
            @case ('semi_formal') {
              <strong>ئاستی مامناوەند:</strong> گواستنەوەی بیرۆکە ئەکادیمییەکان بە زمانێکی پوخت، ڕوون و بێ ئاڵۆزی.
            }
            @case ('accessible') {
              <strong>ئاستی نزیک لە خەڵک:</strong> شیکردنەوەی چەمکە ئەکادیمییە قورسەکان بە زمانێکی سادە تا هەموو خوێنەرێک تێیبگات.
            }
            @case ('hybrid_blend') {
              <strong>تێکەڵەی ئەکادیمی و نزیک لە خەڵک:</strong> بەیەکەوەبەستنی بڕگە ئەکادیمییە تۆکمەکان لەگەڵ ڕوونکردنەوەی سادە بۆ خەڵک تا خوێندنەوەی ئاسان بیت.
            }
          }
        </p>
      </div>
    </div>
  `
})
export class FormalityToneControlComponent {
  configInput = input<FormalityToneConfig>();
  configChanged = output<FormalityToneConfig>();

  currentConfig = signal<FormalityToneConfig>({
    formalityLevel: 'strictly_formal',
    depthLevel: 'deep_analysis'
  });

  updateFormality(level: FormalityToneConfig['formalityLevel']): void {
    const updated = { ...this.currentConfig(), formalityLevel: level };
    this.currentConfig.set(updated);
    this.configChanged.emit(updated);
  }

  updateDepth(depth: FormalityToneConfig['depthLevel']): void {
    const updated = { ...this.currentConfig(), depthLevel: depth };
    this.currentConfig.set(updated);
    this.configChanged.emit(updated);
  }
}
