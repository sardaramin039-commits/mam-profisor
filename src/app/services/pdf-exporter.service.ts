import { Injectable, inject } from '@angular/core';
import { WordExportService, FullManuscriptExportOptions } from './word-export';

export interface PDFExportOptions {
  title: string;
  author?: string;
  content: string;
  watermark?: string;
  discipline?: string;
  academicLevel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExporterService {
  private wordExportService = inject(WordExportService);

  public generatePrintableHTML(options: PDFExportOptions): string {
    return this.wordExportService.generatePrintableHTML({
      title: options.title || 'دۆکیومێنتی ئەکادیمی',
      discipline: options.discipline,
      academicLevel: options.academicLevel,
      chapters: [{
        title: options.title || 'تێزی زانستی',
        content: options.content || ''
      }]
    });
  }

  public exportFullManuscriptToPDF(options: FullManuscriptExportOptions): void {
    this.wordExportService.exportToPrintablePdf(options);
  }

  public exportToPDF(options: PDFExportOptions): void {
    const html = this.generatePrintableHTML(options);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
