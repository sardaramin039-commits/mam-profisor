import { CitationBuilder, CitationItem } from './citation-builder';
import { AcademicStyle } from '../domain/enums';

export interface ExtractedCitationItem {
  id: string;
  rawText: string;
  author: string;
  year: number | string;
  title: string;
  journalOrPublisher: string;
  volume?: string;
  pages?: string;
  doi?: string;
  url?: string;
  sourceType: 'book' | 'journal' | 'thesis' | 'conference' | 'website';
  formattedText: string;
}

export interface BibliographyExtractionResult {
  totalExtracted: number;
  selectedStyle: string;
  items: ExtractedCitationItem[];
  fullFormattedText: string;
  timestamp: string;
}

export class BibliographyFileExtractor {
  /**
   * Automatically extracts citations from raw bibliography file content (BibTeX, RIS, or formatted plain text)
   * and maps them to the requested academic citation style.
   */
  public static extractAndFormat(
    fileContent: string,
    targetStyle: AcademicStyle | string = AcademicStyle.APA
  ): BibliographyExtractionResult {
    if (!fileContent || !fileContent.trim()) {
      return {
        totalExtracted: 0,
        selectedStyle: targetStyle.toString(),
        items: [],
        fullFormattedText: '',
        timestamp: new Date().toLocaleTimeString('ckb-IQ')
      };
    }

    const trimmed = fileContent.trim();
    let extracted: ExtractedCitationItem[] = [];

    // 1. Detect BibTeX format
    if (trimmed.includes('@') && (trimmed.includes('{') && trimmed.includes('}'))) {
      extracted = this.parseBibTeX(trimmed, targetStyle);
    }
    // 2. Detect RIS format
    else if (trimmed.includes('TY  -') && trimmed.includes('ER  -')) {
      extracted = this.parseRIS(trimmed, targetStyle);
    }
    // 3. Fallback: Parse plain text / line-by-line bibliography
    else {
      extracted = this.parsePlainText(trimmed, targetStyle);
    }

    // Generate compiled bibliography text
    const fullFormattedText = this.compileFullBibliography(extracted, targetStyle);

    return {
      totalExtracted: extracted.length,
      selectedStyle: targetStyle.toString(),
      items: extracted,
      fullFormattedText,
      timestamp: new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' })
    };
  }

