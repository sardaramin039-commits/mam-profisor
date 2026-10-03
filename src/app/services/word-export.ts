import { Injectable } from '@angular/core';
import { Document, HeadingLevel, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

@Injectable({
  providedIn: 'root'
})
export class WordExportService {
  async generateDocxBlob(
    title: string,
    discipline: string,
    academicLevel: string,
    chapters: { title: string; content: string }[]
  ): Promise<Blob> {
    const children: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: title || 'توێژینەوەی زانستی', bold: true, size: 36, font: 'Noto Sans Arabic' })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        bidirectional: true
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `بوار: ${discipline || 'زانستە گشتییەکان'} | ئاست: ${academicLevel || 'ماستەر'}`,
            size: 22,
            font: 'Noto Sans Arabic'
          })
        ],
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { after: 360 }
      })
    ];

    chapters.forEach((chapter, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `بەشی ${index + 1}: ${chapter.title}`,
              bold: true,
              size: 28,
              font: 'Noto Sans Arabic'
            })
          ],
          heading: HeadingLevel.HEADING_1,
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 360, after: 180 }
        })
      );

      const paragraphs = String(chapter.content || '').split(/\n{2,}|\r\n{2,}/);
      paragraphs.filter(Boolean).forEach((paragraph) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.replace(/\n/g, ' ').trim(),
                size: 26,
                font: 'Noto Sans Arabic'
              })
            ],
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 180, line: 360 }
          })
        );
      });
    });

    const document = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children
      }]
    });

    return Packer.toBlob(document);
  }

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
          کتێبخانەی دیجیتاڵیی ئەکادیمیی مام پڕۆفیسۆر (MAM Professor Academic Digital Library)
        </div>
      </body>
      </html>
    `;

    return new Blob(['\ufeff' + htmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8'
    });
  }
}
