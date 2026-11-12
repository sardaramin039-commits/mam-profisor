/**
 * Kurdish & Arabic Precise Word Counting and Normalization Engine
 *
 * Designed specifically for Kurdish Sorani (ckb) and Arabic academic prose:
 * - Proper handling of Zero-Width Non-Joiner (ZWNJ \u200C / نیوەبۆشایی) in compound words
 * - Stripping of Arabic/Kurdish diacritics (harakat \u064B-\u065F) and tatweel (\u0640)
 * - Filtering out standalone Kurdish/Arabic punctuation (، ؛ ؟ . « » : ! - etc.)
 * - Optional exclusion of bibliography, in-text citation keys, titles, and markdown headers
 */

export interface WordCountOptions {
  excludeBibliography?: boolean;
  excludeTitles?: boolean;
  excludeFootnotes?: boolean;
  excludeCitationKeys?: boolean;
}

export interface WordCountBreakdown {
  totalWords: number;
  bodyWords: number;
  bibliographyWords: number;
  titleWords: number;
  words: string[];
}

export class KurdishWordCounter {
  // Common Kurdish Sorani and Arabic punctuation marks
  private static readonly PUNCTUATION_REGEX = /[،؛؟«»""''()[\]{}<>…—–\-.:!?/\\]/g;

  // Bibliography header patterns in Kurdish, Arabic, and English
  private static readonly BIBLIOGRAPHY_HEADER_REGEX = /(?:^|\n)\s*(?:#+\s*)?(?:لیستی\s+)?(?:سەرچاوەکان|ژێدەرەکان|سەرچاوە\s+و\s+ژێدەرە\s+زانستییەکان|المصادر\s+والمراجع|المراجع|Bibliography|References)(?:[:\s\n]|$)/i;

  // Title / Heading patterns in Markdown (# Title, ## Heading, etc.)
  private static readonly HEADING_REGEX = /^#{1,6}\s+[^\n]+/gm;

  // In-text citation keys e.g. (ئەحمەد، ٢٠٢٠: ٤٥) or [١]
  private static readonly CITATION_KEY_REGEX = /\((?:[\u0600-\u06FFa-zA-Z\s.-]+?)[،,]\s*(?:\d{4}|[\u0660-\u0669]{4}|n\.d\.)(?:[:\s]+[\u0660-\u0669\d-]+)?\)|\[[\u0660-\u0669\d]+\]/g;

  /**
   * Normalizes text for consistent academic word counting
   */
  public static normalizeKurdishText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFKC')
      // Remove zero-width spaces (\u200B)
      .replace(/\u200B/g, '')
      // Preserve ZWNJ (\u200C) within words, but remove leading/trailing or multiple ZWNJ
      .replace(/\u200C+/g, '\u200C')
      .replace(/\s*\u200C\s*/g, (match, offset, str) => {
        // If surrounded by letters, keep ZWNJ without spaces (compound word)
        const prev = str[offset - 1];
        const next = str[offset + match.length];
        if (prev && next && /[\u0600-\u06FFa-zA-Z]/.test(prev) && /[\u0600-\u06FFa-zA-Z]/.test(next)) {
          return '\u200C';
        }
        return ' ';
      })
      // Remove Arabic Tatweel (\u0640)
      .replace(/\u0640/g, '')
      // Remove Arabic vowel diacritics (harakat)
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .trim();
  }

  /**
   * Separates body text from bibliography section
   */
  public static splitBodyAndBibliography(text: string): { bodyText: string; bibliographyText: string } {
    if (!text) return { bodyText: '', bibliographyText: '' };
    const match = this.BIBLIOGRAPHY_HEADER_REGEX.exec(text);
    if (!match) {
      return { bodyText: text, bibliographyText: '' };
    }
    const splitIndex = match.index;
    return {
      bodyText: text.substring(0, splitIndex).trim(),
      bibliographyText: text.substring(splitIndex).trim()
    };
  }

  /**
   * Tokenizes text into a clean list of words
   */
  public static tokenize(text: string, options: WordCountOptions = {}): string[] {
    if (!text) return [];

    let processed = text;

    if (options.excludeBibliography) {
      const { bodyText } = this.splitBodyAndBibliography(processed);
      processed = bodyText;
    }

    if (options.excludeTitles) {
      processed = processed.replace(this.HEADING_REGEX, '');
    }

    if (options.excludeCitationKeys) {
      processed = processed.replace(this.CITATION_KEY_REGEX, '');
    }

    // Normalize
    const normalized = this.normalizeKurdishText(processed);

    // Split on whitespace or line breaks
    const rawTokens = normalized.split(/\s+/);
    const tokens: string[] = [];

    for (const raw of rawTokens) {
      // Strip punctuation from ends and check if token contains letters/numbers
      const clean = raw.replace(this.PUNCTUATION_REGEX, '').trim();
      // Must contain at least one alphanumeric character (Kurdish/Arabic or Latin or digit)
      if (clean.length > 0 && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\u0660-\u0669\u06F0-\u06F9]/.test(clean)) {
        tokens.push(clean);
      }
    }

    return tokens;
  }

  /**
   * Counts words according to the specified options
   */
  public static countWords(text: string | null | undefined, options: WordCountOptions = {}): number {
    if (!text) return 0;
    return this.tokenize(text, options).length;
  }

  /**
   * Detailed breakdown of manuscript/chapter word count
   */
  public static analyze(text: string): WordCountBreakdown {
    if (!text) {
      return { totalWords: 0, bodyWords: 0, bibliographyWords: 0, titleWords: 0, words: [] };
    }

    const { bodyText, bibliographyText } = this.splitBodyAndBibliography(text);
    const bodyWordsList = this.tokenize(bodyText, { excludeTitles: true, excludeCitationKeys: false });
    const bibWordsList = this.tokenize(bibliographyText);
    
    // Extract titles
    const headings = text.match(this.HEADING_REGEX) || [];
    const titleWordsList = headings.flatMap(h => this.tokenize(h.replace(/^#+\s*/, '')));

    const allTokens = this.tokenize(text);

    return {
      totalWords: allTokens.length,
      bodyWords: bodyWordsList.length,
      bibliographyWords: bibWordsList.length,
      titleWords: titleWordsList.length,
      words: allTokens
    };
  }
}
