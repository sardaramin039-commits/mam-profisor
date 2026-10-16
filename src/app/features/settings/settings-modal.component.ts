import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ManuscriptSettings } from './services/settings';
import { GeminiRequestManagerService } from '../../services/gemini-request-manager.service';

@Component({
  selector: 'app-settings-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/10">
            <mat-icon class="text-xl">settings</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">ڕێکخستنەکانی توێژینەوە و ژیریی دەستکرد</h3>
            <p class="text-xs text-slate-400">ناونیشان، خولانەوەی کلیلی API (Key Rotation) و مۆدێلی Gemini</p>
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        @if (settings(); as s) {
          <div class="space-y-1.5">
            <label for="manuscriptTitleInput" class="text-slate-300 font-medium">ناونیشانی توێژینەوە:</label>
            <input 
              id="manuscriptTitleInput"
              #titleInput
              type="text" 
              [value]="s.title" 
              (change)="update('title', titleInput.value)"
              class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 font-serif"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="disciplineInput" class="text-slate-300 font-medium">ڕشتەی زانستی:</label>
              <input 
                id="disciplineInput"
                #disciplineInput
                type="text" 
                [value]="s.discipline" 
                (change)="update('discipline', disciplineInput.value)"
                class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 font-serif"
              />
            </div>
            <div class="space-y-1.5">
              <label for="academicLevelInput" class="text-slate-300 font-medium">ئاستی ئەکادیمی:</label>
              <input 
                id="academicLevelInput"
                #levelInput
                type="text" 
                [value]="s.academicLevel" 
                (change)="update('academicLevel', levelInput.value)"
                class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 font-serif"
              />
            </div>
          </div>
        }

        <!-- Gemini Multi-API Key Rotation & Model Selection -->
        <div class="pt-4 border-t border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <mat-icon class="!text-sm">vpn_key</mat-icon>
              خولانەوەی چەندین کلیلی Gemini API (Key Rotation)
            </span>
            <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {{ geminiManager.apiKeys().length }} کلیل تۆمارکراوە
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            دەتوانیت چەند کلیلێکی جیاوازی Gemini بە کۆما (,) یان دێڕی نوێ لێرە بنووسیت. لەکاتی بەربەستی کوۆتا (429 Quota Exceeded)، سیستەمەکە خۆکارانە دەچێتە سەر کلیلی دواتر بەبێ پچڕان:
          </p>
          <textarea
            #apiKeysInput
            rows="3"
            placeholder="AIzaSy..., AIzaSy..."
            [value]="geminiManager.apiKeys().join('\n')"
            (change)="geminiManager.setApiKeys(apiKeysInput.value)"
            class="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:border-amber-500"
          ></textarea>

          <div class="flex items-center justify-between gap-3 pt-1">
            <label class="text-slate-300 font-medium">مۆدێلی ژیریی دەستکرد (Gemini Model):</label>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="geminiManager.setPreferredModel('gemini-2.5-flash')"
                [class]="geminiManager.preferredModel() === 'gemini-2.5-flash' 
                  ? 'bg-amber-600 text-white font-bold border-amber-500' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'"
                class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition">
                gemini-2.5-flash
              </button>
              <button
                type="button"
                (click)="geminiManager.setPreferredModel('gemini-2.5-pro')"
                [class]="geminiManager.preferredModel() === 'gemini-2.5-pro' 
                  ? 'bg-amber-600 text-white font-bold border-amber-500' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'"
                class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition">
                gemini-2.5-pro
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class SettingsFeatureComponent {
  readonly geminiManager = inject(GeminiRequestManagerService);

  settings = input<ManuscriptSettings | null>(null);
  updateRequested = output<Partial<ManuscriptSettings>>();

  update(key: keyof ManuscriptSettings, value: string) {
    this.updateRequested.emit({ [key]: value });
  }
}
