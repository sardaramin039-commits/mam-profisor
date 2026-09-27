import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ManuscriptSettings } from './services/settings';

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
            <h3 class="text-sm font-semibold text-slate-100">ڕێکخستنەکانی توێژینەوە</h3>
            <p class="text-xs text-slate-400">ناونیشان، ڕشتەی زانستی و شێوازی سەرچاوەکان</p>
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        @if (settings(); as s) {
          <div class="space-y-1.5">
            <label for="manuscriptTitleInput" class="text-slate-400 font-medium">ناونیشانی توێژینەوە:</label>
            <input 
              id="manuscriptTitleInput"
              #titleInput
              type="text" 
              [value]="s.title" 
              (change)="update('title', titleInput.value)"
              class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="disciplineInput" class="text-slate-400 font-medium">ڕشتەی زانستی:</label>
              <input 
                id="disciplineInput"
                #disciplineInput
                type="text" 
                [value]="s.discipline" 
                (change)="update('discipline', disciplineInput.value)"
                class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div class="space-y-1.5">
              <label for="academicLevelInput" class="text-slate-400 font-medium">ئاستی ئەکادیمی:</label>
              <input 
                id="academicLevelInput"
                #levelInput
                type="text" 
                [value]="s.academicLevel" 
                (change)="update('academicLevel', levelInput.value)"
                class="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SettingsFeatureComponent {
  settings = input<ManuscriptSettings | null>(null);
  updateRequested = output<Partial<ManuscriptSettings>>();

  update(key: keyof ManuscriptSettings, value: string) {
    this.updateRequested.emit({ [key]: value });
  }
}
