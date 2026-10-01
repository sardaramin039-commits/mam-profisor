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

                <!-- Source document surface -->
                <div class="space-y-4">
                  @if (lib.activeBook()?.downloadUrl) {
                    <div class="rounded-2xl border border-stone-800 bg-stone-950 overflow-hidden shadow-xl">
                      <div class="px-4 py-3 border-b border-stone-800 flex items-center justify-between gap-3">
                        <div>
                          <p class="text-xs font-bold text-stone-200">بەڵگەی سەرچاوە</p>
                          <p class="text-[10px] text-stone-500">پەڕەکانی سەرچاوەکە لە PDF ـی پەیوەست پیشان دەدرێن؛ هیچ دەقی خەیاڵی لەم reader ـەدا زیاد ناکرێت.</p>
                        </div>
                        <a [href]="lib.activeBook()?.sourceUrl" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-[10px] hover:text-amber-300 border border-stone-700">
                          سەرچاوەی ڕەسەن
                        </a>
                      </div>
                      <iframe
                        [src]="lib.activeBook()?.downloadUrl"
                        class="w-full h-[58vh] bg-white"
                        title="بەڵگەی سەرچاوەی کتێب"
                      ></iframe>
                    </div>
                  } @else {
                    <div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
                      <mat-icon class="text-amber-300 !w-10 !h-10">description</mat-icon>
                      <p class="mt-3 text-sm font-bold text-amber-200">پەڕگەی ڕاستەوخۆی سەرچاوە بەردەست نییە.</p>
                      <p class="mt-2 text-xs leading-6 text-stone-400">تکایە سەردانی لینکەکەی سەرچاوە بکە بۆ خوێندنەوەی ناوەڕۆکی ڕاستەقینە.</p>
                    </div>
                  }

                  <div class="rounded-xl border border-stone-800 bg-stone-950/70 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="text-xs font-bold text-stone-200">OCR ـی وێنەی لاپەڕە</p>
                        <p class="text-[10px] text-stone-500">تەنها وێنەی لاپەڕە بنێرە؛ پڕۆسەی OCR دەقی وێنەکە دەخوێنێتەوە.</p>
                      </div>
                      <button type="button" (click)="ocrFile.click()" [disabled]="lib.isOcrProcessing()" class="px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold disabled:opacity-50">
                        <mat-icon class="!w-4 !h-4 align-middle">document_scanner</mat-icon>
                        هەڵبژاردنی وێنە
                      </button>
                      <input #ocrFile type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="onOcrFileSelected($event)" />
                    </div>
                  </div>
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
  public onOcrFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowed.has(file.type) || file.size > 8 * 1024 * 1024) {
      this.lib.ocrTextResult.set('تەنها PNG/JPEG/WebP تا ٨ MB ڕێگەپێدراوە.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl.startsWith('data:image/')) this.lib.performOcr(dataUrl);
    };
    reader.onerror = () => this.lib.ocrTextResult.set('خوێندنەوەی وێنە سەرکەوتوو نەبوو.');
    reader.readAsDataURL(file);
    input.value = '';
  }
}