  /**
   * Parses BibTeX string into structured citations.
   */
  private static parseBibTeX(content: string, style: AcademicStyle | string): ExtractedCitationItem[] {
    const items: ExtractedCitationItem[] = [];
    const entryRegex = /@(\w+)\s*\{([^,]+),([\s\S]*?)\n\}/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(content)) !== null) {
      const typeStr = match[1].toLowerCase();
      const body = match[3];

      const getField = (fieldName: string): string => {
        const fieldRegex = new RegExp(`${fieldName}\\s*=\\s*[{"]([^}"]+)[}"]`, 'i');
        const m = fieldRegex.exec(body);
        return m ? m[1].trim() : '';
      };

      const author = getField('author') || 'Unknown Author';
      const year = this.extractYear(getField('year') || '2024');
      const title = getField('title') || 'Untitled Work';
      const journalOrPub = getField('journal') || getField('publisher') || getField('booktitle') || 'Academic Press';
      const doi = getField('doi');
      const url = getField('url');
      const pages = getField('pages');
      const volume = getField('volume');

      let sourceType: ExtractedCitationItem['sourceType'] = 'book';
      if (typeStr === 'article') sourceType = 'journal';
      else if (typeStr === 'phdthesis' || typeStr === 'mastersthesis') sourceType = 'thesis';
      else if (typeStr === 'inproceedings' || typeStr === 'conference') sourceType = 'conference';
      else if (typeStr === 'misc' || typeStr === 'online') sourceType = 'website';

      const citationItem: CitationItem = {
        authors: author,
        year,
        title,
        publisher: sourceType === 'book' ? journalOrPub : undefined,
        journal: sourceType === 'journal' ? journalOrPub : undefined,
        pages,
        doi,
        url,
        type: sourceType === 'conference' ? 'report' : sourceType
      };

      const formatted = this.formatCitationItem(citationItem, style);

      items.push({
        id: `bib_${items.length + 1}_${Date.now()}`,
        rawText: match[0],
        author,
        year,
        title,
        journalOrPublisher: journalOrPub,
        volume,
        pages,
        doi,
        url,
        sourceType,
        formattedText: formatted
      });
    }

    if (items.length === 0) {
      return this.parsePlainText(content, style);
    }
    return items;
  }

  /**
   * Parses RIS format text into structured citations.
   */
  private static parseRIS(content: string, style: AcademicStyle | string): ExtractedCitationItem[] {
    const items: ExtractedCitationItem[] = [];
    const entries = content.split(/ER\s+-\s*/g).filter(e => e.trim().length > 0);

    for (const entry of entries) {
      const lines = entry.split('\n');
      let author = '';
      let title = '';
      let year: number | string = 2024;
      let pub = '';
      let doi = '';
      let url = '';
      let typeStr = 'JOUR';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('TY  -')) typeStr = trimmed.replace('TY  -', '').trim();
        else if (trimmed.startsWith('AU  -') || trimmed.startsWith('A1  -')) {
          const a = trimmed.substring(5).trim();
          author = author ? `${author}, ${a}` : a;
        }
        else if (trimmed.startsWith('TI  -') || trimmed.startsWith('T1  -')) title = trimmed.substring(5).trim();
        else if (trimmed.startsWith('PY  -') || trimmed.startsWith('Y1  -')) year = this.extractYear(trimmed.substring(5).trim());
        else if (trimmed.startsWith('JO  -') || trimmed.startsWith('JF  -') || trimmed.startsWith('PB  -')) pub = trimmed.substring(5).trim();
        else if (trimmed.startsWith('DO  -')) doi = trimmed.substring(5).trim();
        else if (trimmed.startsWith('UR  -')) url = trimmed.substring(5).trim();
      }

      if (!author && !title) continue;

      const sourceType: ExtractedCitationItem['sourceType'] = typeStr.includes('JOUR') ? 'journal' : 'book';
      const citationItem: CitationItem = {
        authors: author || 'نووسەری دیارینەکراو',
        year,
        title: title || 'ناونیشانی بێ ناو',
        publisher: pub,
        doi,
        url,
        type: sourceType
      };

      items.push({
        id: `ris_${items.length + 1}`,
        rawText: entry,
        author: author || 'نووسەری دیارینەکراو',
        year,
        title: title || 'ناونیشانی بێ ناو',
        journalOrPublisher: pub,
        doi,
        url,
        sourceType,
        formattedText: this.formatCitationItem(citationItem, style)
      });
    }

    return items;
  }

  /**
   * Parses line-by-line or paragraph-separated bibliography text.
   */
  private static parsePlainText(content: string, style: AcademicStyle | string): ExtractedCitationItem[] {
    const rawLines = content.split(/\n\s*\n|\n(?=[0-9]+[.)]|\[[0-9]+\]|[-*•]\s|[A-Z\u0600-\u06FF])/g)
      .map(l => l.replace(/^(\d+[.)\]]|\*|-|•)\s*/, '').trim())
      .filter(l => l.length > 10);

    const items: ExtractedCitationItem[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const parsed = this.parseSingleReferenceLine(line);

      const citationItem: CitationItem = {
        authors: parsed.author,
        year: parsed.year,
        title: parsed.title,
        publisher: parsed.journalOrPublisher,
        doi: parsed.doi,
        url: parsed.url,
        type: parsed.sourceType === 'conference' ? 'report' : parsed.sourceType
      };

      const formatted = this.formatCitationItem(citationItem, style);

      items.push({
        id: `extracted_${i + 1}_${Date.now()}`,
        rawText: line,
        author: parsed.author,
        year: parsed.year,
        title: parsed.title,
        journalOrPublisher: parsed.journalOrPublisher,
        doi: parsed.doi,
        url: parsed.url,
        sourceType: parsed.sourceType,
        formattedText: formatted
      });
    }

    return items;
  }

  /**
   * Extracts components (Author, Year, Title, Journal/Publisher) from a single reference string.
   */
  private static parseSingleReferenceLine(line: string): {
    author: string;
    year: number | string;
    title: string;
    journalOrPublisher: string;
    doi?: string;
    url?: string;
    sourceType: 'book' | 'journal' | 'thesis' | 'conference' | 'website';
  } {
    // 1. Extract DOI or URL if present
    let doi: string | undefined;
    let url: string | undefined;
    const doiMatch = line.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    if (doiMatch) doi = doiMatch[1];
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) url = urlMatch[1];

    // Cleaned line without url/doi for parsing
    const clean = line.replace(/https?:\/\/[^\s]+/g, '').trim();

    // 2. Try match Author (Year) pattern: e.g. "Smith, J. (2020). Modern Linguistics..."
    // or Kurdish: "د. کمال مەزهەر (١٩٨١). مێژووی کورد..."
    const yearParenMatch = clean.match(/^([^(]+?)\s*\((\d{4}|[\u0660-\u0669\u06F0-\u06F9]{4})\)\s*[.:]?(.*)$/);
    if (yearParenMatch) {
      const author = yearParenMatch[1].trim();
      const year = this.extractYear(yearParenMatch[2]);
      const rest = yearParenMatch[3].trim();
      const restParts = rest.split(/[.?!]/).map(s => s.trim()).filter(Boolean);
      const title = restParts[0] || 'ناونیشانی سەرچاوە';
      const journalOrPublisher = restParts.slice(1).join('. ') || 'دەزگای زانستی';

      return {
        author,
        year,
        title,
        journalOrPublisher,
        doi,
        url,
        sourceType: journalOrPublisher.toLowerCase().includes('journal') || journalOrPublisher.includes('گۆڤار') ? 'journal' : 'book'
      };
    }

    // 3. Fallback: split by period or comma
    const parts = clean.split(/[.]/).map(p => p.trim()).filter(Boolean);
    const author = parts[0] || 'نووسەری سەرچاوە';
    const yearMatch = clean.match(/\b(19\d\d|20\d\d|[\u0660-\u0669\u06F0-\u06F9]{4})\b/);
    const year = yearMatch ? this.extractYear(yearMatch[1]) : 2024;
    const title = parts[1] || 'ناونیشانی لێکۆڵینەوە';
    const journalOrPublisher = parts.slice(2).join('. ') || 'چاپکراوی ئەکادیمی';

    return {
      author,
      year,
      title,
      journalOrPublisher,
      doi,
      url,
      sourceType: 'book'
    };
  }

  /**
   * Formats a citation item according to target style using CitationBuilder.
   */
  public static formatCitationItem(item: CitationItem, style: AcademicStyle | string): string {
    const styleKey = style.toString().toLowerCase();

    if (styleKey.includes('harvard')) {
      return CitationBuilder.formatHarvard(item);
    } else if (styleKey.includes('mla')) {
      return CitationBuilder.formatMLA(item);
    } else if (styleKey.includes('chicago')) {
      return `${item.authors}. ${item.year}. "${item.title}." ${item.publisher ? `${item.publisher}.` : ''}${item.doi ? ` https://doi.org/${item.doi}` : ''}`;
    } else if (styleKey.includes('ieee')) {
      return `${item.authors}, "${item.title}," ${item.publisher || item.journal || 'Academic Press'}, ${item.year}.`;
    } else if (styleKey.includes('kurdish')) {
      return CitationBuilder.formatKurdishAcademic(item);
    } else {
      // Default: APA 7th
      return CitationBuilder.formatAPA(item);
    }
  }

  /**
   * Compiles the full list into a clean academic bibliography document.
   */
  private static compileFullBibliography(items: ExtractedCitationItem[], style: AcademicStyle | string): string {
    if (items.length === 0) return '';

    // Sort alphabetically by author
    const sorted = [...items].sort((a, b) => a.author.localeCompare(b.author, 'ckb'));

    let text = `## پێڕستی سەرچاوە زانستییەکان (${style.toString().toUpperCase()} Style)\n\n`;
    sorted.forEach((item, index) => {
      text += `${index + 1}. ${item.formattedText}\n\n`;
    });

    return text;
  }

  /**
   * Converts Western or Eastern Arabic/Persian numbers to standard 4-digit number.
   */
  private static extractYear(raw: string): number {
    const easternDigits: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    const normalized = raw.replace(/[٠-٩۰-۹]/g, d => easternDigits[d] || d);
    const num = parseInt(normalized.replace(/\D/g, ''), 10);
    return isNaN(num) ? 2024 : num;
  }
}
