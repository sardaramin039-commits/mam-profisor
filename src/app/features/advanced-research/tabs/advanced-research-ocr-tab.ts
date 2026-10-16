import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';
import { PdfProcessorService } from '../../pdf-processor/services/pdf-processor';
import { OcrExtractionResult } from '../../../../helpers/academic-types';
import { AcademicStoreService } from '../../../services/academic-store.service';

@Component({
  selector: 'app-advanced-research-ocr-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-ocr-tab.html'
})
export class AdvancedResearchOcrTabComponent {
  readonly multiAgent = inject(MultiAgentService);
  private pdfProcessor = inject(PdfProcessorService);
  private academicStore = inject(AcademicStoreService);

  readonly isUploading = signal<boolean>(false);
  readonly selectedFileName = signal<string | null>(null);
  readonly multimodalResult = signal<(OcrExtractionResult & { citation?: string; detectedAuthor?: string; detectedTitle?: string; detectedPage?: string | number }) | null>(null);
  readonly sentToCorpus = signal<boolean>(false);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFileName.set(file.name);
      this.isUploading.set(true);
      this.sentToCorpus.set(false);
      try {
        const res = await this.pdfProcessor.extractMultimodalDocument(file);
        this.multimodalResult.set(res);
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  sendToCorpusBox(res: any): void {
    if (!res || !res.extractedText) return;

    const sourceTitle = res.detectedTitle || this.selectedFileName() || 'دۆکیومێنتی سکانکراوی کۆرپەس';
    const author = res.detectedAuthor || 'سەرچاوەی دەستنووس/ئەرشیف';
    const pageNumber = res.detectedPage || '١';
    const excerpt = res.extractedText.slice(0, 2000);
    const analyticalNote = res.summary || 'دەقی دەرهێنراوی OCR بۆ شیکاریی گوتار و بەڵگەی مەیدانی.';

    this.academicStore.addCorpusCard({
      sourceTitle,
      author,
      pageNumber,
      targetChapterId: 2, // Practical chapter
      category: 'archival',
      excerptText: excerpt,
      analyticalNote,
      tags: ['OCR', 'دەستنووس', 'کۆرپەس']
    });

    this.sentToCorpus.set(true);
    this.academicStore.setFeedback('دەقی دەرهێنراو بە سەرکەوتوویی ڕەوانەی سندوقی فیشی کۆرپەس کرا.');
  }
}
