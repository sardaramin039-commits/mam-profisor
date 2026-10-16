import { toSoraniNumber } from '../pipes/sorani-number.pipe';

export interface CitationItem {
  id?: string | number;
  authors: string;
  year: string | number;
  title: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  doi?: string;
  edition?: string;
  place?: string;
  institution?: string;
  accessedDate?: string;
  type?: 'book' | 'journal' | 'website' | 'thesis' | 'report' | 'manuscript';
}

export class CitationBuilder {
  /**
   * APA 7th Edition Formatting
   */
  public static formatAPA(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = this.formatAPAAuthors(item.authors);
    const year = item.year ? `(${item.year})` : '(n.d.)';
    const title = item.title?.trim() || '';
    const type = item.type || (item.journal ? 'journal' : 'book');

    let body = '';
    const doiUrl = item.doi 
      ? ` https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` 
      : item.url ? ` ${item.url}` : '';

    if (type === 'journal' && item.journal) {
      const vol = item.volume ? `, *${item.volume}*` : '';
      const issue = item.issue ? `(${item.issue})` : '';
      const pp = item.pages ? `, ${item.pages}` : '';
      body = `${title}. *${item.journal}*${vol}${issue}${pp}.${doiUrl}`;
    } else if (type === 'thesis') {
      const inst = item.institution || item.publisher || '';
      body = `*${title}* [Doctoral dissertation, ${inst}].${doiUrl}`;
    } else if (type === 'website') {
      const site = item.publisher || item.journal ? ` ${item.publisher || item.journal}.` : '';
      body = `*${title}*.${site}${doiUrl}`;
    } else {
      // Book / Manuscript
      const edition = item.edition ? ` (${item.edition} ed.)` : '';
      const pub = item.publisher ? ` ${item.publisher}.` : '';
      body = `*${title}*${edition}.${pub}${doiUrl}`;
    }

    return `${authors} ${year}. ${body}`.trim();
  }

  /**
   * Library of Congress (LC) & APA 7th Edition Unified Formatting
   */
  public static formatLC_APA(item: CitationItem, lcCallNumber?: string, lcSubjectHeading?: string): string {
    const baseApa = this.formatAPA(item);
    const lcTags: string[] = [];
    if (lcCallNumber) {
      lcTags.push(`[LCC: ${lcCallNumber}]`);
    }
    if (lcSubjectHeading) {
      lcTags.push(`[LCSH: ${lcSubjectHeading}]`);
    }
    if (lcTags.length > 0) {
      return `${baseApa} ${lcTags.join(' ')}`;
    }
    return baseApa;
  }

  /**
   * MLA 9th Edition Formatting
   */
  public static formatMLA(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = this.formatMLAAuthors(item.authors);
    const title = item.title?.trim() || '';
    const type = item.type || (item.journal ? 'journal' : 'book');
    const year = item.year ? `${item.year}` : '';

    let details = '';
    if (type === 'journal' && item.journal) {
      const vol = item.volume ? `vol. ${item.volume}, ` : '';
      const num = item.issue ? `no. ${item.issue}, ` : '';
      const pp = item.pages ? `, pp. ${item.pages}` : '';
      const datePart = year ? `${year}` : '';
      const doi = item.doi ? `, https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` : item.url ? `, ${item.url}` : '';
      details = `"${title}." *${item.journal}*, ${vol}${num}${datePart}${pp}${doi}.`;
    } else if (type === 'website') {
      const site = item.publisher ? `*${item.publisher}*, ` : '';
      const url = item.url ? `, ${item.url}` : '';
      const accessed = item.accessedDate ? `, Accessed ${item.accessedDate}` : '';
      details = `"${title}." ${site}${year}${url}${accessed}.`;
    } else if (type === 'thesis') {
      const inst = item.institution || item.publisher || '';
      details = `*${title}*. ${year}. ${inst}, Dissertation.`;
    } else {
      // Book
      const ed = item.edition ? `${item.edition} ed., ` : '';
      const pub = item.publisher ? `${item.publisher}, ` : '';
      const datePart = year ? `${year}.` : '';
      details = `*${title}*. ${ed}${pub}${datePart}`;
    }

    return `${authors}. ${details}`.replace(/\.\./g, '.').trim();
  }

