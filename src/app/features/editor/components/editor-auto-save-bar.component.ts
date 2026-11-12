import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AutoSaveManagerService } from '../../../services/auto-save-manager.service';

@Component({
  selector: 'app-editor-auto-save-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-3.5 py-2 bg-stone-100/90 border border-stone-300 rounded-xl flex items-center justify-between gap-2 flex-wrap text-right font-serif shadow-2xs mb-2">
      <!-- Status info -->
      <div class="flex items-center gap-2 text-xs text-stone-700">
        @if (autoSave.isAutoSaving()) {
          <div class="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-amber-800 font-bold">خەریکی پاشەکەوتکردنە لە IndexedDB...</span>
        } @else if (autoSave.lastAutoSaveTime()) {
          <mat-icon class="!text-sm text-emerald-700 leading-none">cloud_done</mat-icon>
          <span class="text-stone-800">
            خۆکار پاشەکەوتکراوە لە IndexedDB: <strong>{{ autoSave.lastAutoSaveTime() }}</strong>
          </span>
        } @else {
          <mat-icon class="!text-sm text-stone-500 leading-none">cloud_queue</mat-icon>
          <span class="text-stone-600">پاشەکەوتکردنی خۆکار (IndexedDB Auto-Save) چالاکە</span>
        }
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          (click)="triggerSaveNow.emit()"
          [disabled]="autoSave.isAutoSaving()"
          title="پاشەکەوتکردنی ڕاستەوخۆ لە مێمۆریی لۆکاڵ"
          class="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer">
          <mat-icon class="!text-xs">save</mat-icon>
          <span>پاشەکەوتکردنی دەستی</span>
        </button>

        @if (autoSave.hasLocalDraft()) {
          <button
            type="button"
            (click)="triggerRestore.emit()"
            title="گەڕاندنەوەی دوا ڕەشنووسی پاشەکەوتکراوی بەشەکان لە IndexedDB"
            class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs">
            <mat-icon class="!text-xs">history</mat-icon>
            <span>گەڕاندنەوە لە مێمۆری (Restore from local)</span>
          </button>
        }
      </div>
    </div>
  `
})
export class EditorAutoSaveBarComponent {
  autoSave = inject(AutoSaveManagerService);
  triggerSaveNow = output<void>();
  triggerRestore = output<void>();
}
