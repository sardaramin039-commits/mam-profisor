import { Injectable } from '@angular/core';

// پێناسەی ستانداردی هەر سەرچاوەیەک کە مۆدێلەکە دەیداتەوە
export interface AcademicSource {
  id: string;             // کلیلی تایبەت (بۆ نموونە: "bakhtin_1981")
  author: string;         // ناوی نووسەر (بۆ نموونە: "باختین، میخائیل")
  year: string;           // ساڵی چاپ (بۆ نموونە: "١٩٨١")
  title: string;          // ناونیشانی کتێب یان توێژینەوە
  translatorOrEditor?: string; // وەرگێڕ یان ساغکەرەوە (ئەگەر هەبوو)
  publisherOrJournal: string;  // دەزگای چاپ یان ناوی گۆڤار و شوێن
  language: 'ku' | 'fa' | 'ar' | 'en'; // زمانی سەرچاوەکە بۆ جیاکردنەوەی بیبلۆگرافیا
  citedPageOrNote?: string;    // ژمارەی لاپەڕە یان تێبینیی پەراوێز لەو شوێنەدا
}

export interface FootnoteEntry {
  footnoteNumber: number;
  subSectionCode: string;
  formattedFootnote: string;
  sourceKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicCitationManager {
  // خەزنکردنی سەرچاوەکان بەبێ دووبارەبوونەوە (Key = ناوی نووسەر + ناونیشان)
  private masterBibliography: Map<string, AcademicSource> = new Map();
  private footnotes: FootnoteEntry[] = [];
  private globalFootnoteCounter: number = 1;

  // ١. دروستکردنی کلیلێکی نەگۆڕ بۆ ناسینەوەی سەرچاوەی دووبارە
  public normalizeSourceKey(author: string, title: string): string {
    return `${author.trim().toLowerCase()}_${title.trim().toLowerCase()}`
      .replace(/\s+/g, '_')
      .replace(/[^\p{L}\p{N}_]/gu, '');
  }

  // ٢. گۆڕینی ژمارەی ئینگلیزی بۆ ژمارەی کوردی بۆ ناو پەراوێزەکان
  public toKurdishDigits(num: number | string): string {
    const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().replace(/\d/g, (d) => kurdishDigits[parseInt(d, 10)]);
  }

  // ٣. تۆمارکردنی سەرچاوەکانی هەر قۆناغێک و ڕێکخستنەوەی ژمارەی پەراوێزەکانی ناو دەقەکە
  public processTextAndRegisterSources(
    markdownText: string,
    subSectionCode: string,
    extractedSources: AcademicSource[],
    citationStyle: 'apa_in_text' | 'numbered_footnotes' = 'numbered_footnotes'
  ): { processedMarkdown: string; sectionFootnotes: string[] } {
    let updatedMarkdown = markdownText;
    const sectionFootnotes: string[] = [];

    for (const src of extractedSources) {
      const normalizedKey = this.normalizeSourceKey(src.author, src.title);
      const isAlreadyCitedBefore = this.masterBibliography.has(normalizedKey);

      // ئەگەر سەرچاوەکە نوێ بوو، بیخەرە ناو بیبلۆگرافیای گشتیی تێزەکە
      if (!isAlreadyCitedBefore) {
        this.masterBibliography.set(normalizedKey, {
          ...src,
          id: normalizedKey
        });
      }

      // ئەگەر سیستەمی پەراوێزی ژمارەیی بێت: نیشانەی {{CITE:id}} دەگۆڕێت بۆ ژمارەی پەراوێزی زنجیرەیی
      if (citationStyle === 'numbered_footnotes') {
        const currentFnNum = this.globalFootnoteCounter++;
        const kurdishNum = this.toKurdishDigits(currentFnNum);

        // ئەگەر پێشتر هاتبێت دەنووسێت (هەمان سەرچاوە / سەرچاوەی پێشوو) بەپێی نەریتی ئەکادیمی
        const footnoteText = isAlreadyCitedBefore
          ? `(${kurdishNum}) ${src.author}، ${src.title}، (سەرچاوەی پێشوو)، ل ${src.citedPageOrNote || '—'}.`
          : `(${kurdishNum}) ${src.author} (${src.year})، ${src.title}، ${
              src.translatorOrEditor ? `وەرگێڕانی: ${src.translatorOrEditor}، ` : ''
            }${src.publisherOrJournal}، ل ${src.citedPageOrNote || '—'}.`;

        // گۆڕینی تاگی کاتیی ناو دەقەکە بۆ ژمارەی پەراوێزی کوردی
        const placeholderRegex = new RegExp(`\\{\\{CITE:${src.id}\\}\\}`, 'g');
        updatedMarkdown = updatedMarkdown.replace(placeholderRegex, `<sup>(${kurdishNum})</sup>`);

        this.footnotes.push({
          footnoteNumber: currentFnNum,
          subSectionCode,
          formattedFootnote: footnoteText,
          sourceKey: normalizedKey
        });
        sectionFootnotes.push(footnoteText);
      } else {
        // سیستەمی ناو کەوانە (APA / Harvard): (ناوی نووسەر، ساڵ: لاپەڕە)
        const inTextCitation = `(${src.author.split('،')[0]}، ${src.year}${
          src.citedPageOrNote ? `: ${src.citedPageOrNote}` : ''
        })`;
        const placeholderRegex = new RegExp(`\\{\\{CITE:${src.id}\\}\\}`, 'g');
        updatedMarkdown = updatedMarkdown.replace(placeholderRegex, inTextCitation);
      }
    }

    return {
      processedMarkdown: updatedMarkdown,
      sectionFootnotes
    };
  }

  // ٤. دروستکردنی لیستی کۆتایی سەرچاوەکان (Bibliography) پۆلێنکراو بەپێی زمان و ئەلفوبێ
  public generateFinalBibliographyMarkdown(): string {
    const allSources = Array.from(this.masterBibliography.values());

    const groupByLang = (lang: AcademicSource['language'], locale: string) =>
      allSources
        .filter((s) => s.language === lang)
        .sort((a, b) => a.author.localeCompare(b.author, locale));

    const kurdishSources = groupByLang('ku', 'ckb');
    const persianSources = groupByLang('fa', 'fa');
    const arabicSources = groupByLang('ar', 'ar');
    const englishSources = groupByLang('en', 'en');

    const formatSourceLine = (s: AcademicSource, index: number, isRtl: boolean = true) => {
      const num = isRtl ? this.toKurdishDigits(index + 1) : `${index + 1}`;
      const trans = s.translatorOrEditor ? ` (${s.translatorOrEditor})، ` : '، ';
      return `${num}. ${s.author} (${s.year}). *${s.title}*${trans}${s.publisherOrJournal}.`;
    };

    let output = `## لیستی سەرچاوە و بیبلۆگرافیا (References & Bibliography)\n\n`;

    if (kurdishSources.length > 0) {
      output += `### یەکەم: سەرچاوە کوردییەکان\n` + kurdishSources.map((s, i) => formatSourceLine(s, i, true)).join('\n') + `\n\n`;
    }
    if (persianSources.length > 0) {
      output += `### دووەم: سەرچاوە فارسییەکان\n` + persianSources.map((s, i) => formatSourceLine(s, i, true)).join('\n') + `\n\n`;
    }
    if (arabicSources.length > 0) {
      output += `### سێیەم: سەرچاوە عەرەبییەکان\n` + arabicSources.map((s, i) => formatSourceLine(s, i, true)).join('\n') + `\n\n`;
    }
    if (englishSources.length > 0) {
      output += `### چوارەم: سەرچاوە ئینگلیزییەکان (English References)\n` + englishSources.map((s, i) => formatSourceLine(s, i, false)).join('\n') + `\n\n`;
    }

    return output;
  }

  // گەڕاندنەوەی لیستی ناوی سەرچاوە بەکارهاتووەکان بۆ ئەوەی پڕۆمپتەکانی دواتر هەمان فۆڕمات بەکاربهێنن
  public getExistingSourcesSummary(): string {
    return Array.from(this.masterBibliography.values())
      .map((s) => `[ID: ${s.id}] ${s.author} (${s.year}) - ${s.title}`)
      .join(' | ');
  }

  // شیتاڵکردنی دەقی سەرچاوەی خاو بۆ مۆدێلی زانستیی AcademicSource
  public parseCitationStringToAcademicSource(citationText: string, index: number = 0): AcademicSource {
    const clean = citationText.trim();
    const yearMatch = clean.match(/\((\d{4}|[\u06F0-\u06F9\u0660-\u0669]{4})\)/);
    const year = yearMatch ? yearMatch[1] : '—';

    let author = clean;
    let title = clean;
    let publisher = 'دەزگای چاپ و بڵاوکردنەوە';

    if (yearMatch && yearMatch.index !== undefined) {
      author = clean.slice(0, yearMatch.index).replace(/[.،,]/g, '').trim();
      const rest = clean.slice(yearMatch.index + yearMatch[0].length).trim();
      const parts = rest.split(/[.،]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) title = parts[0].replace(/[*_]/g, '');
      if (parts.length > 1) publisher = parts.slice(1).join('، ');
    }

    let language: AcademicSource['language'] = 'ku';
    if (/^[A-Za-z0-9\s.,'":;()\-]+$/.test(author + title)) {
      language = 'en';
    } else if (/[\u0600-\u06FF]/.test(title)) {
      if (title.includes('ی') || title.includes('ێ') || title.includes('ۆ') || title.includes('ڕ') || title.includes('ڵ') || title.includes('ە')) {
        language = 'ku';
      } else if (title.includes('ال') || title.includes('في') || title.includes('من') || title.includes('عن')) {
        language = 'ar';
      } else {
        language = 'fa';
      }
    }

    const key = this.normalizeSourceKey(author || `source_${index}`, title || `title_${index}`);

    return {
      id: key,
      author: author || 'نووسەری ئەکادیمی',
      year,
      title: title || 'ناونیشانی سەرچاوە',
      publisherOrJournal: publisher,
      language
    };
  }

  public getAllSources(): AcademicSource[] {
    return Array.from(this.masterBibliography.values());
  }

  public getAllFootnotes(): FootnoteEntry[] {
    return [...this.footnotes];
  }

  public reset(): void {
    this.masterBibliography.clear();
    this.footnotes = [];
    this.globalFootnoteCounter = 1;
  }
}
