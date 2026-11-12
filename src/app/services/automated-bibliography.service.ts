import { Injectable, inject } from '@angular/core';
import { AcademicSourceModel, ChapterItemModel } from '../domain/models';
import { AcademicStyle } from '../domain/enums';
import { CitationBuilder, CitationItem } from '../helpers/citation-builder';
import { auditDocumentCitations, InTextCitationMatch, RealTimeCitationReport } from '../helpers/citation-checker';
import { BibliographyFileExtractor, BibliographyExtractionResult } from '../helpers/bibliography-file-extractor';
import { EditorService } from '../features/editor/services/editor';
import { toSoraniNumber } from '../pipes/sorani-number.pipe';

export interface GeneratedBibliographyItem {
  id: string;
  author: string;
  year: number | string;
  title: string;
  formattedText: string;
  style: string;
  citationCount: number;
  inTextSnippet?: string;
  sourceType: 'book' | 'journal' | 'website' | 'thesis';
  isAutoInferred: boolean;
}

function isStrictCitationEligible(source: AcademicSourceModel): boolean {
  const sourceAny = source as AcademicSourceModel & {
    evidenceType?: 'abstract' | 'snippet' | 'full-text';
    evidenceProvenance?: 'server-verified-fulltext' | 'user-supplied-content' | 'unknown';
  };

  return (
    source.identityStatus === 'verified' &&
    source.evidenceStatus === 'verified' &&
    source.citationEligible === true &&
    sourceAny.evidenceType === 'full-text' &&
    sourceAny.evidenceProvenance === 'server-verified-fulltext' &&
    Boolean(source.evidenceText?.trim())
  );
}

export interface BibliographyScanResult {
  scanTimestamp: string;
  totalInlineCitationsFound: number;
  uniqueSourcesCount: number;
  items: GeneratedBibliographyItem[];
  formattedBibliographyText: string;
  style: AcademicStyle | string;
  unresolvedCitations: InTextCitationMatch[];
  auditReport: RealTimeCitationReport;
}

@Injectable({
  providedIn: 'root'
})
export class AutomatedBibliographyService {
  private editorService = inject(EditorService);

  /**
   * Scans chapters for inline citations, matches them with existing sources or infers them,
   * and builds a formatted reference list.
   */
  public generateBibliography(
    chapters: ChapterItemModel[],
    knownSources: AcademicSourceModel[] = [],
    style: AcademicStyle | string = AcademicStyle.APA
  ): BibliographyScanResult {
    const citationEligibleSources = (knownSources || []).filter(isStrictCitationEligible);
    const audit = auditDocumentCitations(chapters, citationEligibleSources);
    const sourceMap = new Map<string, GeneratedBibliographyItem>();
    const unresolved: InTextCitationMatch[] = [];

    // Process matched citations from known bibliography
    for (const match of audit.matchedCitations) {
      if (match.matchedSource) {
        const src = match.matchedSource;
        const authorKey = Array.isArray(src.authors) && src.authors.length
          ? src.authors.join(', ')
          : src.author;
        const key = `${this.normalizeKey(authorKey)}_${src.year || '0'}`;
        if (!sourceMap.has(key)) {
          const formatted = this.formatSingleSource(src, style);
          sourceMap.set(key, {
            id: src.id || key,
            author: authorKey || '',
            year: src.year || 'بێ ساڵ',
            title: src.title || '',
            formattedText: formatted,
            style: style.toString(),
            citationCount: 1,
            inTextSnippet: match.snippet,
            sourceType: (src.sourceType as any) || 'book',
            isAutoInferred: false
          });
        } else {
          const item = sourceMap.get(key)!;
          item.citationCount += 1;
        }
      }
    }

    // Citations that are present in the manuscript but have no registered source
    // remain unresolved. Never invent a bibliographic record from an author/year string.
    for (const missing of audit.missingInTextCitations) {
      unresolved.push(missing);
    }

    // Also include any registered sources that haven't been cited yet if needed
    for (const un of audit.uncitedBibliographyEntries) {
      const key = `${this.normalizeKey(un.author)}_${un.year || '0'}`;
      if (!sourceMap.has(key)) {
        const formatted = this.formatSingleSource(un, style);
        sourceMap.set(key, {
          id: un.id || key,
          author: un.author || 'نووسەری دیارینەکراو',
          year: un.year || 'بێ ساڵ',
          title: un.title || 'سەرچاوەی بێ ناونیشان',
          formattedText: formatted,
          style: style.toString(),
          citationCount: 0,
          sourceType: (un.sourceType as any) || 'book',
          isAutoInferred: false
        });
      }
    }

    // Sort alphabetically by primary author name
    const sortedItems = Array.from(sourceMap.values()).sort((a, b) => {
      return a.author.localeCompare(b.author, 'ckb');
    });

    const formattedBibliographyText = this.constructFullBibliographyDocument(sortedItems, style);

    return {
      scanTimestamp: new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalInlineCitationsFound: audit.totalInTextCitations,
      uniqueSourcesCount: sortedItems.length,
      items: sortedItems,
      formattedBibliographyText,
      style,
      unresolvedCitations: unresolved,
      auditReport: audit
    };
  }

