/**
 * src/app/helpers/sorani-spelling.ts
 *
 * Provides comprehensive standard Central Kurdish (Soranî) orthography and spelling correction rules.
 * Standardized according to literary Soranî rules (زانکۆی سەڵاحەدین / ئەکادیمیای کوردی).
 */

export interface SoraniCorrectionResult {
  originalText: string;
  correctedText: string;
  changesCount: number;
}

export class SoraniSpellingCorrector {
  /**
   * Fixes spelling and orthographic errors in Central Kurdish (Soranî) text.
   */
  public static fixSoraniText(text: string): string {
    if (!text || !text.trim()) return text;

    let processed = text;

    // 1. Unicode & Character Normalization (Arabic to Soranî Kurdish)
    processed = processed
      .replace(/ك/g, 'ک')
      .replace(/ي/g, 'ی')
      .replace(/ى/g, 'ی')
      .replace(/ة/g, 'ە')
      .replace(/ؤ/g, 'ۆ')
      .replace(/أ/g, 'ئـ')
      .replace(/إ/g, 'ئـ')
      .replace(/آ/g, 'ئا');

    // Remove zero-width non-joiners or weird spaces inside letters where inappropriate
    processed = processed.replace(/\u200C/g, '');

    // 2. Normalizing Loanwords / Ending Teh Marbuta
    const loanwordMap: [RegExp, string][] = [
      [/\bحكومەت\b/g, 'حکوومەت'],
      [/\bحکومەت\b/g, 'حکوومەت'],
      [/\bدەولەت\b/g, 'دەوڵەت'],
      [/\bدەولەتێک\b/g, 'دەوڵەتێک'],
      [/\bمەملەکەت\b/g, 'مەملەکەت'],
      [/\bپه‌یوه‌ندی\b/g, 'پەیوەندی'],
      [/\bپەیوەندیی\b/g, 'پەیوەندی'],
    ];
    for (const [pattern, replacement] of loanwordMap) {
      processed = processed.replace(pattern, replacement);
    }

    // 3. Converting Informal Dialect Prefixes to Literary Standard Soranî ('ئە' -> 'دە')
    const verbPrefixMap: [RegExp, string][] = [
      [/\bئەکات\b/g, 'دەکات'],
      [/\bئەکەم\b/g, 'دەکەم'],
      [/\bئەکەیت\b/g, 'دەکەیت'],
      [/\bئەکەین\b/g, 'دەکەین'],
      [/\bئەکەن\b/g, 'دەکەن'],
      [/\bئەبێت\b/g, 'دەبێت'],
      [/\bئەبم\b/g, 'دەبم'],
      [/\bئەبیت\b/g, 'دەبیت'],
      [/\bئەبین\b/g, 'دەبین'],
      [/\bئەبن\b/g, 'دەبن'],
      [/\bئەڕوات\b/g, 'دەڕوات'],
      [/\bئەدرێت\b/g, 'دەدرێت'],
      [/\bئەگرێت\b/g, 'دەگرێت'],
      [/\bئەهێنێت\b/g, 'دەهێنێت'],
      [/\bئەوێت\b/g, 'دەوێت'],
      [/\bئەبینێت\b/g, 'دەبینێت'],
      [/\bئەنووسێت\b/g, 'دەنووسێت'],
      [/\bئەخوێنێت\b/g, 'دەخوێنێت'],
      [/\bئەبێ\b/g, 'دەبێت'],
      [/\bئەکا\b/g, 'دەکات'],
      [/\bئەدات\b/g, 'دەدات'],
      [/\bئەبات\b/g, 'دەبات'],
      [/\bئەهێنێ\b/g, 'دەهێنێت'],
      [/\bئەخوێنێ\b/g, 'دەخوێنێت'],
      [/\bئەنووسێ\b/g, 'دەنووسێت'],
    ];
    for (const [pattern, replacement] of verbPrefixMap) {
      processed = processed.replace(pattern, replacement);
    }

    // 4. Common Soranî Lexical & Orthographic Fixes
    const commonWordFixes: [RegExp, string][] = [
      [/\bلەگەل\b/g, 'لەگەڵ'],
      [/\bنیە\b/g, 'نییە'],
      [/\bشتیک\b/g, 'شتێک'],
      [/\bکتێبیک\b/g, 'کتێبێک'],
      [/\bشیوە\b/g, 'شێوە'],
      [/\bشیوەی\b/g, 'شێوەی'],
      [/\bنیوان\b/g, 'نێوان'],
      [/\bلاپەرا\b/g, 'لاپەڕە'],
      [/\bلاپەرە\b/g, 'لاپەڕە'],
      [/\bزور\b/g, 'زۆر'],
      [/\bبووچون\b/g, 'بۆچوون'],
      [/\bبوچون\b/g, 'بۆچوون'],
      [/\bبۆچون\b/g, 'بۆچوون'],
      [/\bپیویست\b/g, 'پێویست'],
      [/\bپیویستە\b/g, 'پێویستە'],
      [/\bزانیاریی\b/g, 'زانیاری'],
      [/\bدۆزینەوەی\b/g, 'دۆزینەوەی'],
    ];
    for (const [pattern, replacement] of commonWordFixes) {
      processed = processed.replace(pattern, replacement);
    }

    // 5. Duplicate Vowels Correction (e.g. 'ێێ' -> 'ێ', 'ۆۆ' -> 'ۆ', 'ییی' -> 'یی')
    processed = processed.replace(/ێێ+/g, 'ێ');
    processed = processed.replace(/ۆۆ+/g, 'ۆ');
    processed = processed.replace(/ییی+/g, 'یی');

    // 6. Punctuation Spacing & Formatting
    // Convert Latin comma to Kurdish comma where between Kurdish text
    processed = processed.replace(/([\u0600-\u06FF]),([\u0600-\u06FF\s])/g, '$1، $2');
    // Convert Latin question mark to Kurdish question mark
    processed = processed.replace(/([\u0600-\u06FF\s])\?/g, '$1؟');

    // Fix whitespace before punctuation marks
    processed = processed
      .replace(/\s+،/g, '،')
      .replace(/\s+\./g, '.')
      .replace(/\s+؛/g, '؛')
      .replace(/\s+:/g, ':')
      .replace(/\s+!/g, '!')
      .replace(/\s+؟/g, '؟');

    // Ensure space AFTER punctuation if followed by a letter
    processed = processed
      .replace(/،([\u0600-\u06FF\w])/g, '، $1')
      .replace(/\.([\u0600-\u06FF\w])/g, '. $1')
      .replace(/؛([\u0600-\u06FF\w])/g, '؛ $1')
      .replace(/:(['"\u0600-\u06FF\w])/g, ': $1')
      .replace(/!([\u0600-\u06FF\w])/g, '! $1')
      .replace(/؟([\u0600-\u06FF\w])/g, '؟ $1');

    // Normalize multiple spaces
    processed = processed.replace(/ +/g, ' ').trim();

    return processed;
  }

  /**
   * Calculates how many changes were made between original and corrected text.
   */
  public static processAndCount(text: string): SoraniCorrectionResult {
    const corrected = this.fixSoraniText(text);
    let count = 0;
    if (text !== corrected) {
      // Rough word level difference count
      const origWords = text.trim().split(/\s+/);
      const corrWords = corrected.trim().split(/\s+/);
      for (let i = 0; i < Math.max(origWords.length, corrWords.length); i++) {
        if (origWords[i] !== corrWords[i]) {
          count++;
        }
      }
      if (count === 0) count = 1; // at least 1 change
    }
    return {
      originalText: text,
      correctedText: corrected,
      changesCount: count
    };
  }
}
