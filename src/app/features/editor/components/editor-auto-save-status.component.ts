import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EditorSyncFeedbackService } from '../../../services/editor-sync-feedback.service';
import { AutoSaveManagerService } from '../../../services/auto-save-manager.service';

@Component({
  selector: 'app-editor-auto-save-status',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-sans select-none transition-all duration-300 border shadow-2xs"
      [class.bg-amber-50]="isSaving()"
      [class.border-amber-300]="isSaving()"
      [class.text-amber-800]="isSaving()"
      [class.bg-emerald-50]="!isSaving() && syncState() === 'synced'"
      [class.border-emerald-250]="!isSaving() && syncState() === 'synced'"
      [class.text-emerald-800]="!isSaving() && syncState() === 'synced'"
      [class.bg-stone-100]="!isSaving() && syncState() !== 'synced'"
      [class.border-stone-250]="!isSaving() && syncState() !== 'synced'"
      [class.text-stone-600]="!isSaving() && syncState() !== 'synced'"
      [title]="statusTooltip()">
      
      <!-- Status Icon / Spinner -->
      @if (isSaving()) {
        <span class="relative flex h-2 w-2 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <mat-icon class="!text-xs !w-3.5 !h-3.5 animate-spin leading-none text-amber-700">sync</mat-icon>
        <span class="font-medium text-[11px] animate-pulse">خەریکی پاشەکەوتکردنە...</span>
        <span class="text-[9.5px] text-amber-600 font-mono hidden sm:inline">(Auto-Saving...)</span>
      } @else if (syncState() === 'synced') {
        <mat-icon class="!text-xs !w-3.5 !h-3.5 leading-none text-emerald-600">cloud_done</mat-icon>
        <span class="font-medium text-[11px] text-emerald-900">هاوکاتکراوە لەگەڵ خەزێنە</span>
        @if (displayTime()) {
          <span class="text-[10px] text-emerald-700 font-mono border-r border-emerald-300/80 pr-1.5 mr-0.5">
            {{ displayTime() }}
          </span>
        }
      } @else {
        <mat-icon class="!text-xs !w-3.5 !h-3.5 leading-none text-stone-500">cloud</mat-icon>
        <span class="text-[11px] text-stone-700">پاشەکەوتکردنی خۆکار چالاکە</span>
      }

      <!-- Manual Sync Trigger Button -->
      <button 
        type="button"
        (click)="manualSyncRequested.emit()"
        [disabled]="isSaving()"
        class="ml-1 p-0.5 hover:bg-black/5 rounded text-stone-500 hover:text-stone-900 transition disabled:opacity-40 cursor-pointer"
        title="پاشەکەوتکردنی دەستبەجێ لە مێمۆری و خەزێنەی بەکئێند">
        <mat-icon class="!text-[11px] !w-3 !h-3 leading-none">refresh</mat-icon>
      </button>
    </div>
  `
})
export class EditorAutoSaveStatusComponent {
  syncFeedback = inject(EditorSyncFeedbackService);
  autoSave = inject(AutoSaveManagerService);

  // Optional overrides from parent
  overrideSaving = input<boolean | null>(null);
  overrideTime = input<string | null>(null);

  manualSyncRequested = output<void>();

  isSaving(): boolean {
    if (this.overrideSaving() !== null) {
      return this.overrideSaving()!;
    }
    return this.syncFeedback.isAutoSaving() || this.autoSave.isAutoSaving();
  }

  syncState(): string {
    return this.syncFeedback.syncState();
  }

  displayTime(): string {
    if (this.overrideTime()) {
      return this.overrideTime()!;
    }
    return this.syncFeedback.lastSyncTime() || this.autoSave.lastAutoSaveTime();
  }

  statusTooltip(): string {
    if (this.isSaving()) {
      return 'خەریکی پاشەکەوتکردن و هاوکاتکردنی دەق لەگەڵ داتابەیسی بەکئێند...';
    }
    return `هاوکاتکراوە بە تەواوی لەگەڵ خەزێنەی بەکئێند لە: ${this.displayTime()}`;
  }
}