  /**
   * Appends or updates the references list directly in the thesis chapters.
   */
  public appendBibliographyToDocument(
    formattedBibliographyText: string,
    chapters: ChapterItemModel[],
    updateFn: (updated: ChapterItemModel[]) => void
  ): { success: boolean; chapterTitle: string } {
    if (!chapters || chapters.length === 0) {
      return { success: false, chapterTitle: '' };
    }

    // Check if a bibliography / references chapter already exists
    const bibChapterIdx = chapters.findIndex(
      (c) =>
        c.title.includes('سەرچاوە') ||
        c.title.toLowerCase().includes('references') ||
        c.title.toLowerCase().includes('bibliography')
    );

    let updatedList = [...chapters];
    const bibliographyTitle = 'پێڕستی سەرچاوە و ژێدەرە زانستییەکان (Bibliography)';

    if (bibChapterIdx >= 0) {
      // Update existing chapter
      updatedList[bibChapterIdx] = {
        ...updatedList[bibChapterIdx],
        content: formattedBibliographyText,
        wordCount: formattedBibliographyText.trim().split(/\s+/).filter(Boolean).length
      };
    } else {
      // Append a new dedicated chapter at the end
      const maxId = chapters.reduce((max, c) => Math.max(max, c.id || 0), 0);
      const newChapter: ChapterItemModel = {
        id: maxId + 1,
        title: bibliographyTitle,
        content: formattedBibliographyText,
        wordCount: formattedBibliographyText.trim().split(/\s+/).filter(Boolean).length,
        status: 'completed',
        isLocked: false
      };
      updatedList.push(newChapter);
    }

    updateFn(updatedList);
    this.editorService.setChapters(updatedList);

    return {
      success: true,
      chapterTitle: bibChapterIdx >= 0 ? chapters[bibChapterIdx].title : bibliographyTitle
    };
  }

  private formatSingleSource(source: AcademicSourceModel, style: AcademicStyle | string): string {
    const srcAny = source as any;
    const authors = Array.isArray(srcAny.authors) && srcAny.authors.length
      ? srcAny.authors.join(', ')
      : source.author || 'نووسەری دیارینەکراو';
    const citationItem: CitationItem = {
      id: source.id,
      authors,
      year: source.year || '',
      title: source.title || '',
      publisher: source.publisher,
      journal: srcAny.journal,
      url: srcAny.url,
      doi: source.doi,
      type: srcAny.type || source.sourceType || 'book'
    };

    switch (style) {
      case AcademicStyle.Harvard:
      case 'Harvard':
        return CitationBuilder.formatHarvard(citationItem);
      case AcademicStyle.MLA:
      case 'MLA':
        return CitationBuilder.formatMLA(citationItem);
      case AcademicStyle.Chicago:
      case 'Chicago':
        return `${citationItem.authors}. ${citationItem.year}. "${citationItem.title}." ${citationItem.publisher ? `${citationItem.publisher}.` : ''}`;
      case AcademicStyle.IEEE:
      case 'IEEE':
        return `${citationItem.authors}, "${citationItem.title}," ${citationItem.publisher ? `${citationItem.publisher}, ` : ''}${citationItem.year}.`;
      case 'Kurdish':
      case 'KurdishAcademic':
        return CitationBuilder.formatKurdishAcademic(citationItem);
      case AcademicStyle.LC_APA:
      case 'LC_APA':
      case 'LC. APA':
        return CitationBuilder.formatLC_APA(citationItem);
      case AcademicStyle.APA:
      case 'APA':
      default:
        return CitationBuilder.formatAPA(citationItem);
    }
  }

  private constructFullBibliographyDocument(
    items: GeneratedBibliographyItem[],
    style: AcademicStyle | string
  ): string {
    if (items.length === 0) {
      return 'هیچ سەرچاوەیەک نەدۆزرایەوە لە دەقی بەشەکاندا.';
    }

    const header = `# پێڕستی سەرچاوە و ژێدەرە زانستییەکان\n` +
      `**ستانداردی فۆرماتکردن:** ${style.toString().toUpperCase()} Style\n` +
      `**کۆی سەرچاوە تۆمارکراوەکان:** ${toSoraniNumber(items.length)} سەرچاوە\n\n---\n\n`;

    const kurdishSources = items.filter((i) => this.isKurdishOrArabic(i.author));
    const foreignSources = items.filter((i) => !this.isKurdishOrArabic(i.author));

    let body = '';

    if (kurdishSources.length > 0) {
      body += `### یەکەم: سەرچاوە کوردی و عەرەبییەکان\n\n`;
      kurdishSources.forEach((item, idx) => {
        body += `${idx + 1}. ${item.formattedText}\n\n`;
      });
    }

    if (foreignSources.length > 0) {
      if (kurdishSources.length > 0) body += `\n### دووەم: سەرچاوە بیانی و ئینگلیزییەکان (Foreign / English References)\n\n`;
      foreignSources.forEach((item, idx) => {
        body += `${idx + 1}. ${item.formattedText}\n\n`;
      });
    }

    return header + body;
  }

  private normalizeKey(str?: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\u0600-\u06FF]/g, '').trim();
  }

  private isKurdishOrArabic(text?: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
  }

  /**
   * Extracts citations from a bibliography text file (.txt, .bib, .ris, or plain text)
   * and maps them to the requested academic citation style.
   */
  public extractAndFormatFromFileText(
    fileContent: string,
    targetStyle: AcademicStyle | string = AcademicStyle.APA
  ): BibliographyExtractionResult {
    return BibliographyFileExtractor.extractAndFormat(fileContent, targetStyle);
  }
}