  /**
   * Harvard Citation Style Formatting
   */
  public static formatHarvard(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = this.formatHarvardAuthors(item.authors);
    const year = item.year ? `(${item.year})` : '(no date)';
    const title = item.title?.trim() || '';
    const type = item.type || (item.journal ? 'journal' : 'book');

    let body = '';
    if (type === 'journal' && item.journal) {
      const vol = item.volume ? `, ${item.volume}` : '';
      const iss = item.issue ? `(${item.issue})` : '';
      const pp = item.pages ? `, pp. ${item.pages}` : '';
      const doi = item.doi ? ` doi: ${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` : '';
      body = `'${title}', *${item.journal}*${vol}${iss}${pp}.${doi}`;
    } else if (type === 'website') {
      const accessed = item.accessedDate ? ` (Accessed: ${item.accessedDate})` : '';
      const url = item.url ? ` Available at: ${item.url}` : '';
      body = `*${title}*.${url}${accessed}.`;
    } else if (type === 'thesis') {
      const inst = item.institution || item.publisher || '';
      body = `*${title}*. PhD thesis. ${inst}.`;
    } else {
      // Book
      const ed = item.edition ? ` ${item.edition} edn.` : '';
      const place = item.place ? `${item.place}: ` : '';
      const pub = item.publisher ? `${item.publisher}.` : '';
      body = `*${title}*${ed}. ${place}${pub}`;
    }

    return `${authors} ${year} ${body}`.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
  }

  /**
   * Chicago Notes & Bibliography bibliography formatting.
   */
  public static formatChicago(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = item.authors.trim();
    const title = item.title.trim();
    const year = item.year ? String(item.year) : 'n.d.';
    if (item.journal) {
      const volume = item.volume ? `, ${item.volume}` : '';
      const issue = item.issue ? ` no. ${item.issue}` : '';
      const pages = item.pages ? `: ${item.pages}` : '';
      const doi = item.doi ? `, https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` : item.url ? `, ${item.url}` : '';
      return `${authors}. "${title}." ${item.journal}${volume}${issue} (${year})${pages}${doi}.`;
    }
    const publisher = item.publisher ? `${item.publisher}, ` : '';
    const place = item.place ? `${item.place}: ` : '';
    return `${authors}. ${title}. ${place}${publisher}${year}.`;
  }

  /**
   * IEEE reference-entry formatting. Numbering is intentionally left to the
   * final document renderer because citation order is document-context dependent.
   */
  public static formatIEEE(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = item.authors.trim();
    const title = item.title.trim();
    const year = item.year ? String(item.year) : 'n.d.';
    if (item.journal) {
      const volume = item.volume ? `, vol. ${item.volume}` : '';
      const issue = item.issue ? `, no. ${item.issue}` : '';
      const pages = item.pages ? `, pp. ${item.pages}` : '';
      const doi = item.doi ? `, doi: ${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` : '';
      return `${authors}, "${title}," ${item.journal}${volume}${issue}${pages}, ${year}${doi}.`;
    }
    const publisher = item.publisher ? ", " + item.publisher : '';
    return `${authors}, ${title}${publisher}, ${year}.`;
  }

  /**
   * Kurdish Academic Citation Formatting (General Standard)
   */
  public static formatKurdishAcademic(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = item.authors.trim();
    const soraniYear = item.year ? `(${toSoraniNumber(item.year)})` : '(بێ مێژوو)';
    const title = item.title?.trim() || 'ناونیشانی توێژینەوە';
    const publisher = item.publisher ? `، چاپخانە/دەزگا: ${item.publisher}` : '';
    const journal = item.journal ? `، گۆڤاری: «${item.journal}»` : '';
    const vol = item.volume ? `، بەرگی ${toSoraniNumber(item.volume)}` : '';
    const pp = item.pages ? `، ل.ل. ${toSoraniNumber(item.pages)}` : '';
    return `• ${authors} ${soraniYear}، «${title}»${journal}${vol}${pp}${publisher}.`;
  }

