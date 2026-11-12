/**
 * src/utils/academicUtils.ts
 *
 * This utility file houses Kurdish text processing and Academic utilities
 * to keep the core `app.ts` file decoupled, modular, and focused purely on UI / API orchestration.
 */

export class TextProcessor {
  /**
   * Cleans Kurdish text by normalizing unicode characters, combining duplicate vowels,
   * and formatting whitespaces.
   */
  public static cleanKurdishText(text: string): string {
    if (!text) return "";

    let processed = text.normalize("NFC");

    // 1. Combine consecutive duplicate Kurdish vowels/glides (ێ, ی, ۆ, و) to a single instance
    // preserving grammatical standards while preventing infinite elongations.
    processed = processed.replace(/([ێیۆوو])\1+/g, '$1');

    // 2. Normalize and strip extra spaces
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  /**
   * Normalizes non-standard characters (like Arabic ي and ك) to Kurdish equivalents (ی and ک).
   */
  public static normalizeSpelling(text: string): string {
    if (!text) return "";
    return text.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  }
}

export interface CitationChapter {
  title: string;
  content?: string;
}

export interface CitationInfo {
  author: string;
  year: string;
  full: string;
  chapterTitle: string;
}

export interface CitationReport {
  uniqueInline: CitationInfo[];
  refLines: string[];
  mismatchedCitations: string[];
  unusedBibliography: string[];
  score: number;
}

export class AcademicUtilities {
  /**
   * Analyzes chapters for inline citation integrity and references list mapping.
   * Calculates a match score and reports discrepancies.
   */
  public static analyzeCitations(chapters: CitationChapter[]): CitationReport {
    const allText = chapters.map(c => c.content || '').join('\n');
    
    // Pattern for inline citations in both Kurdish (Sorani) and English
    const inlineRegex = /\(([\u0600-\u06FF\w\s.\s]+)[،,]\s*(\d{4})\)/g;
    const inlineCitations: CitationInfo[] = [];
    
    chapters.forEach(c => {
      const content = c.content || '';
      let match;
      inlineRegex.lastIndex = 0;
      while ((match = inlineRegex.exec(content)) !== null) {
        inlineCitations.push({
          author: match[1].trim(),
          year: match[2].trim(),
          full: match[0],
          chapterTitle: c.title
        });
      }
    });

    // Unique inline citations
    const uniqueInline = Array.from(new Set(inlineCitations.map(c => c.full))).map(full => {
      return inlineCitations.find(c => c.full === full)!;
    });

    // Extract bibliography/references
    const refLines: string[] = [];
    const lines = allText.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if ((trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) && 
          (trimmed.includes('202') || trimmed.includes('201') || trimmed.includes('200') || trimmed.includes('199'))) {
        refLines.push(trimmed);
      }
    });

    const mismatchedCitations: string[] = [];
    const unusedBibliography: string[] = [];

    uniqueInline.forEach(cite => {
      const authorPart = cite.author.toLowerCase();
      const hasMatch = refLines.some(line => line.toLowerCase().includes(authorPart) && line.includes(cite.year));
      if (!hasMatch) {
        mismatchedCitations.push(cite.full);
      }
    });

    refLines.forEach(line => {
      const yearMatch = line.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        const year = yearMatch[1];
        const isUsed = uniqueInline.some(cite => {
          const authorWord = cite.author.split(/\s+/)[0].replace(/[،,]/g, '').toLowerCase();
          return line.toLowerCase().includes(authorWord) && cite.year === year;
        });
        if (!isUsed) {
          unusedBibliography.push(line);
        }
      }
    });

    const totalCitations = uniqueInline.length;
    const matchedCount = totalCitations - mismatchedCitations.length;
    const score = totalCitations > 0 ? Math.round((matchedCount / totalCitations) * 100) : 100;

    return {
      uniqueInline,
      refLines,
      mismatchedCitations,
      unusedBibliography,
      score
    };
  }

  /**
   * Helper to validate if text is formatted with basic academic standards
   */
  public static validateAcademicFormat(text: string): boolean {
    return !!(text && text.length > 0 && !text.includes('undefined'));
  }

  /**
   * Sanitizes generic output/data for clean storage
   */
  public static sanitizeForStorage(data: unknown): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return TextProcessor.cleanKurdishText(stringData);
  }
}
