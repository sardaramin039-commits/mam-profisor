import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BibliographyFileExtractor, BibliographyExtractionResult, ExtractedCitationItem } from '../../../helpers/bibliography-file-extractor';
import { AcademicStyle } from '../../../domain/enums';
import { EditorService } from '../../editor/services/editor';
import { CitationManagerService } from '../services/citation-manager';
import { AppNotificationsService } from '../../../core/app.notifications';
import { DigitalLibraryService } from '../../../services/digital-library.service';

@Component({
  selector: 'app-bibliography-file-extractor',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-right font-sans" dir="rtl">
      <!-- Header Banner -->
      <div class="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <mat-icon class="text-2xl">file_upload</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>دەرهێنان و فۆرماتکردنی خۆکاری سەرچاوەکان لە فایلی دەق</span>
              <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                Auto File-to-Citation Parser
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              فایلی بیبلیۆگرافی (.txt, .bib, .ris) هاوردە بکە تا خۆکارانە سەرچاوەکان دەربهێنرێن و بە ستانداردی داواکراو دابڕێژرێنەوە.
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="loadSampleBibliography()"
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-xs rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer">
          <mat-icon class="text-sm">code</mat-icon>
          <span>نموونەی سەرچاوە بۆ تاقیکردنەوە</span>
        </button>
      </div>

      <!-- File Upload Dropzone & Text Area -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Dropzone / File Picker -->
        <div
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDropFile($event)"
          [class.border-purple-500]="isDragging()"
          [class.bg-purple-900]="isDragging()"
          class="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all bg-slate-950/40 cursor-pointer relative min-h-[160px]">
          <input
            #fileInput
            type="file"
            accept=".txt,.bib,.ris,.md,.text"
            (change)="onFileSelected($event)"
            class="hidden" />

          <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-purple-400 mb-2">
            <mat-icon class="text-2xl">upload_file</mat-icon>
          </div>

          <h4 class="text-xs font-bold text-slate-200">فایلی سەرچاوەکان لێرە دابنێ (Drag & Drop)</h4>
          <p class="text-[11px] text-slate-400 mt-1">پشتیوانی فۆرماتەکانی .txt, .bib (BibTeX), .ris و .md دەکات</p>

          <button
            type="button"
            (click)="fileInput.click()"
            class="mt-3 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer">
            <mat-icon class="text-sm">folder_open</mat-icon>
            <span>هەڵبژاردنی فایل لە کۆمپیوتەر</span>
          </button>

          @if (uploadedFileName()) {
            <div class="mt-2.5 px-3 py-1 bg-purple-950/80 border border-purple-800 rounded-full text-[10px] text-purple-200 flex items-center gap-1 font-mono">
              <mat-icon class="!text-xs">attachment</mat-icon>
              <span>{{ uploadedFileName() }}</span>
            </div>
          }
        </div>

        <!-- Raw Text Paste Box -->
        <div class="flex flex-col space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <label class="font-semibold text-[11px]">یان دەقی سەرچاوەکان ڕاستەوخۆ لێرە بلکێنە (Paste Text):</label>
            @if (rawInputText()) {
              <button
                type="button"
                (click)="rawInputText.set(''); uploadedFileName.set('')"
                class="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer">
                پاککردنەوە
              </button>
            }
          </div>
          <textarea
            [value]="rawInputText()"
            (input)="onTextInput($event)"
            rows="6"
            placeholder="نموونە:&#10;1. مەزهەر، ک. (١٩٨١). مێژووی کورد و کوردستان. بەغداد.&#10;2. Smith, J. (2020). Machine Learning. Oxford University Press."
            class="w-full flex-1 p-3 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl text-xs text-slate-200 font-serif leading-relaxed focus:outline-none resize-none"></textarea>
        </div>
      </div>

      <!-- Controls: Style Selector & Extract Action -->
      <div class="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold text-slate-300">شێوازی فۆرماتکردنی زانستی:</span>
          @for (style of styles; track style.id) {
            <button
              type="button"
              (click)="changeTargetStyle(style.id)"
              [class]="selectedStyle() === style.id
                ? 'bg-purple-600 text-white font-bold border-purple-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'"
              class="px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer">
              {{ style.label }}
            </button>
          }
        </div>

        <button
          type="button"
          (click)="extractCitations()"
          [disabled]="!rawInputText().trim()"
          class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
          <mat-icon class="text-sm">auto_fix_high</mat-icon>
          <span>دەرهێنان و فۆرماتکردنی سەرچاوەکان</span>
        </button>
      </div>

      <!-- Results Display Section -->
      @if (extractionResult(); as result) {
        <div class="space-y-4 pt-2">
          <!-- Summary bar & bulk actions -->
          <div class="p-3.5 bg-purple-950/30 border border-purple-800/60 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-purple-400 leading-none">task_alt</mat-icon>
              <div>
                <span class="text-xs font-bold text-slate-200">
                  سەرکەوتوو بوو! {{ result.totalExtracted }} سەرچاوە دەرهێنرا و فۆرمات کرا.
                </span>
                <span class="block text-[10.5px] text-purple-300 font-mono">
                  شێوازی چالاک: {{ result.selectedStyle }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                (click)="copyAllFormatted(result.fullFormattedText)"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700">
                <mat-icon class="text-xs">content_copy</mat-icon>
                <span>کۆپیکردنی هەموو دەقەکە</span>
              </button>

              <button
                type="button"
                (click)="insertToThesis(result.fullFormattedText)"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs">
                <mat-icon class="text-xs">post_add</mat-icon>
                <span>تێکردن بۆ بەشی سەرچاوەکانی تێز</span>
              </button>

              <button
                type="button"
                (click)="importToProjectSources(result.items)"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs">
                <mat-icon class="text-xs">library_add</mat-icon>
                <span>پاشەکەوتکردن لە سەرچاوەکانی پڕۆژە</span>
              </button>
            </div>
          </div>

          <!-- Cards Grid for individual extracted citations -->
          <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            @for (item of result.items; track item.id; let idx = $index) {
              <div class="p-3.5 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl space-y-2 transition-all">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center text-xs font-mono font-bold">
                      {{ idx + 1 }}
                    </span>
                    <span class="text-xs font-bold text-slate-200 font-serif">{{ item.author }} ({{ item.year }})</span>
                    <span class="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {{ item.sourceType }}
                    </span>
                  </div>

                  <button
                    type="button"
                    (click)="copySingleCitation(item.formattedText)"
                    class="text-[11px] text-slate-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer">
                    <mat-icon class="!text-xs">copy_all</mat-icon>
                    <span>کۆپی</span>
                  </button>
                </div>

                <!-- Formatted citation output -->
                <div class="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-100 font-serif leading-relaxed">
                  {{ item.formattedText }}
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class BibliographyFileExtractorComponent {
  private editorService = inject(EditorService);
  private citationManager = inject(CitationManagerService);
  private notifications = inject(AppNotificationsService);
  private digitalLibrary = inject(DigitalLibraryService);

  readonly rawInputText = signal<string>('');
  readonly uploadedFileName = signal<string>('');
  readonly isDragging = signal<boolean>(false);
  readonly selectedStyle = signal<string>(AcademicStyle.APA);
  readonly extractionResult = signal<BibliographyExtractionResult | null>(null);

  readonly styles = [
    { id: AcademicStyle.APA, label: 'APA 7th Edition' },
    { id: AcademicStyle.Harvard, label: 'Harvard Style' },
    { id: AcademicStyle.MLA, label: 'MLA 9th Edition' },
    { id: AcademicStyle.Chicago, label: 'Chicago (17th)' },
    { id: AcademicStyle.IEEE, label: 'IEEE Style' },
    { id: 'Kurdish', label: 'ڕێبازی ئەکادیمیی کوردی' }
  ];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDropFile(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.readFile(event.dataTransfer.files[0]);
    }
  }

  onTextInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement)?.value || '';
    this.rawInputText.set(val);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.readFile(input.files[0]);
    }
  }

  private readFile(file: File) {
    this.uploadedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      this.rawInputText.set(content);
      this.extractCitations();
    };
    reader.readAsText(file);
  }

  changeTargetStyle(styleId: string) {
    this.selectedStyle.set(styleId);
    if (this.rawInputText().trim()) {
      this.extractCitations();
    }
  }

  extractCitations() {
    const text = this.rawInputText().trim();
    if (!text) return;

    const result = BibliographyFileExtractor.extractAndFormat(text, this.selectedStyle());
    this.extractionResult.set(result);
    if (result.items && result.items.length > 0) {
      this.importToProjectSources(result.items);
      this.digitalLibrary.addExtractedBibliography(result.items);
    }
  }

  copyAllFormatted(text: string) {
    navigator.clipboard.writeText(text);
    this.notifications.showToast('کۆپیکردن', 'سەرجەم سەرچاوە فۆرماتکراوەکان کۆپیکران.', 'success');
  }

  copySingleCitation(text: string) {
    navigator.clipboard.writeText(text);
    this.notifications.showToast('کۆپیکردن', 'سەرچاوەکە کۆپیکرا.', 'success');
  }

  insertToThesis(formattedText: string) {
    const chapters = this.editorService.chapters();
    if (!chapters || chapters.length === 0) {
      this.notifications.showToast('ئاگاداری', 'هیچ بەشێک لە تێزەکەدا بوونی نییە بۆ تێکردنی سەرچاوەکان.', 'warning');
      return;
    }

    // Append to references chapter or create one
    const refIdx = chapters.findIndex(c => 
      c.title.includes('سەرچاوە') || 
      c.title.toLowerCase().includes('references') || 
      c.title.toLowerCase().includes('bibliography')
    );

    let updatedList = [...chapters];
    if (refIdx >= 0) {
      const existing = updatedList[refIdx].content || '';
      updatedList[refIdx] = {
        ...updatedList[refIdx],
        content: existing ? `${existing}\n\n${formattedText}` : formattedText
      };
    } else {
      const maxId = chapters.reduce((max, c) => Math.max(max, c.id || 0), 0);
      updatedList.push({
        id: maxId + 1,
        title: 'پێڕستی سەرچاوە زانستییەکان (References)',
        content: formattedText,
        wordCount: formattedText.split(/\s+/).filter(Boolean).length,
        status: 'completed',
        isLocked: false
      });
    }

    this.editorService.setChapters(updatedList);
    this.notifications.showToast('سەرکەوتوو بوو', 'سەرچاوەکان بە سەرکەوتوویی خرانە نێو بەشی سەرچاوەکانی تێزەکە.', 'success');
  }

  importToProjectSources(items: ExtractedCitationItem[]) {
    if (!items || items.length === 0) return;

    items.forEach(item => {
      this.citationManager.addSource({
        userId: 'local_user',
        title: item.title,
        author: item.author,
        year: typeof item.year === 'number' ? item.year : parseInt(item.year.toString(), 10) || 2024,
        publisher: item.journalOrPublisher,
        doi: item.doi,
        sourceType: (item.sourceType === 'conference' || item.sourceType === 'website') ? 'manuscript' : item.sourceType,
        isVerified: true
      });
    });

    this.notifications.showToast('هاوردەکردن', `${items.length} سەرچاوە لە داتابەیسی پڕۆژە پاشەکەوتکران.`, 'success');
  }

  loadSampleBibliography() {
    const sample = `@article{amin2023kurdish,
  author = {ئەمین، سەردار و ئەحمەد، ڕێبین},
  title = {میتۆدۆلۆژیای پێشکەوتووی توێژینەوەی زمانەوانی لە زمانی کوردیدا},
  journal = {گۆڤاری زانکۆی سلێمانی},
  year = {2023},
  volume = {15},
  pages = {45-62},
  doi = {10.1234/kurdish.2023.01}
}

@book{mazhar1981history,
  author = {د. کەمال مەزهەر ئەحمەد},
  title = {مێژووی کورد و کوردستان لە سەرچاوە کۆنەکاندا},
  publisher = {چاپخانەی کۆڕی زانیاری کورد},
  year = {1981}
}

3. Hawking, S. (1988). A Brief History of Time. Bantam Books.
4. Smith, J. & Jones, P. (2021). Neural Networks in Semantic Extraction. Journal of AI Research, 12, 101-118.`;

    this.rawInputText.set(sample);
    this.uploadedFileName.set('sample_academic_bibliography.txt');
    this.extractCitations();
  }
}
