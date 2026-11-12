import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-library-reader-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lib.isReaderOpen() && lib.activeBook()) {
      <div class="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
        <div class="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl" role="dialog" aria-modal="true" aria-label="خوێندنەوەی سەرچاوە">

          <header class="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-3 text-stone-200">
            <div class="flex items-center gap-3 min-w-0">
              <button type="button" (click)="lib.closeReader()" class="p-2 text-stone-400 hover:text-red-400 transition-colors rounded-lg hover:bg-stone-800" aria-label="داخستن">
                <mat-icon class="!w-5 !h-5">close</mat-icon>
              </button>
              <div class="min-w-0">
                <h2 class="font-serif font-bold text-sm sm:text-base text-amber-300 truncate">{{ lib.activeBook()?.title }}</h2>
                <p class="text-xs text-stone-400 truncate">نووسەر: {{ lib.activeBook()?.author }}</p>
              </div>
            </div>
            @if (lib.activeBook()?.sourceUrl) {
              <a [href]="lib.activeBook()?.sourceUrl" target="_blank" rel="noopener noreferrer"
                 class="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-[10px] hover:text-amber-300 border border-stone-700">
                سەرچاوەی ڕەسەن
              </a>
            }
          </header>

          <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden bg-stone-950">
            <section class="min-h-0 overflow-hidden p-3 sm:p-5">
              @if (safePdfUrl()) {
                <div class="h-full rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden shadow-xl">
                  <div class="px-4 py-3 border-b border-stone-800">
                    <p class="text-xs font-bold text-stone-200">بەڵگەی سەرچاوە</p>
                    <p class="text-[10px] text-stone-500 mt-1">
                      ناوەڕۆکی PDF ـەکە بە ڕاستەوخۆ پیشان دەدرێت؛ هیچ دەقی ساختە لەم reader ـەدا زیاد ناکرێت.
                    </p>
                  </div>
                  <iframe
                    [src]="safePdfUrl()"
                    class="w-full h-[calc(100%-56px)] bg-white"
                    title="PDF ـی سەرچاوە"
                  ></iframe>
                </div>
              } @else {
                <div class="h-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 flex flex-col items-center justify-center text-center">
                  <mat-icon class="text-amber-300 !w-10 !h-10">description</mat-icon>
                  <p class="mt-3 text-sm font-bold text-amber-200">PDF ـی ڕاستەوخۆ بەردەست نییە.</p>
                  <p class="mt-2 text-xs leading-6 text-stone-400 max-w-lg">
                    ئەم تۆمارە کاندیدی کەتەلۆگە؛ بۆ خوێندنەوەی ناوەڕۆکی ڕاستەقینە سەردانی سەرچاوەی ڕەسەن بکە.
                  </p>
                </div>
              }
            </section>

            <aside class="border-t lg:border-t-0 lg:border-r border-stone-800 bg-stone-950 p-4 sm:p-5 overflow-y-auto space-y-5">
              <section>
                <p class="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Catalog metadata</p>
                <dl class="mt-3 space-y-2 text-xs">
                  <div class="flex justify-between gap-3"><dt class="text-stone-500">نووسەر</dt><dd class="text-stone-200 text-right">{{ lib.activeBook()?.author }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-stone-500">ساڵ</dt><dd class="text-stone-200">{{ lib.activeBook()?.year }}</dd></div>
                  @if (lib.activeBook()?.pageCount) {
                    <div class="flex justify-between gap-3"><dt class="text-stone-500">لاپەڕە</dt><dd class="text-stone-200">{{ lib.activeBook()?.pageCount }}</dd></div>
                  }
                  <div class="flex justify-between gap-3"><dt class="text-stone-500">دۆخی پشتڕاستکردنەوە</dt><dd class="text-amber-300">{{ lib.activeBook()?.verified ? 'پشکنراو' : 'پشکنین پێویستە' }}</dd></div>
                </dl>
              </section>

              <section class="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-amber-300 !w-5 !h-5">document_scanner</mat-icon>
                  <div>
                    <p class="text-xs font-bold text-stone-200">OCR ـی لاپەڕە</p>
                    <p class="text-[10px] text-stone-500 mt-1">وێنەی لاپەڕە هەڵبژێرە بۆ دەرھێنانی دەقی ڕاستەقینە.</p>
                  </div>
                </div>
                <input #ocrFile type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="onOcrFileSelected($event)">
                <button type="button" (click)="ocrFile.click()" [disabled]="lib.isOcrProcessing()"
                        class="w-full mt-3 px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold disabled:opacity-50">
                  {{ lib.isOcrProcessing() ? 'خەریکی OCR ـە...' : 'هەڵبژاردنی وێنەی لاپەڕە' }}
                </button>
              </section>

              @if (lib.isOcrProcessing()) {
                <div class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                  <mat-icon class="animate-spin !w-4 !h-4">sync</mat-icon>
                  <span>OCR لە پڕۆسەدایە...</span>
                </div>
              }

              @if (lib.ocrTextResult()) {
                <section class="rounded-xl border border-amber-500/40 bg-stone-900 p-4 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs text-amber-400 font-bold">ئەنجامی OCR</span>
                    <button type="button" (click)="lib.ocrTextResult.set(null)" class="p-1 text-stone-400 hover:text-white" aria-label="سڕینەوەی ئەنجامی OCR">
                      <mat-icon class="!w-4 !h-4">close</mat-icon>
                    </button>
                  </div>
                  <pre class="text-xs text-stone-200 whitespace-pre-wrap leading-relaxed">{{ lib.ocrTextResult() }}</pre>
                </section>
              }
            </aside>
          </div>
        </div>
      </div>
    }
  `
})
export class LibraryReaderModalComponent {
  public lib = inject(DigitalLibraryService);
  private sanitizer = inject(DomSanitizer);

  public safePdfUrl = computed<SafeResourceUrl | null>(() => {
    const book = this.lib.activeBook();
    const url = book?.verified ? (book.downloadUrl || book.pdfUrl || '') : '';
    return url.startsWith('https://') ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

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
