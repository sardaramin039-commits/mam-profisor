import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WordExportService {
  formatChapterForExport(title: string, content: string, chapterIndex: number): string {
    const formattedContent = (content || '<i>ناوەڕۆکی ئەم بەشە لە قۆناغی ئامادەکردندایە.</i>').replace(/\n/g, '</p><p>');
    return `
      <h2 style="font-size: 18pt; font-weight: bold; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-top: 30px;">
        بەشی ${chapterIndex + 1}: ${title}
      </h2>
      <p style="font-size: 13pt; line-height: 1.85; text-align: justify; margin-bottom: 16px; text-indent: 0.8cm;">
        ${formattedContent}
      </p>
    `;
  }

  generateManuscriptTextBlob(
    title: string,
    discipline: string,
    academicLevel: string,
    chapters: { title: string; content: string }[]
  ): Blob {
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 2.5cm 2.5cm 2.5cm 2.5cm;
          }
          body {
            font-family: 'Segoe UI', 'Noto Sans Arabic', 'Times New Roman', Tahoma, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.9;
            color: #0f172a;
            padding: 20px;
          }
          h1 { text-align: center; font-size: 24pt; font-weight: bold; color: #0284c7; margin-bottom: 20px; }
          .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px; text-align: center; font-size: 11pt; color: #475569; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta-box">
          <strong>ڕشتەی زانستی:</strong> ${discipline || 'زانستە گشتییەکان'} | 
          <strong>ئاستی ئەکادیمی:</strong> ${academicLevel || 'ماستەر'} | 
          <strong>ڕێکەوت:</strong> ${new Date().toLocaleDateString('ku-IQ')}
        </div>
        <hr style="border: none; border-top: 1px solid #cbd5e1;" />
    `;

    chapters.forEach((ch, idx) => {
      htmlContent += this.formatChapterForExport(ch.title, ch.content || '', idx);
    });

    htmlContent += `
        <div style="margin-top: 50px; border-top: 2px solid #0284c7; padding-top: 15px; text-align: center; font-size: 10pt; color: #64748b;">
          کتێبخانەی دیجیتاڵیی ئەکادیمیی مام (MAM Academic Digital Library) - پڕۆژەی هارڤارد
        </div>
      </body>
      </html>
    `;

    return new Blob(['\ufeff' + htmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8'
    });
  }
}
