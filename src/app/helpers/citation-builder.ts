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
    const authors = this.formatAPAAuthors(item.authors);
    const year = item.year ? `(${item.year})` : '(n.d.)';
    const title = item.title?.trim() || 'Untitled';
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
      const inst = item.institution || item.publisher || 'Institution';
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
   * MLA 9th Edition Formatting
   */
  public static formatMLA(item: CitationItem): string {
    const authors = this.formatMLAAuthors(item.authors);
    const title = item.title?.trim() || 'Untitled';
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
      const inst = item.institution || item.publisher || 'Institution';
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
    const authors = this.formatHarvardAuthors(item.authors);
    const year = item.year ? `(${item.year})` : '(no date)';
    const title = item.title?.trim() || 'Untitled';
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
      const inst = item.institution || item.publisher || 'Institution';
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
   * Kurdish Academic Citation Formatting
   */
  public static formatKurdishAcademic(item: CitationItem): string {
    const authors = item.authors?.trim() || 'نووسەری دیارینەکراو';
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
    if (!authorsStr || !authorsStr.trim()) return 'Unknown Author';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return 'Unknown Author';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} & ${list[1]}`;
    return `${list[0]}, et al.`;
  }

  private static formatMLAAuthors(authorsStr: string): string {
    if (!authorsStr || !authorsStr.trim()) return 'Unknown Author';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return 'Unknown Author';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]}, and ${list[1]}`;
    return `${list[0]}, et al`;
  }

  private static formatHarvardAuthors(authorsStr: string): string {
    if (!authorsStr || !authorsStr.trim()) return 'Anon.';
    const list = authorsStr.split(/[,;&]|\band\b/i).map(a => a.trim()).filter(Boolean);
    if (list.length === 0) return 'Anon.';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list[0]} et al.`;
  }
}

