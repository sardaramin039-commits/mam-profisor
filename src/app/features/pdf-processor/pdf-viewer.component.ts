import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pdf-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-rose-500/10">
            <mat-icon class="text-xl">picture_as_pdf</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">پرۆسێسەری بەڵگەنامەی PDF</h3>
            <p class="text-xs text-slate-400">دەرهێنانی دەق و پارچەکردنی زانستی</p>
          </div>
        </div>
      </div>

      <!-- Upload & Content Area -->
      <div class="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
        <div class="w-full max-w-md p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-800/40 text-center transition-all cursor-pointer group flex flex-col items-center justify-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <mat-icon class="text-2xl">cloud_upload</mat-icon>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-slate-200">فایلی PDF هەڵبژێرە یان ڕایبکێشە ئێرە</p>
            <p class="text-xs text-slate-400">پشتیوانی لە پەڕتووکی ئەکادیمی و گۆڤارە زانستییەکان دەکات</p>
          </div>
          <button 
            (click)="triggerUpload()"
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/10">
            هەڵبژاردنی فایل
          </button>
        </div>

        @if (isProcessing()) {
          <div class="flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-xl">
            <div class="animate-spin text-amber-400 flex items-center justify-center">
              <mat-icon>sync</mat-icon>
            </div>
            <span class="text-xs text-slate-300 font-medium">لە پرۆسێسدایە... چاوەڕوان بە</span>
          </div>
        }
      </div>
    </div>
  `
})
export class PdfFeatureComponent {
  isProcessing = input<boolean>(false);
  uploadRequested = output<void>();

  triggerUpload() {
    this.uploadRequested.emit();
  }
}