  /**
   * Kurdish Literary & Research Sources - APA 7th Edition
   * Format: Author (Year). Title (Editor/Edition). Place: Publisher.
   */
  public static formatKurdishAPA(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = this.formatAPAAuthors(item.authors);
    const year = item.year ? `(${item.year})` : '(n.d.)';
    const title = item.title?.trim() || '';
    const place = item.place ? `${item.place}: ` : '';
    const pub = item.publisher ? `${item.publisher}.` : '';
    const ed = item.edition ? ` (چاپی ${item.edition})` : '';

    if (item.journal) {
      const vol = item.volume ? `, *${item.volume}*` : '';
      const iss = item.issue ? `(${item.issue})` : '';
      const pp = item.pages ? `, ${item.pages}` : '';
      return `${authors} ${year}. ${title}. *${item.journal}*${vol}${iss}${pp}.`;
    }
    return `${authors} ${year}. *${title}*${ed}. ${place}${pub}`.trim();
  }

  /**
   * Kurdish Literary & Research Sources - MLA 9th Edition
   * Format: Author. Title. Editor/Institution, Publisher, Year, pp.
   */
  public static formatKurdishMLA(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = this.formatMLAAuthors(item.authors);
    const title = item.title?.trim() || '';
    const pub = item.publisher ? `${item.publisher}, ` : '';
    const year = item.year ? `${item.year}.` : '';

    if (item.journal) {
      const vol = item.volume ? `بەرگی ${item.volume}, ` : '';
      const iss = item.issue ? `ژمارەی ${item.issue}, ` : '';
      const pp = item.pages ? `ل.ل. ${item.pages}.` : '';
      return `${authors}. "${title}." *${item.journal}*, ${vol}${iss}${year ? year.replace('.', ', ') : ''}${pp}`;
    }
    return `${authors}. *${title}*. ${pub}${year}`.trim();
  }

  /**
   * Kurdish Literary & Research Sources - Chicago Bibliography & Footnote
   */
  public static formatKurdishChicago(item: CitationItem): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = item.authors.trim();
    const title = item.title.trim();
    const year = item.year ? String(item.year) : 'بێ مێژوو';
    const place = item.place ? `${item.place}: ` : '';
    const pub = item.publisher ? `${item.publisher}, ` : '';

