import { Paragraph, HeadingLevel, AlignmentType, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { toSoraniNumber } from '../pipes/sorani-number.pipe';

export interface VerifiedSourceExportItem {
  title: string;
  author: string;
  year: number | string;
  venue: string;
  doi?: string;
  url?: string;
  provider: string;
  retrievalTime: string;
  status: string;
}

export interface WordCountExportAudit {
  targetWords: number;
  currentWords: number;
  remainingWords: number;
  percentage: number;
  chapterAudits: Array<{
    chapterTitle: string;
    targetWords: number;
    currentWords: number;
    bodyWords: number;
    statusLabel: string;
  }>;
}

export class ExportReportBuilder {
  private static readonly fontName = 'UniQAIDAR';

  /**
   * Generates docx elements for the Source Verification Report
   */
  public static buildDocxVerificationReport(sources: VerifiedSourceExportItem[]): Paragraph[] {
    const pList: Paragraph[] = [
      new Paragraph({ children: [], pageBreakBefore: true }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'ڕاپۆرتی فەرمیی پشتڕاستکردنەوەی سەرچاوەکان (Source Verification Audit)', size: 30, bold: true, font: this.fontName })],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'سەرجەم سەرچاوەکانی ئەم تێزە بە پێوەرەکانی Crossref و OpenAlex تاقیکراونەتەوە و بە فەرمی لە لایەن توێژەرەوە پەسەند کراون:', size: 22, font: this.fontName })],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 150 }
      })
    ];

    if (sources.length === 0) {
      pList.push(new Paragraph({
        children: [new TextRun({ text: 'هیچ سەرچاوەیەکی دەرەکی تۆمار نەکراوە.', size: 22, font: this.fontName })],
        alignment: AlignmentType.RIGHT,
        bidirectional: true
      }));
      return pList;
    }

    sources.forEach((s, idx) => {
      const doiText = s.doi ? ` | DOI: ${s.doi}` : '';
      const urlText = s.url ? ` | لینک: ${s.url}` : '';
      const providerText = s.provider ? ` [دابینکەر: ${s.provider.toUpperCase()}]` : '';
      const dateText = s.retrievalTime ? ` (پشکنین: ${s.retrievalTime.slice(0, 10)})` : '';

      pList.push(new Paragraph({
        children: [
          new TextRun({ text: `${toSoraniNumber(idx + 1)}. ${s.author} (${toSoraniNumber(s.year) || 'بێ ساڵ'}). `, bold: true, font: this.fontName, size: 23 }),
          new TextRun({ text: `«${s.title}». `, italics: true, font: this.fontName, size: 23 }),
          new TextRun({ text: `${s.venue || ''}${doiText}${urlText}${providerText}${dateText} - دۆخ: ${s.status === 'VERIFIED' ? 'پشتڕاستکراو (VERIFIED)' : s.status}`, font: this.fontName, size: 21 })
        ],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 100 }
      }));
    });

    return pList;
  }

  /**
   * Generates docx elements for the Word Count Compliance Audit Report
   */
  public static buildDocxWordCountReport(audit: WordCountExportAudit): Paragraph[] {
    const pList: Paragraph[] = [
      new Paragraph({ children: [], pageBreakBefore: true }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'ڕاپۆرتی کۆنتڕۆڵی توندی ژمارەی وشەکان (Word Count Compliance Report)', size: 30, bold: true, font: this.fontName })],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `ئامانجی گشتی تێز: ${toSoraniNumber(audit.targetWords)} وشە | وشەی نووسراو: ${toSoraniNumber(audit.currentWords)} وشە (${toSoraniNumber(audit.percentage)}٪ لە ئامانج)`, bold: true, font: this.fontName, size: 24 })
        ],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 160 }
      })
    ];

    audit.chapterAudits.forEach((ch, idx) => {
      pList.push(new Paragraph({
        children: [
          new TextRun({ text: `• ${ch.chapterTitle}: `, bold: true, font: this.fontName, size: 22 }),
          new TextRun({ text: `${toSoraniNumber(ch.currentWords)} وشە (ئامانج: ${toSoraniNumber(ch.targetWords)}) - دەقی سەرەکی: ${toSoraniNumber(ch.bodyWords)} وشە [${ch.statusLabel}]`, font: this.fontName, size: 21 })
        ],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 80 }
      }));
    });

    return pList;
  }

  /**
   * Generates HTML for PDF / print view
   */
  public static buildHtmlReports(sources: VerifiedSourceExportItem[], audit?: WordCountExportAudit): string {
    let html = `\n<div class="page-break">\n<h1 class="sec-title">ڕاپۆرتی فەرمیی پشتڕاستکردنەوەی سەرچاوەکان (Source Verification Audit)</h1>\n`;
    html += `<p style="font-size: 11pt; color: #334155; margin-bottom: 15px;">سەرجەم سەرچاوەکان بەپێی ستانداردی دەرەکی (Crossref & OpenAlex) پشتڕاستکراونەتەوە و تەنها تۆماری پەسەندکراو تێزدا جێگیر کراوە:</p>\n`;
    
    if (sources.length > 0) {
      html += `<table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;" dir="rtl">\n`;
      html += `<tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;"><th style="padding: 8px; text-align: right;">#</th><th style="padding: 8px; text-align: right;">نووسەر و ساڵ</th><th style="padding: 8px; text-align: right;">سەرناو و بڵاوکەرەوە</th><th style="padding: 8px; text-align: right;">DOI / دابینکەر</th><th style="padding: 8px; text-align: right;">دۆخ</th></tr>\n`;
      sources.forEach((s, idx) => {
        html += `<tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px;">${toSoraniNumber(idx + 1)}</td>
          <td style="padding: 6px;">${s.author} (${toSoraniNumber(s.year) || 'n.d.'})</td>
          <td style="padding: 6px;"><i>${s.title}</i><br><span style="color: #64748b;">${s.venue || ''}</span></td>
          <td style="padding: 6px; font-family: monospace; font-size: 8.5pt;">${s.doi ? `DOI: ${s.doi}<br>` : ''}${s.provider.toUpperCase()}</td>
          <td style="padding: 6px; font-weight: bold; color: ${s.status === 'VERIFIED' ? '#059669' : '#dc2626'};">${s.status} (پەسەندکراو)</td>
        </tr>\n`;
      });
      html += `</table>\n`;
    }

    if (audit) {
      html += `<h2 class="sub-title" style="margin-top: 30px;">ڕاپۆرتی کۆنتڕۆڵی ژمارەی وشەکان (Word Count Compliance Report)</h2>\n`;
      html += `<p style="font-size: 11pt; margin-bottom: 10px;"><strong>ئامانجی گشتی:</strong> ${toSoraniNumber(audit.targetWords)} وشە | <strong>ئێستا:</strong> ${toSoraniNumber(audit.currentWords)} وشە (${toSoraniNumber(audit.percentage)}٪ لە ئامانج)</p>\n`;
      html += `<table style="width: 100%; border-collapse: collapse; font-size: 10pt;" dir="rtl">\n`;
      html += `<tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;"><th style="padding: 8px; text-align: right;">بەش</th><th style="padding: 8px; text-align: right;">ئامانجی بەش</th><th style="padding: 8px; text-align: right;">وشەی ئێستا</th><th style="padding: 8px; text-align: right;">دەقی سەرەکی</th><th style="padding: 8px; text-align: right;">دۆخ</th></tr>\n`;
      audit.chapterAudits.forEach(ch => {
        html += `<tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px;">${ch.chapterTitle}</td>
          <td style="padding: 6px;">${toSoraniNumber(ch.targetWords)}</td>
          <td style="padding: 6px;">${toSoraniNumber(ch.currentWords)}</td>
          <td style="padding: 6px;">${toSoraniNumber(ch.bodyWords)}</td>
          <td style="padding: 6px;">${ch.statusLabel}</td>
        </tr>\n`;
      });
      html += `</table>\n`;
    }

    html += `</div>\n`;
    return html;
  }
}
