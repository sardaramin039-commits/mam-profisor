/**
 * Academic text formatting and word count utilities.
 */
export class AcademicFormatter {
  static countWords(text: string): number {
    if (!text) return 0;
    const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).filter(w => w.length > 0).length;
  }

  static estimateReadingTime(wordCount: number): number {
    // Average academic reading speed: ~200 words per minute
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  static calculatePlagiarismScore(content: string, sources: string[]): number {
    if (!content || !sources || sources.length === 0) return 0;
    let occurrences = 0;
    const words = content.toLowerCase().split(/\s+/);
    for (const source of sources) {
      const sourceWords = source.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4 && sourceWords.includes(word)) {
          occurrences++;
        }
      }
    }
    const score = Math.min(100, Math.round((occurrences / (words.length || 1)) * 100));
    return score;
  }
}
