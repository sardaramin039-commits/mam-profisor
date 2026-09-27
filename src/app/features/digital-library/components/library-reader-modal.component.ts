import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-reader-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lib.isReaderOpen() && lib.activeBook()) {
      <div class="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
        
        <!-- Reader Dialog Container -->
        <div class="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
          
          <!-- Reader Top Navbar -->
          <div class="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-3 text-stone-200">
            
            <!-- Book Info & Title -->
            <div class="flex items-center gap-3 truncate">
              <button (click)="lib.closeReader()" class="p-2 text-stone-400 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-stone-800">
                <mat-icon class="!w-5 !h-5">arrow_back</mat-icon>
              </button>
              <div class="truncate">
                <h2 class="font-serif font-bold text-sm sm:text-base text-amber-300 truncate">
                  {{ lib.activeBook()?.title }}
                </h2>
                <p class="text-xs text-stone-400 truncate">
                  نووسەر: {{ lib.activeBook()?.author }} | {{ lib.activeBook()?.sourceName }}
                </p>
              </div>
            </div>

            <!-- Top Actions -->
            <div class="flex items-center gap-2">
              
              <!-- OCR AI Extraction Trigger -->
              <button
                (click)="lib.performOcr(lib.activeBook()?.title || '')"
                [disabled]="lib.isOcrProcessing()"
                class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                title="پڕۆسەکردنی دەق بە AI OCR"
              >
                <mat-icon class="!w-4 !h-4 text-amber-400">document_scanner</mat-icon>
                <span class="hidden sm:inline">دەرھێنانی دەق (OCR)</span>
              </button>

              <!-- Font Size Controls -->
              <div class="hidden md:flex items-center bg-stone-800 rounded-lg border border-stone-700 p-1 gap-1">
                <button (click)="fontSize.set(Math.max(12, fontSize() - 2))" class="px-2 text-xs font-bold hover:text-amber-400">A-</button>
                <span class="text-[10px] font-mono px-1">{{ fontSize() }}px</span>
                <button (click)="fontSize.set(Math.min(28, fontSize() + 2))" class="px-2 text-xs font-bold hover:text-amber-400">A+</button>
              </div>

              <!-- Close Modal -->
              <button (click)="lib.closeReader()" class="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-stone-800">
                <mat-icon class="!w-5 !h-5">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Main Reader Body -->
          <div class="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden bg-stone-950">
            
            <!-- Left 2 Cols: PDF / Book Viewer Canvas -->
            <div class="md:col-span-2 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto bg-stone-900/50 border-r border-stone-800">
              
              <!-- Content Display -->
              <div class="space-y-4 max-w-2xl mx-auto w-full">
                <div class="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
                  <span>لاپەڕە {{ currentPage() }} لە {{ lib.activeBook()?.pageCount || 100 }}</span>
                  <span class="font-mono text-amber-400">{{ Math.round((currentPage() / (lib.activeBook()?.pageCount || 100)) * 100) }}% پرۆگرێس</span>
                </div>

                <!-- Page Reading Surface -->
                <div [style.fontSize.px]="fontSize()" class="bg-stone-900 text-stone-100 p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-xl font-serif leading-relaxed space-y-4 text-justify min-h-[350px]">
                  <p class="font-bold text-amber-300 text-lg border-b border-stone-800 pb-2">
                    بەشی {{ currentPage() }}: تێڕوانینی گشتی و بەدواداچوونی مێژوویی
                  </p>
                  <p>
                    {{ lib.activeBook()?.description }}
                  </p>
                  <p class="text-stone-300">
                    لە کۆتایی سەدەی بیستەم و سەرەتای سەدەی بیست و یەکەمدا، پرۆسەی دیجیتاڵکردنی دەستنووس و کتێبە دەگمەنەکانی کوردستان لە ئەنستیتۆکان و کتێبخانە ئەکادیمییەکاندا دەستی پێکرد. ئەم کتێبە هەڵگری زانیاری ناوازەیە کە لەم ئەرشیڤە جیهانییەدا پارێزراوە.
                  </p>
                </div>

                <!-- OCR Results Section if triggered -->
                @if (lib.isOcrProcessing()) {
                  <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <mat-icon class="animate-spin !w-4 !h-4">sync</mat-icon>
                    <span>{{ lib.t().ocrProcessing }}</span>
                  </div>
                }

                @if (lib.ocrTextResult()) {
                  <div class="p-4 bg-stone-900 border border-amber-500/40 rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-xs text-amber-400 font-bold border-b border-stone-800 pb-1">
                      <span>دەقی دەرھێنراوی AI OCR:</span>
                      <button (click)="lib.ocrTextResult.set(null)" class="text-stone-400 hover:text-white">
                        <mat-icon class="!w-4 !h-4">close</mat-icon>
                      </button>
                    </div>
                    <pre class="text-xs text-stone-200 font-sans whitespace-pre-wrap leading-relaxed">{{ lib.ocrTextResult() }}</pre>
                  </div>
                }
              </div>

              <!-- Page Navigation Controls Footer -->
              <div class="pt-4 border-t border-stone-800 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
                <button
                  (click)="prevPage()"
                  [disabled]="currentPage() <= 1"
                  class="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs rounded-xl border border-stone-700 flex items-center gap-1 cursor-pointer"
                >
                  <mat-icon class="!w-4 !h-4">chevron_right</mat-icon>
                  <span>لاپەڕەی پێشوو</span>
                </button>

                <div class="flex items-center gap-2 text-xs font-mono">
                  <span>لاپەڕە</span>
                  <input
                    type="number"
                    [ngModel]="currentPage()"
                    (ngModelChange)="goToPage($event)"
                    min="1"
                    [max]="lib.activeBook()?.pageCount || 100"
                    class="w-14 text-center py-1 bg-stone-800 border border-stone-700 rounded-lg text-amber-300 font-bold outline-none"
                  />
                  <span>لە {{ lib.activeBook()?.pageCount || 100 }}</span>
                </div>

                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() >= (lib.activeBook()?.pageCount || 100)"
                  class="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs rounded-xl border border-stone-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>لاپەڕەی دواتر</span>
                  <mat-icon class="!w-4 !h-4">chevron_left</mat-icon>
                </button>
              </div>

            </div>

            <!-- Right 1 Col: Metadata & Download Panel -->
            <div class="hidden md:flex flex-col justify-between p-5 bg-stone-950 overflow-y-auto space-y-4">
              <div class="space-y-4">
                <div class="w-full h-48 rounded-xl overflow-hidden bg-stone-900 border border-stone-800">
                  <img [src]="lib.activeBook()?.coverImage" [alt]="lib.activeBook()?.title" class="w-full h-full object-cover" />
                </div>

                <div>
                  <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {{ lib.activeBook()?.sourceName }}
                  </span>
                  <h3 class="font-serif font-bold text-sm text-stone-100 mt-2">
                    {{ lib.activeBook()?.title }}
                  </h3>
                  <p class="text-xs text-stone-400 mt-1">ساڵی بڵاوکردنەوە: {{ lib.activeBook()?.year }}</p>
                </div>

                <div class="text-xs text-stone-300 space-y-1">
                  <p><strong class="text-stone-400">ژمارەی لاپەڕە:</strong> {{ lib.activeBook()?.pageCount || 'نادیار' }}</p>
                  <p><strong class="text-stone-400">فۆرمات:</strong> PDF / ePub Digital</p>
                  <p><strong class="text-stone-400">کۆدی ISBN:</strong> {{ lib.activeBook()?.isbn || 'ئەرشیڤی ناوخۆیی' }}</p>
                </div>
              </div>

              <!-- Direct Download Action -->
              <div class="space-y-2 pt-4 border-t border-stone-800">
                <a
                  [href]="lib.activeBook()?.downloadUrl"
                  target="_blank"
                  download
                  class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <mat-icon class="!w-4 !h-4">download</mat-icon>
                  <span>دابەزاندنی پەڕگەی PDF</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
    }
  `
})
export class LibraryReaderModalComponent {
  public lib = inject(DigitalLibraryService);
  public Math = Math;
  public currentPage = signal<number>(1);
  public fontSize = signal<number>(16);

  public nextPage(): void {
    const max = this.lib.activeBook()?.pageCount || 100;
    if (this.currentPage() < max) {
      const next = this.currentPage() + 1;
      this.currentPage.set(next);
      if (this.lib.activeBook()) {
        this.lib.updateReadingProgress(this.lib.activeBook()!, next, max);
      }
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      const prev = this.currentPage() - 1;
      this.currentPage.set(prev);
      if (this.lib.activeBook()) {
        this.lib.updateReadingProgress(this.lib.activeBook()!, prev, this.lib.activeBook()?.pageCount || 100);
      }
    }
  }

  public goToPage(p: number): void {
    const page = Math.max(1, Math.min(p || 1, this.lib.activeBook()?.pageCount || 100));
    this.currentPage.set(page);
    if (this.lib.activeBook()) {
      this.lib.updateReadingProgress(this.lib.activeBook()!, page, this.lib.activeBook()?.pageCount || 100);
    }
  }
}