    if (item.journal) {
      const vol = item.volume ? `, بەرگی ${item.volume}` : '';
      const iss = item.issue ? `، ژمارەی ${item.issue}` : '';
      const pp = item.pages ? `: ${item.pages}` : '';
      return `${authors}. «${title}». *${item.journal}*${vol}${iss} (${year})${pp}.`;
    }
    return `${authors}. *${title}*. ${place}${pub}${year}.`;
  }

  /**
   * Kurdish Academic Footnote Generator (پەراوێز)
   */
  public static formatKurdishFootnote(item: CitationItem, page?: string | number): string {
    if (!item.authors?.trim() || !item.title?.trim()) return '';
    const authors = item.authors.trim();
    const title = item.title.trim();
    const year = item.year ? String(item.year) : '';
    const pageStr = page ? `، ل. ${toSoraniNumber(page)}` : (item.pages ? `، ل. ${toSoraniNumber(item.pages)}` : '');
    const pubInfo = item.publisher || item.place ? ` (${item.place ? item.place + ': ' : ''}${item.publisher || ''}${year ? '، ' + year : ''})` : (year ? ` (${year})` : '');
    return `${authors}، *${title}*${pubInfo}${pageStr}.`;
  }

  /**
   * APA In-Text Kurdish Citation: (نازناوی نووسەر، ساڵ: لاپەڕە)
   */
  public static formatInTextAPA(author: string, year: string | number, page?: string | number): string {
    const cleanAuthor = (author || '').trim();
    const lastName = cleanAuthor.split(/[\s,]+/).pop() || cleanAuthor || 'نووسەر';
    const yearStr = toSoraniNumber(year || 'n.d.');
    if (page) {
      return `(${lastName}، ${yearStr}: ${toSoraniNumber(page)})`;
    }
    return `(${lastName}، ${yearStr})`;
  }

  /**
   * Generates Kurdish numeral footnote marker: [١], [٢], [٣]
   */
  public static formatFootnoteMarker(num: number): string {
    return `[${toSoraniNumber(num)}]`;
  }

  /**
   * Explanatory scholarly note / پەراوێزی ڕوونکردنەوە و ساغکردنەوە
   */
  public static formatExplanatoryNote(num: number, explanation: string): string {
    return `[${toSoraniNumber(num)}] تێبینیی ڕوونکردنەوە: ${explanation}`;
  }

  /**
   * Mode 1: وەرگرتنی دەقاودەقی کورت (Short Direct Quote < 40 words)
   * Enclosed in Kurdish guillemets «...» followed immediately by (نازناو، ساڵ: لاپەڕە) or [ژمارە].
   */
  public static formatShortDirectQuote(
    quoteText: string,
    author: string,
    year: string | number,
    page: string | number,
    citationStyle: 'intext' | 'footnote' = 'intext',
    footnoteNum?: number
  ): string {
    const cleanQuote = quoteText.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim();
    if (citationStyle === 'footnote' && footnoteNum) {
      return `«${cleanQuote}» [${toSoraniNumber(footnoteNum)}]`;
    }
    const cite = this.formatInTextAPA(author, year, page);
    return `«${cleanQuote}» ${cite}`;
  }

  /**
   * Mode 2: وەرگرتنی دەقاودەقی درێژ (Block Quote > 40 words / > 3 lines)
   * Formatted as an indented standalone block without quotation marks.
   */
  public static formatBlockQuote(
    quoteText: string,
    author: string,
    year: string | number,
    page: string | number
  ): string {
    const cleanQuote = quoteText.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim();
    const cite = this.formatInTextAPA(author, year, page);
    const lines = cleanQuote.split('\n').map(l => `> ${l.trim()}`).join('\n');
    return `\n${lines}\n> ${cite}\n`;
  }

  /**
   * Mode 3: وەرگرتنی بەمانا (Paraphrasing / داڕشتنەوەی زانستی)
   * Written in researcher's academic voice with exact page citation.
   */
  public static formatParaphrase(
    paraphrasedText: string,
    author: string,
    year: string | number,
    page: string | number
  ): string {
    const cite = this.formatInTextAPA(author, year, page);
    return `${paraphrasedText.trim()} ${cite}`;
  }

  /**
   * Analyzes text to recommend short quote vs block quote based on word count (< 40 vs >= 40 words).
   */
  public static classifyQuotation(text: string): {
    wordCount: number;
    recommendedMode: 'short' | 'block';
    descriptionKurdish: string;
  } {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    if (count < 40) {
      return {
        wordCount: count,
        recommendedMode: 'short',
        descriptionKurdish: `وەرگرتنی دەقاودەقی کورت (${toSoraniNumber(count)} وشە < ٤٠): بە کەوانەی «...» لەگەڵ لاپەڕە.`
      };
    }
    return {
      wordCount: count,
      recommendedMode: 'block',
      descriptionKurdish: `وەرگرتنی دەقاودەقی درێژ (${toSoraniNumber(count)} وشە >= ٤٠): وەک بلۆککوۆت (Blockquote) بەبێ کەوانە.`
    };
  }

  /**
   * Parses chapter content into body text and extracted footnotes list
   */
  public static parseChapterFootnotes(content: string): { bodyText: string; footnotes: string[] } {
    if (!content) return { bodyText: '', footnotes: [] };
    const lines = content.split('\n');
    const bodyLines: string[] = [];
    const footnotes: string[] = [];
    let inFootnotesSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('پەراوێزەکان') || trimmed.includes('Footnotes') || trimmed === '--- پەراوێز ---') {
        inFootnotesSection = true;
        continue;
      }
      if (inFootnotesSection) {
        if (trimmed.length > 0) footnotes.push(trimmed);
      } else if (/^\[([\u0660-\u0669\d]+)\]\s+/.test(trimmed)) {
        footnotes.push(trimmed);
      } else {
        bodyLines.push(line);
      }
    }
    return { bodyText: bodyLines.join('\n').trim(), footnotes };
  }

  // --- Helper Author Formatters ---

  private static formatAPAAuthors(authorsStr: string): string {
    if (!authorsStr || !authorsStr.trim()) return '';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} & ${list[1]}`;
    return `${list[0]}, et al.`;
  }

  private static formatMLAAuthors(authorsStr: string): string {
    if (!authorsStr || !authorsStr.trim()) return '';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]}, and ${list[1]}`;
    return `${list[0]}, et al`;
  }

  private static formatHarvardAuthors(authorsStr: string): string {
    if (!authorsStr || !authorsStr.trim()) return '';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list[0]} et al.`;
  }
}

