import { Injectable } from '@angular/core';

export interface PDFExportOptions {
  title: string;
  author?: string;
  content: string;
  watermark?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExporterService {
  public generatePrintableHTML(options: PDFExportOptions): string {
    const title = options.title || 'دۆکیومێنتی ئەکادیمی';
    const author = options.author || 'توێژەر';
    const content = options.content || '';
    const watermark = options.watermark || 'مامۆستای ئەکادیمی (Scholarly Mam)';

    return `
      <!DOCTYPE html>
      <html lang="ku" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Rabai', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: justify;
            color: #1a1a1a;
            line-height: 1.8;
            padding: 15px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 { color: #1e3a8a; font-size: 22px; margin: 0; }
          .header p { color: #64748b; font-size: 14px; margin-top: 5px; }
          .content { font-size: 15px; white-space: pre-wrap; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>نووسەر / توێژەر: ${author}</p>
        </div>
        <div class="content">${content}</div>
        <div class="footer">${watermark} - ئامادەکراوە لەلایەن سیستەمی زیرەکی دەستکردی ئەکادیمی</div>
      </body>
      </html>
    `;
  }

  public exportToPDF(options: PDFExportOptions): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(this.generatePrintableHTML(options));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
