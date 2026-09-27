import { Injectable, inject, signal } from '@angular/core';
import { AppNotificationsService } from '../core/app.notifications';

export interface ChunkProgress {
  currentChunk: number;
  totalChunks: number;
  progressPercent: number;
  statusMessage: string;
}

export interface ChunkedProcessingOptions {
  maxWordsPerChunk?: number;
  onProgress?: (progress: ChunkProgress) => void;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiRequestManagerService {
  private notifications = inject(AppNotificationsService);

  public isProcessing = signal<boolean>(false);
  public currentProgress = signal<ChunkProgress | null>(null);
  public lastWarning = signal<string | null>(null);

  /**
   * Splits long Kurdish academic text into manageable semantic chunks to prevent 30s gateway timeouts.
   */
  public splitAcademicTextIntoChunks(text: string, maxWordsPerChunk: number = 1200): string[] {
    if (!text || text.trim().length === 0) return [];
    
    // Split by paragraphs first to preserve semantic unity
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.trim().split(/\s+/).filter(Boolean).length;

      if (currentWordCount + paragraphWords > maxWordsPerChunk && currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentWordCount = paragraphWords;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentWordCount += paragraphWords;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Executes long-running AI requests with progressive timeout warnings and robust error handling.
   */
  public async executeWithTimeout<T>(
    operationName: string,
    asyncFn: (signal: AbortSignal) => Promise<T>,
    timeoutSeconds: number = 75
  ): Promise<T> {
    this.isProcessing.set(true);
    this.lastWarning.set(null);
    const controller = new AbortController();

    // 15s warning timer
    const warnTimer1 = setTimeout(() => {
      this.lastWarning.set('داواکارییەکە لە ژێر پرۆسەکردندایە... پێویستی بە کاتی زیاترە بەهۆی درێژی دەقەکە.');
      this.notifications.showInfo(
        operationName,
        'پرۆسەکردنی دەقە ئەکادیمییەکە لە کاردایە، تکایە کەمێک چاوەڕێ بکە...'
      );
    }, 15000);

    // 40s warning timer
    const warnTimer2 = setTimeout(() => {
      this.lastWarning.set('دەقی ئەکادیمی قەبارە گەورە لە قۆناغی کۆتایی داڕشتنەوەدایە.');
    }, 40000);

    // Hard timeout timer
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, timeoutSeconds * 1000);

    try {
      const result = await asyncFn(controller.signal);
      clearTimeout(warnTimer1);
      clearTimeout(warnTimer2);
      clearTimeout(timeoutTimer);
      this.isProcessing.set(false);
      return result;
    } catch (err: any) {
      clearTimeout(warnTimer1);
      clearTimeout(warnTimer2);
      clearTimeout(timeoutTimer);
      this.isProcessing.set(false);

      if (err.name === 'AbortError' || controller.signal.aborted) {
        const timeoutMsg = `داواکاریی ${operationName} بەهۆی خاوبوونەوەی وەڵام پچڕا (Timeout). دەتوانیت بەشەکان بچووکتر بکەرەوە یان دیسانەوە هەوڵ بدەیت.`;
        this.notifications.showWarning('کاتی داواکاری بەسەرچوو', timeoutMsg);
        throw new Error(timeoutMsg);
      }

      throw err;
    }
  }

  /**
   * Processes a large academic manuscript sequentially in chunks, seamlessly aggregating output.
   */
  public async processLargeManuscriptInChunks(
    fullText: string,
    processChunkFn: (chunk: string, chunkIndex: number) => Promise<string>,
    options?: ChunkedProcessingOptions
  ): Promise<string> {
    const maxWords = options?.maxWordsPerChunk || 1200;
    const chunks = this.splitAcademicTextIntoChunks(fullText, maxWords);

    if (chunks.length <= 1) {
      return processChunkFn(fullText, 0);
    }

    this.isProcessing.set(true);
    const aggregatedResults: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const progress: ChunkProgress = {
        currentChunk: i + 1,
        totalChunks: chunks.length,
        progressPercent: Math.round(((i + 1) / chunks.length) * 100),
        statusMessage: `پرۆسەکردنی بەشی ${i + 1} لە ${chunks.length}...`
      };

      this.currentProgress.set(progress);
      if (options?.onProgress) {
        options.onProgress(progress);
      }

      try {
        const result = await this.executeWithTimeout(
          `بەشی ${i + 1} لە ${chunks.length}`,
          () => processChunkFn(chunks[i], i),
          60
        );
        aggregatedResults.push(result);
      } catch (err) {
        console.warn(`Error processing chunk ${i + 1}:`, err);
        // Retain original chunk if processing failed so no data is lost
        aggregatedResults.push(chunks[i]);
      }
    }

    this.isProcessing.set(false);
    this.currentProgress.set(null);
    return aggregatedResults.join('\n\n');
  }
}
