import { ChapterItemModel, AcademicSourceModel } from '../domain/models';

export interface InTextCitationMatch {
  rawMatch: string;
  authorQuery: string;
  yearQuery?: number;
  chapterId: number;
  chapterTitle: string;
  snippet: string;
  lineNumber: number;
  matchedSource?: AcademicSourceModel;
  status: 'matched' | 'missing_source';
}

export interface RealTimeCitationReport {
  totalInTextCitations: number;
  totalBibliographyEntries: number;
  matchedCount: number;
  missingInTextCount: number;
  uncitedBibliographyCount: number;
  matchedCitations: InTextCitationMatch[];
  missingInTextCitations: InTextCitationMatch[];
  uncitedBibliographyEntries: AcademicSourceModel[];
  auditTimestamp: string;
}

/**
 * Normalizes strings for robust fuzzy comparison between Kurdish / English authors and titles.
 */
function normalizeAuthorName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]/g, '')
    .trim();
}

/**
 * Scans all chapter contents and cross-references against the bibliography array.
 */
export function auditDocumentCitations(
  chapters: ChapterItemModel[],
  bibliography: AcademicSourceModel[]
): RealTimeCitationReport {
  const matchedCitations: InTextCitationMatch[] = [];
  const missingInTextCitations: InTextCitationMatch[] = [];
  const citedSourceIds = new Set<string>();

  // Regex patterns for in-text citations:
  // 1. Parenthetical: (Author, Year) or (Author et al., Year) or (ئەحمەد، 2023)
  const parentheticalRegex = /\(([\u0600-\u06FFa-zA-Z\s.-]+?)(?:,\s*|\s+)(\d{4})\)/g;
  // 2. Narrative: Author (Year) or ئەحمەد (2023)
  const narrativeRegex = /([\u0600-\u06FFa-zA-Z.-]+)\s*\((19\d\d|20\d\d)\)/g;

  chapters.forEach((chapter) => {
    if (!chapter.content) return;

    const lines = chapter.content.split('\n');

    lines.forEach((line, lineIdx) => {
      // 1. Match parenthetical citations
      let match: RegExpExecArray | null;
      parentheticalRegex.lastIndex = 0;
      while ((match = parentheticalRegex.exec(line)) !== null) {
        const rawMatch = match[0];
        const rawAuthor = match[1].trim();
        const year = parseInt(match[2], 10);

        processCitationMatch(
          rawMatch,
          rawAuthor,
          year,
          chapter,
          line,
          lineIdx + 1,
          bibliography,
          matchedCitations,
          missingInTextCitations,
          citedSourceIds
        );
      }

      // 2. Match narrative citations
      narrativeRegex.lastIndex = 0;
      while ((match = narrativeRegex.exec(line)) !== null) {
        const rawMatch = match[0];
        const rawAuthor = match[1].trim();
        const year = parseInt(match[2], 10);

        // Skip if author is a common word
        if (['بڕوانە', 'وەکو', 'سەیربکە', 'لاپەڕە', 'see', 'note'].includes(rawAuthor.toLowerCase())) {
          continue;
        }

        processCitationMatch(
          rawMatch,
          rawAuthor,
          year,
          chapter,
          line,
          lineIdx + 1,
          bibliography,
          matchedCitations,
          missingInTextCitations,
          citedSourceIds
        );
      }
    });
  });

  const uncitedBibliographyEntries = bibliography.filter(
    (src) => src.id && !citedSourceIds.has(src.id)
  );

  return {
    totalInTextCitations: matchedCitations.length + missingInTextCitations.length,
    totalBibliographyEntries: bibliography.length,
    matchedCount: matchedCitations.length,
    missingInTextCount: missingInTextCitations.length,
    uncitedBibliographyCount: uncitedBibliographyEntries.length,
    matchedCitations,
    missingInTextCitations,
    uncitedBibliographyEntries,
    auditTimestamp: new Date().toLocaleTimeString('ckb-IR', { hour: '2-digit', minute: '2-digit' })
  };
}

function processCitationMatch(
  rawMatch: string,
  rawAuthor: string,
  year: number,
  chapter: ChapterItemModel,
  fullLine: string,
  lineNumber: number,
  bibliography: AcademicSourceModel[],
  matchedCitations: InTextCitationMatch[],
  missingInTextCitations: InTextCitationMatch[],
  citedSourceIds: Set<string>
): void {
  const normAuthor = normalizeAuthorName(rawAuthor);

  const matchedSource = bibliography.find((src) => {
    const srcAuthorNorm = normalizeAuthorName(src.author);
    const yearMatch = !src.year || src.year === year;
    const authorMatch =
      srcAuthorNorm.includes(normAuthor) || normAuthor.includes(srcAuthorNorm) || normAuthor === srcAuthorNorm;
    return authorMatch && yearMatch;
  });

  const snippet = fullLine.length > 120 ? fullLine.substring(0, 117) + '...' : fullLine;

  const item: InTextCitationMatch = {
    rawMatch,
    authorQuery: rawAuthor,
    yearQuery: year,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    snippet,
    lineNumber,
    matchedSource,
    status: matchedSource ? 'matched' : 'missing_source'
  };

  if (matchedSource) {
    matchedCitations.push(item);
    if (matchedSource.id) {
      citedSourceIds.add(matchedSource.id);
    }
  } else {
    missingInTextCitations.push(item);
  }
}
