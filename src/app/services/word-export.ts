import { Injectable, inject } from '@angular/core';
import type { Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { CameraReadyService } from '../features/camera-ready-publishing/services/camera-ready.service';
import { PublishingMetadata } from '../features/camera-ready-publishing/models/camera-ready.models';
import { UNIVERSITIES, UniversityFormatPreset } from '../features/academic-suite/university-layout-formatter.component';
import { TEMPLATES as APPENDIX_TEMPLATES } from '../features/academic-suite/thesis-appendices-generator.component';
import { toSoraniNumber } from '../pipes/sorani-number.pipe';
import { ExportReportBuilder, VerifiedSourceExportItem, WordCountExportAudit } from './export-report-builder';

export interface ExportChapterData { title: string; content: string; }
export interface ExportSourceItem { id?: string; title: string; author: string; year?: number | string; doi?: string; publisher?: string; }
export interface FullManuscriptExportOptions {
  title: string;
  discipline?: string;
  academicLevel?: string;
  chapters: ExportChapterData[];
  sources?: ExportSourceItem[];
  abstractText?: string;
  customUniversityId?: string;
  appendices?: Array<{ title: string; content: string }>;
  verifiedSourcesReport?: VerifiedSourceExportItem[];
  wordCountAuditReport?: WordCountExportAudit;
}

@Injectable({ providedIn: 'root' })
export class WordExportService {
  private cameraReadyService = inject(CameraReadyService);

  public getActiveUniversityPreset(customId?: string): UniversityFormatPreset {
    let uniId = customId;
    if (!uniId) {
      try { uniId = localStorage.getItem('mam_selected_university') || 'salahaddin'; } catch { uniId = 'salahaddin'; }
    }
    return UNIVERSITIES.find(u => u.id === uniId) || UNIVERSITIES[0];
  }

  public getActiveMetadata(fallbackTitle: string): PublishingMetadata {
    const meta = this.cameraReadyService.loadMetadata();
    if (!meta.titleKurdish?.trim()) meta.titleKurdish = fallbackTitle || 'توێژینەوەی ئەکادیمی';
    return meta;
  }

  public getDefaultAppendices(): Array<{ title: string; content: string }> {
    return APPENDIX_TEMPLATES.map(t => ({ title: t.titleKurdish, content: t.contentTemplate }));
  }

  private extractTablesAndFigures(chapters: ExportChapterData[]): { tables: string[]; figures: string[] } {
    const tables: string[] = [];
    const figures: string[] = [];

    chapters.forEach((ch, chIdx) => {
      const content = ch.content || '';
      // Tables detection (markdown or text label)
      const tableMatches = content.match(/(?:خشتەی?\s*\(?[\u0660-\u0669\d]+[-\u0660-\u0669\d]*\)?[:\s\-]+[^\n\r]+)/g);
      if (tableMatches) {
        tableMatches.forEach(t => tables.push(t.trim()));
      } else if (content.includes('|') && content.includes('---')) {
        tables.push(`خشتەی (${toSoraniNumber(chIdx + 1)}-١): داتای شیکاری و دەقی تەوەری بەشی ${toSoraniNumber(chIdx + 1)}`);
      }

      // Figures detection
      const figMatches = content.match(/(?:شێوەی?\s*\(?[\u0660-\u0669\d]+[-\u0660-\u0669\d]*\)?[:\s\-]+[^\n\r]+|وێنەی?\s*\(?[\u0660-\u0669\d]+[-\u0660-\u0669\d]*\)?[:\s\-]+[^\n\r]+)/g);
      if (figMatches) {
        figMatches.forEach(f => figures.push(f.trim()));
      }
    });

    return { tables, figures };
  }

  async generateDocxBlob(
    title: string,
    discipline: string = 'زانستە گشتییەکان',
    academicLevel: string = 'ماستەر',
    chapters: ExportChapterData[] = [],
    options?: Partial<FullManuscriptExportOptions>
  ): Promise<Blob> {
    const { Document, HeadingLevel, Packer, Paragraph, TextRun, AlignmentType, SectionType, Footer, PageNumber, NumberFormat } = await import('docx');
    const uni = this.getActiveUniversityPreset(options?.customUniversityId);
    const meta = this.getActiveMetadata(title);
    const sources = options?.sources || [];
    const abstract = options?.abstractText || meta.ethicalStatement || '';
    const appendices = options?.appendices?.length ? options.appendices : this.getDefaultAppendices();

    const rightMarginTwips = Math.round((uni.innerGutterMarginCm || 3.5) * 567);
    const outerMarginTwips = Math.round((uni.outerMarginCm || 2.5) * 567);
    const fontName = 'UniQAIDAR';

    const mkP = (txt: string, size = 26, bold = false, align: any = AlignmentType.RIGHT, after = 180, line?: number, pageBreak = false, heading?: any) =>
      new Paragraph({
        heading,
        children: [new TextRun({ text: txt, size, bold, font: fontName })],
        alignment: align,
        bidirectional: true,
        pageBreakBefore: pageBreak,
        spacing: { after, line }
      });

    const frontMatterChildren: Paragraph[] = [];
    const mainBodyChildren: Paragraph[] = [];
    const { tables, figures } = this.extractTablesAndFigures(chapters);

    // --- SECTION 1: FRONT MATTER ---
    // 1. Title Page (No page number on first page)
    frontMatterChildren.push(
      mkP('حکومەتی هەرێمی کوردستان - عێراق', 24, true, AlignmentType.CENTER, 100),
      mkP('وەزارەتی خوێندنی باڵا و توێژینەوەی زانستی', 24, true, AlignmentType.CENTER, 100),
      mkP(uni.nameKurdish, 28, true, AlignmentType.CENTER, 100),
      mkP(`${meta.faculty || 'کۆلێژی خوێندنی باڵا'} - ${meta.department || 'بەشی زانستی'}`, 22, false, AlignmentType.CENTER, 500),
      mkP(meta.titleKurdish || title, 36, true, AlignmentType.CENTER, 200, undefined, false, HeadingLevel.TITLE)
    );
    if (meta.titleEnglish) {
      frontMatterChildren.push(new Paragraph({
        children: [new TextRun({ text: meta.titleEnglish, size: 24, italics: true, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 350 }
      }));
    }
    const degreeLabel = { bachelor: 'نامەی بەکالۆریۆس', master: 'تێزی ماستەر', phd: 'تێزی دکتۆرا', postdoc: 'توێژینەوەی پۆست-دکتۆرا', book: 'کتێبی زانستی' }[meta.academicDegree] || `بڕوانامەی ${academicLevel}`;
    frontMatterChildren.push(
      mkP(`پێشکەش کراوە بۆ ئەنجوومەنی کۆلێژ بۆ بەدەستهێنانی: ${degreeLabel}`, 24, true, AlignmentType.CENTER, 350),
      mkP('ئامادەکردنی توێژەر:', 22, true, AlignmentType.CENTER, 40),
      mkP(meta.authorName || 'ناوی توێژەر', 26, true, AlignmentType.CENTER, 250),
      mkP('سەرپەرشتیاری زانستی:', 22, true, AlignmentType.CENTER, 40),
      mkP(meta.supervisorName || 'پ. د. سەرپەرشتیاری تێز', 26, true, AlignmentType.CENTER, 350),
      mkP(`ساڵی ئەکادیمی: ${meta.publicationYear || '٢٠٢٦'} زایینی | هەولێر`, 22, true, AlignmentType.CENTER, 200),
      new Paragraph({ children: [], pageBreakBefore: true })
    );

    // 2. Supervisor & Viva Declaration
    frontMatterChildren.push(
      mkP('بەیاننامەی سەرپەرشتیاری زانستی و بڕیاری لیژنەی تاوتوێ', 30, true, AlignmentType.RIGHT, 200, undefined, false, HeadingLevel.HEADING_1),
      mkP('بەیاننامەی سەرپەرشتیار:', 24, true, AlignmentType.RIGHT, 100),
      mkP('ئەم نامەیە لەژێر چاودێری و سەرپەرشتیی ئەم ڕاوێژکارەدا بەپێی ستانداردە زانستییەکان تەواو کراوە و شایستەی ئەوەیە پێشکەش بە ئەنجوومەنی لیژنەی تاوتوێکردن (Viva Committee) بکرێت بۆ بەدەستهێنانی بڕوانامە.', 24, false, AlignmentType.RIGHT, 300, 360),
      mkP('واژۆی سەرپەرشتیار: ___________________          بەروار: ____ / ____ / ٢٠٢٦', 22, true, AlignmentType.RIGHT, 400),
      mkP('بڕیاری لیژنەی تاوتوێکردن (Viva Committee Decision):', 24, true, AlignmentType.RIGHT, 100),
      mkP('ئێمە وەک سەرۆک و ئەندامانی لیژنەی تاوتوێکردن، دوای ئەنجامدانی بەرگریی ئاشکرا و گفتوگۆی زانستی، بڕیارمان دا بە پەسەندکردنی ئەم تێزە بە پلەی شایستە بۆ بەدەستهێنانی پلەی زانستی.', 24, false, AlignmentType.RIGHT, 300, 360),
      mkP('سەرۆکی لیژنە: _________________   ئەندام: _________________   ئەندام: _________________', 22, true, AlignmentType.CENTER, 200),
      new Paragraph({ children: [], pageBreakBefore: true })
    );

    // 3. Dedication & Acknowledgments
    frontMatterChildren.push(
      mkP('پێشکەشکردن (Dedication)', 30, true, AlignmentType.RIGHT, 180, undefined, false, HeadingLevel.HEADING_1),
      mkP('پێشکەشە بە ڕۆحی پاکی شەهیدانی کوردستان، بە باوک و دایکم کە چرای هەمیشەیی ڕێگەی زانست و ژیانم بوون، و بە هەموو ئەو توێژەر و دڵسۆزانەی خزمەت بە زمان و ناسنامەی نەتەوەکەمان دەکەن.', 25, false, AlignmentType.RIGHT, 400, 360),
      mkP('سوپاس و پێزانین (Acknowledgments)', 30, true, AlignmentType.RIGHT, 180, undefined, false, HeadingLevel.HEADING_1),
      mkP('پێش هەموو شتێک سوپاس و ستایش بۆ پەروەردگاری مەزن کە توانای پێ بەخشیم ئەم ئەرکە زانستییە تەواو بکەم. سوپاسی تایبەتم بۆ سەرپەرشتیاری بەڕێزم کە بە ڕێنوێنییە وردەکانی ڕێگەی لێکۆڵینەوەی بۆ ڕۆشن کردمەوە. هەروەها سوپاسی سەرجەم مامۆستایانی بەش و کتێبخانەکان دەکەم بۆ هاوکارییە بەردەوامەکانیان.', 25, false, AlignmentType.RIGHT, 240, 360),
      new Paragraph({ children: [], pageBreakBefore: true })
    );

    // 4. Abstract
    frontMatterChildren.push(
      mkP('پوختەی توێژینەوە (Kurdish Abstract)', 32, true, AlignmentType.RIGHT, 200, undefined, false, HeadingLevel.HEADING_1),
      mkP(abstract || 'ئەم توێژینەوەیە لە چوارچێوەی لێکۆڵینەوەیەکی زانستی بەپێی ستانداردە ئەکادیمییەکان ئەنجامدراوە.', 27, false, AlignmentType.RIGHT, 240, 360),
      mkP(`کلیلەوشەکان: ${discipline}، مێتۆدۆلۆژیا، سۆرانی پێوەر، ئەکادیمی، فرەدەنگی`, 24, true, AlignmentType.RIGHT, 400),
      new Paragraph({ children: [], pageBreakBefore: true })
    );

    // 5. Table of Contents
    frontMatterChildren.push(mkP('پێڕستی بابەتەکان (Table of Contents)', 32, true, AlignmentType.RIGHT, 240, undefined, false, HeadingLevel.HEADING_1));
    chapters.forEach((ch, idx) => frontMatterChildren.push(mkP(`بەشی ${toSoraniNumber(idx + 1)}: ${ch.title}`, 24, true, AlignmentType.RIGHT, 100)));
    frontMatterChildren.push(
      mkP('لیستی سەرچاوە و ژێدەرەکان (References)', 24, true, AlignmentType.RIGHT, 100),
      mkP('پاشکۆکان و فۆڕمەکانی لێژنەی ئەخلاقی (Appendices & IRB)', 24, true, AlignmentType.RIGHT, 240)
    );

    // 6. Table of Tables (Auto-generated if tables exist)
    if (tables.length > 0) {
      frontMatterChildren.push(
        new Paragraph({ children: [], pageBreakBefore: true }),
        mkP('پێڕستی خشتەکان (Table of Tables)', 30, true, AlignmentType.RIGHT, 200, undefined, false, HeadingLevel.HEADING_1)
      );
      tables.forEach(t => frontMatterChildren.push(mkP(t, 23, false, AlignmentType.RIGHT, 100)));
    }

    // 7. Table of Figures (Auto-generated if figures exist)
    if (figures.length > 0) {
      frontMatterChildren.push(
        new Paragraph({ children: [], pageBreakBefore: true }),
        mkP('پێڕستی وێنە و شێوەکان (Table of Figures)', 30, true, AlignmentType.RIGHT, 200, undefined, false, HeadingLevel.HEADING_1)
      );
      figures.forEach(f => frontMatterChildren.push(mkP(f, 23, false, AlignmentType.RIGHT, 100)));
    }

    // --- SECTION 2: MAIN BODY (Starts at page 1 Decimal) ---
    chapters.forEach((chapter, index) => {
      mainBodyChildren.push(mkP(`بەشی ${toSoraniNumber(index + 1)}: ${chapter.title}`, 32, true, AlignmentType.RIGHT, 240, undefined, false, HeadingLevel.HEADING_1));
      const paras = String(chapter.content || '').split(/\n{2,}|\r\n{2,}/);
      const bodyParas: string[] = [];
      const footnoteParas: string[] = [];
      let inFootnotes = false;

      paras.filter(Boolean).forEach(rawP => {
        const clean = rawP.replace(/\n/g, ' ').trim();
        if (clean.includes('پەراوێزەکان') || clean.includes('Footnotes') || clean === '--- پەراوێز ---') {
          inFootnotes = true;
          return;
        }
        if (inFootnotes || /^\[([\u0660-\u0669\d]+)\]\s+/.test(clean)) {
          footnoteParas.push(clean);
        } else {
          bodyParas.push(clean);
        }
      });

      bodyParas.forEach(clean => {
        const isSub = clean.startsWith('###') || clean.startsWith('##');
        mainBodyChildren.push(mkP(clean.replace(/^#+\s*/, ''), isSub ? 28 : 27, isSub, AlignmentType.RIGHT, 160, 360, false, isSub ? HeadingLevel.HEADING_2 : undefined));
      });

      if (footnoteParas.length > 0) {
        mainBodyChildren.push(mkP('────────────────────────', 18, false, AlignmentType.RIGHT, 80));
        footnoteParas.forEach(fn => mainBodyChildren.push(mkP(fn, 21, false, AlignmentType.RIGHT, 70, 240)));
      }

      mainBodyChildren.push(new Paragraph({ children: [], pageBreakBefore: true }));
    });

    // Bibliography
    mainBodyChildren.push(mkP('لیستی سەرچاوە و ژێدەرە زانستییەکان (Bibliography)', 32, true, AlignmentType.RIGHT, 240, undefined, false, HeadingLevel.HEADING_1));
    if (sources.length > 0) {
      sources.forEach((s, idx) => mainBodyChildren.push(mkP(`${toSoraniNumber(idx + 1)}. ${s.author} (${toSoraniNumber(s.year) || 'بێ ساڵ'}). ${s.title}. ${s.publisher || ''} ${s.doi ? `DOI: ${s.doi}` : ''}`.trim(), 24, false, AlignmentType.RIGHT, 120)));
    } else {
      mainBodyChildren.push(mkP('سەرچاوەکان بەپێی شێوازی APA 7th Edition ڕیزکراون.', 24, false, AlignmentType.RIGHT, 200));
    }

    // Appendices
    if (appendices.length > 0) {
      mainBodyChildren.push(
        new Paragraph({ children: [], pageBreakBefore: true }),
        mkP('پاشکۆکان و فۆڕمەکانی لێژنەی ئەخلاقی (Appendices)', 32, true, AlignmentType.RIGHT, 240, undefined, false, HeadingLevel.HEADING_1)
      );
      appendices.forEach(app => {
        mainBodyChildren.push(
          mkP(app.title, 28, true, AlignmentType.RIGHT, 120, undefined, false, HeadingLevel.HEADING_2),
          mkP(app.content.replace(/#+\s*/g, ''), 24, false, AlignmentType.RIGHT, 200, 360)
        );
      });
    }

    // Reports: Source Verification and Word Count Compliance
    if (options?.verifiedSourcesReport) {
      const vReports = ExportReportBuilder.buildDocxVerificationReport(options.verifiedSourcesReport);
      mainBodyChildren.push(...vReports);
    }
    if (options?.wordCountAuditReport) {
      const wcReports = ExportReportBuilder.buildDocxWordCountReport(options.wordCountAuditReport);
      mainBodyChildren.push(...wcReports);
    }

    const document = new Document({
      sections: [
        // Section 1: Front Matter with Abjad / Roman Pagination & Unnumbered Title Page
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              margin: { top: outerMarginTwips, right: rightMarginTwips, bottom: outerMarginTwips, left: outerMarginTwips },
              pageNumbers: { start: 1, formatType: NumberFormat.ARABIC_ABJAD }
            }
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ children: [PageNumber.CURRENT], font: fontName, size: 22 })]
                })
              ]
            })
          },
          children: frontMatterChildren
        },
        // Section 2: Main Body with Arabic / Kurdish Numerals starting strictly at 1
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              margin: { top: outerMarginTwips, right: rightMarginTwips, bottom: outerMarginTwips, left: outerMarginTwips },
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
            }
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ children: [PageNumber.CURRENT], font: fontName, size: 22 })]
                })
              ]
            })
          },
          children: mainBodyChildren
        }
      ]
    });

    return Packer.toBlob(document);
  }

  public generatePrintableHTML(options: FullManuscriptExportOptions): string {
    const uni = this.getActiveUniversityPreset(options.customUniversityId);
    const meta = this.getActiveMetadata(options.title);
    const chapters = options.chapters || [];
    const sources = options.sources || [];
    const abstract = options.abstractText || meta.ethicalStatement || '';
    const appendices = options.appendices?.length ? options.appendices : this.getDefaultAppendices();
    const rightMargin = `${uni.innerGutterMarginCm || 3.5}cm`;
    const otherMargin = `${uni.outerMarginCm || 2.5}cm`;
    const { tables, figures } = this.extractTablesAndFigures(chapters);

    const abjad = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ی'];
    let abjadIdx = 0;

    let html = `<!DOCTYPE html><html lang="ku" dir="rtl"><head><meta charset="UTF-8"><title>${meta.titleKurdish || options.title}</title>
<style>
@page { size: A4 portrait; margin-top: ${otherMargin}; margin-bottom: ${otherMargin}; margin-left: ${otherMargin}; margin-right: ${rightMargin}; }
body { font-family: 'UniQAIDAR', 'Unikurd Goran', 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: justify; color: #0f172a; line-height: 1.85; padding: 0; margin: 0; font-size: 13.5pt; }
.page-break { page-break-after: always; break-after: page; }
.title-page { text-align: center; padding-top: 30px; min-height: 88vh; display: flex; flex-direction: column; justify-content: space-between; }
.uni-header { font-size: 15pt; font-weight: bold; line-height: 1.6; margin-bottom: 30px; }
.thesis-title { font-size: 22pt; font-weight: bold; color: #1e293b; margin: 20px 0 10px; }
.authors-box { font-size: 13pt; line-height: 2; margin: 25px 0; }
h1.sec-title { font-size: 18pt; font-weight: bold; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }
h2.sub-title { font-size: 15pt; font-weight: bold; color: #334155; margin-top: 25px; margin-bottom: 12px; }
p { margin-bottom: 16px; text-indent: 0.8cm; }
.meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; text-indent: 0; }
.toc-item { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 8px 0; font-weight: bold; font-size: 12pt; }
.ref-item { margin-bottom: 12px; text-indent: -0.8cm; padding-right: 0.8cm; font-size: 12pt; }
.footer-badge { text-align: center; font-size: 11pt; color: #64748b; font-family: 'UniQAIDAR', serif; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
@media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
<!-- FRONT MATTER (Abjad pagination, title page unnumbered) -->
<div class="title-page page-break">
  <div class="uni-header">
    <div>حکومەتی هەرێمی کوردستان - عێراق</div>
    <div>وەزارەتی خوێندنی باڵا و توێژینەوەی زانستی</div>
    <div>${uni.nameKurdish}</div>
    <div>${meta.faculty || 'کۆلێژی خوێندنی باڵا'} - ${meta.department || 'بەشی زانستی'}</div>
  </div>
  <div>
    <h1 class="thesis-title">${meta.titleKurdish || options.title}</h1>
    ${meta.titleEnglish ? `<div style="font-size:13pt;color:#64748b;font-style:italic;">${meta.titleEnglish}</div>` : ''}
    <div style="font-size:13pt;font-weight:bold;margin:25px 0;">پێشکەش کراوە بۆ ئەنجوومەنی کۆلێژ بۆ بەدەستهێنانی بڕوانامەی ئەکادیمی</div>
  </div>
  <div class="authors-box">
    <div><strong>ئامادەکردنی توێژەر:</strong> ${meta.authorName || 'ناوی توێژەر'}</div>
    <div><strong>سەرپەرشتیاری زانستی:</strong> ${meta.supervisorName || 'پ. د. سەرپەرشتیاری تێز'}</div>
  </div>
  <div style="font-size:12pt;font-weight:bold;border-top:1px solid #cbd5e1;padding-top:12px;">ساڵی ئەکادیمی: ${meta.publicationYear || '٢٠٢٦'} زایینی | ${uni.city}</div>
</div>

<div class="page-break">
  <h1 class="sec-title">بەیاننامەی سەرپەرشتیار و بڕیاری لیژنەی تاوتوێ</h1>
  <p><strong>بەیاننامەی سەرپەرشتیار:</strong> ئەم نامەیە لەژێر چاودێری و سەرپەرشتیی ئەم ڕاوێژکارەدا تەواو کراوە و شایستەیە پێشکەش بە ئەنجوومەنی لیژنەی تاوتوێکردن (Viva) بکرێت.</p>
  <p><strong>بڕیاری لیژنەی تاوتوێکردن:</strong> ئێمە وەک ئەندامانی لیژنەی تاوتوێ، دوای گفتوگۆی زانستی، بڕیارمان دا بە پەسەندکردنی ئەم تێزە بە پلەی نایاب.</p>
  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div>
</div>

<div class="page-break">
  <h1 class="sec-title">پێشکەشکردن و سوپاس و پێزانین (Dedication & Acknowledgments)</h1>
  <p><strong>پێشکەشکردن:</strong> پێشکەشە بە کەسوکاری سەربەرزی شەهیدان، دایک و باوکم و هەموو دڵسۆزانی زمانی کوردی.</p>
  <p><strong>سوپاس و پێزانین:</strong> سوپاسی بێپایان بۆ پەروەردگار و ڕێز و پێزانین بۆ سەرپەرشتیاری بەڕێزم و مامۆستایانی کۆلێژ.</p>
  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div>
</div>

<div class="page-break">
  <h1 class="sec-title">پوختەی توێژینەوە (Kurdish Abstract)</h1>
  <div class="meta-card"><p style="text-indent: 0; margin-bottom: 0;">${abstract}</p></div>
  <p><strong>کلیلەوشەکان:</strong> ${options.discipline || 'توێژینەوەی زانستی'}، سۆرانی پێوەر، میتۆدۆلۆژیا، ${uni.nameKurdish}.</p>
  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div>
</div>

<div class="page-break">
  <h1 class="sec-title">پێڕستی بابەتەکان (Table of Contents)</h1>
  <div style="margin-top: 15px;">
`;
    chapters.forEach((ch, idx) => {
      html += `    <div class="toc-item"><span>بەشی ${toSoraniNumber(idx + 1)}: ${ch.title}</span><span>لاپەڕە ${toSoraniNumber((idx * 15) + 1)}</span></div>\n`;
    });
    html += `    <div class="toc-item"><span>لیستی سەرچاوە و ژێدەرەکان (Bibliography)</span><span>سەرچاوە</span></div>
    <div class="toc-item"><span>پاشکۆکان و فۆڕمەکانی لێژنەی ئەخلاقی (Appendices)</span><span>پاشکۆ</span></div>
  </div>
  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div>
</div>
`;

    if (tables.length > 0) {
      html += `<div class="page-break"><h1 class="sec-title">پێڕستی خشتەکان (Table of Tables)</h1>\n`;
      tables.forEach((t, idx) => {
        html += `  <div class="toc-item"><span>${t}</span><span>خشتەی ${toSoraniNumber(idx + 1)}</span></div>\n`;
      });
      html += `  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div></div>\n`;
    }

    if (figures.length > 0) {
      html += `<div class="page-break"><h1 class="sec-title">پێڕستی وێنە و شێوەکان (Table of Figures)</h1>\n`;
      figures.forEach((f, idx) => {
        html += `  <div class="toc-item"><span>${f}</span><span>شێوەی ${toSoraniNumber(idx + 1)}</span></div>\n`;
      });
      html += `  <div class="footer-badge">پەڕەی ${abjad[++abjadIdx]}</div></div>\n`;
    }

    // MAIN BODY (Arabic / Kurdish numerals starting strictly at 1)
    let pageNum = 1;
    chapters.forEach((ch, idx) => {
      html += `<div class="page-break"><h1 class="sec-title">بەشی ${toSoraniNumber(idx + 1)}: ${ch.title}</h1>\n`;
      const paragraphs = String(ch.content || '').split(/\n{2,}|\r\n{2,}/);
      const bodyParas: string[] = [];
      const footnoteParas: string[] = [];
      let inFootnotes = false;

      paragraphs.filter(Boolean).forEach(pText => {
        const clean = pText.trim();
        if (clean.includes('پەراوێزەکان') || clean.includes('Footnotes') || clean === '--- پەراوێز ---') {
          inFootnotes = true;
          return;
        }
        if (inFootnotes || /^\[([\u0660-\u0669\d]+)\]\s+/.test(clean)) {
          footnoteParas.push(clean);
        } else {
          bodyParas.push(clean);
        }
      });

      bodyParas.forEach(clean => {
        if (clean.startsWith('###') || clean.startsWith('##')) {
          html += `<h2 class="sub-title">${clean.replace(/^#+\s*/, '')}</h2>\n`;
        } else {
          html += `<p>${clean.replace(/\n/g, '<br>')}</p>\n`;
        }
      });

      if (footnoteParas.length > 0) {
        html += `<div style="margin-top: 25px; border-top: 1px solid #94a3b8; padding-top: 10px; font-size: 10.5pt; color: #334155;">\n`;
        footnoteParas.forEach(fn => { html += `<div style="margin-bottom: 5px; line-height: 1.5;">${fn}</div>\n`; });
        html += `</div>\n`;
      }
      html += `<div class="footer-badge">لاپەڕە ${toSoraniNumber(pageNum++)}</div>\n</div>\n`;
    });

    html += `<div class="page-break"><h1 class="sec-title">لیستی سەرچاوە و ژێدەرە زانستییەکان (Bibliography)</h1>\n`;
    if (sources.length > 0) {
      sources.forEach((s, idx) => {
        html += `<div class="ref-item">${toSoraniNumber(idx + 1)}. ${s.author} (${toSoraniNumber(s.year) || 'بێ ساڵ'}). <i>${s.title}</i>. ${s.publisher || ''} ${s.doi ? `DOI: ${s.doi}` : ''}</div>\n`;
      });
    } else {
      html += `<p>سەرجەم سەرچاوەکان بەپێی ستانداردی ئەکادیمی ڕیزکراون.</p>\n`;
    }
    html += `<div class="footer-badge">لاپەڕە ${toSoraniNumber(pageNum++)}</div>\n</div>\n`;

    if (appendices.length > 0) {
      html += `<div><h1 class="sec-title">پاشکۆکان و بەڵگەنامە ئەخلاقییەکان (Appendices & IRB)</h1>\n`;
      appendices.forEach(app => {
        html += `<h2 class="sub-title">${app.title}</h2><div class="meta-card"><pre style="font-family: inherit; white-space: pre-wrap; font-size: 12pt;">${app.content}</pre></div>\n`;
      });
      html += `<div class="footer-badge">لاپەڕە ${toSoraniNumber(pageNum++)}</div>\n</div>\n`;
    }

    if (options.verifiedSourcesReport?.length || options.wordCountAuditReport) {
      html += ExportReportBuilder.buildHtmlReports(options.verifiedSourcesReport || [], options.wordCountAuditReport);
    }

    html += `</body></html>`;
    return html;
  }

  public exportToPrintablePdf(options: FullManuscriptExportOptions): void {
    const html = this.generatePrintableHTML(options);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  }

  public generateManuscriptTextBlob(title: string, discipline: string, academicLevel: string, chapters: ExportChapterData[]): Blob {
    const html = this.generatePrintableHTML({ title, discipline, academicLevel, chapters });
    return new Blob(['\ufeff' + html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8' });
  }
}
