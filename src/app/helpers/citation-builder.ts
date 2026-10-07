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
   * Kurdish Academic Citation Formatting
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

