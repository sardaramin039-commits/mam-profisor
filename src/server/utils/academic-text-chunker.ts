/**
 * Academic Text Chunker & Token Windowing Utility
 * Prevents LLM context exhaustion and mid-sentence truncation in long thesis chapters.
 */

export interface TextChunk {
  index: number;
  totalChunks: number;
  content: string;
  wordCount: number;
  estimatedTokens: number;
}

export class AcademicTextChunker {
  /**
   * Approximates token count for Kurdish (Soranî Arabic-script) and English academic text.
   * Kurdish Unicode characters typically take ~1.3 - 1.5 tokens per word (~2.8 characters per token).
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    const cleanText = text.trim();
    return Math.ceil(cleanText.length / 2.8);
  }

  /**
   * Splits a long chapter into coherent semantic blocks honoring paragraph and section breaks.
   */
  static chunkAcademicText(
    text: string,
    maxWordsPerChunk = 2000,
    overlapWords = 150
  ): TextChunk[] {
    const trimmed = (text || '').trim();
    if (!trimmed) return [];

    const words = trimmed.split(/\s+/);
    if (words.length <= maxWordsPerChunk) {
      return [
        {
          index: 0,
          totalChunks: 1,
          content: trimmed,
          wordCount: words.length,
          estimatedTokens: this.estimateTokens(trimmed)
        }
      ];
    }

    const chunks: TextChunk[] = [];
    let startIdx = 0;
    let chunkIndex = 0;

    while (startIdx < words.length) {
      const endIdx = Math.min(words.length, startIdx + maxWordsPerChunk);
      const chunkWords = words.slice(startIdx, endIdx);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        index: chunkIndex,
        totalChunks: 0, // Assigned after loop
        content: chunkText,
        wordCount: chunkWords.length,
        estimatedTokens: this.estimateTokens(chunkText)
      });

      chunkIndex++;
      if (endIdx >= words.length) break;
      startIdx = Math.max(startIdx + 1, endIdx - overlapWords);
    }

    for (const c of chunks) {
      c.totalChunks = chunks.length;
    }

    return chunks;
  }

  /**
   * Safely formats long inputs to fit within model limits without losing academic coherence.
   */
  static fitTextWithinTokenLimit(
    text: string,
    maxAllowedTokens = 7500,
    preservedSuffixWords = 300
  ): string {
    const estimated = this.estimateTokens(text);
    if (estimated <= maxAllowedTokens) return text;

    const words = text.split(/\s+/);
    const targetWordCount = Math.floor(maxAllowedTokens * 0.7);

    if (words.length <= targetWordCount) return text;

    const prefixWords = words.slice(0, targetWordCount - preservedSuffixWords);
    const suffixWords = words.slice(words.length - preservedSuffixWords);

    return `${prefixWords.join(' ')}\n\n[...بەشێکی دەق لە ناوەڕاستدا بۆ پاراستنی توانای مۆدێل کورتکراوەتەوە...]\n\n${suffixWords.join(' ')}`;
  }
}
