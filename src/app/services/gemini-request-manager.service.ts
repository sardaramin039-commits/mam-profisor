import { Injectable, inject, signal } from '@angular/core';
import { AppNotificationsService } from '../core/app.notifications';
import { AcademicStoreService } from './academic-store.service';
import { DigitalLibraryService } from './digital-library.service';

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
  private academicStore = inject(AcademicStoreService);
  private digitalLibrary = inject(DigitalLibraryService);

  public isProcessing = signal<boolean>(false);
  public currentProgress = signal<ChunkProgress | null>(null);
  public currentWordCountProgress = signal<{
    currentWords: number;
    targetWords: number;
    percent: number;
    currentHeading: string;
  } | null>(null);
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

  /**
   * Automatic Multi-Pass Section-by-Section Expansion Loop
   * Ensures that doctoral-level chapters meet or exceed target word counts without shallow truncation.
   */
  public async expandAcademicChapterSectionBySection(params: {
    chapterTitle: string;
    targetWords: number;
    outlineHeadings?: string[];
    generateSectionFn: (heading: string, sectionTargetWords: number, sectionIndex: number) => Promise<string>;
    onSectionGenerated?: (accumulatedContent: string, currentWords: number) => void;
  }): Promise<{ content: string; wordCount: number }> {
    const targetWords = Math.max(1000, params.targetWords || 1500);
    const headings = params.outlineHeadings && params.outlineHeadings.length > 0
      ? params.outlineHeadings
      : [
          `١. دەروازەی تیۆری، چەمکسازی و ئیپستۆمۆلۆژیای «${params.chapterTitle}»`,
          `٢. شرۆڤە و پێداچوونەوەی ڕەخنەگرانەی ئەدەبیاتی پێشوو و کەلێنی مەعریفی`,
          `٣. شیکاریی ئەرگیومێنت و بەڵگەسازی بە مۆدێلی تولمین (Toulmin Method)`,
          `٤. ڕوانگە هاودژەکان، ڕەخنەگری و وەڵامدانەوەی زانستی (Rebuttal)`,
          `٥. دەرەنجام، هاوسەنگیی دیالێکتیکی و لێکەوتەکانی توێژینەوە`
        ];

    this.isProcessing.set(true);
    let accumulatedText = '';
    const sectionTarget = Math.round(targetWords / headings.length);

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const currentWords = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
      const progressPercent = Math.min(95, Math.round((currentWords / targetWords) * 100));

      this.currentWordCountProgress.set({
        currentWords,
        targetWords,
        percent: progressPercent,
        currentHeading: heading
      });

      try {
        const sectionContent = await this.executeWithTimeout(
          heading,
          () => params.generateSectionFn(heading, sectionTarget, i),
          65
        );

        if (sectionContent && sectionContent.trim().length > 0) {
          accumulatedText += (accumulatedText ? '\n\n' : '') + sectionContent.trim();
        }
      } catch (err) {
        console.warn(`Section expansion warning for "${heading}":`, err);
      }

      const updatedWords = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
      if (params.onSectionGenerated) {
        params.onSectionGenerated(accumulatedText, updatedWords);
      }
    }

    // Secondary expansion pass if content is below 85% of target words
    let finalWords = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
    if (finalWords < targetWords * 0.85) {
      const deficit = targetWords - finalWords;
      const expansionHeading = `٦. شیکاریی بەراوردکاریی فرەڕەهەند و بەهێزکردنی ئەرگیومێنت`;
      this.currentWordCountProgress.set({
        currentWords: finalWords,
        targetWords,
        percent: Math.min(98, Math.round((finalWords / targetWords) * 100)),
        currentHeading: expansionHeading
      });

      try {
        const extraSection = await this.executeWithTimeout(
          expansionHeading,
          () => params.generateSectionFn(expansionHeading, deficit, headings.length),
          65
        );
        if (extraSection && extraSection.trim().length > 0) {
          accumulatedText += '\n\n' + extraSection.trim();
        }
      } catch (err) {
        console.warn('Deficit expansion pass warning:', err);
      }
    }

    finalWords = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
    this.currentWordCountProgress.set({
      currentWords: finalWords,
      targetWords,
      percent: 100,
      currentHeading: 'تەواو بوو'
    });
    this.isProcessing.set(false);

    // Reset progress after brief display
    setTimeout(() => {
      this.currentWordCountProgress.set(null);
    }, 4000);

    return {
      content: accumulatedText,
      wordCount: finalWords
    };
  }

  private async fetchChapterChunk(title: string, chapterTitle: string, words: number): Promise<string> {
    try {
      const resp = await fetch('/api/generate_chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.slice(0, 100), chapterTitle, discipline: 'گشتی', writingType: 'academic',
          academicLevel: 'دکتۆرا', targetWordsPerChapter: words, temperature: 0.35,
          maxOutputTokens: 65536, thinkingTokens: 4096, writingTokens: 32768
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return typeof data?.content === 'string' ? data.content.trim() : '';
      }
    } catch (err) {
      console.warn(`Chapter chunk request failed (${chapterTitle}):`, err);
    }
    return '';
  }

  /**
   * Builds prompt directives strictly enforcing real sources and zero hallucination.
   */
  public getRealSourcesPromptContext(): string {
    const projectSources = this.academicStore.sources() || [];
    const libraryBooks = this.digitalLibrary.books() || [];
    const known = [
      ...projectSources.map(s => `- ${s.author} (${s.year || 'n.d.'}): «${s.title}»`),
      ...libraryBooks.slice(0, 12).map(b => `- ${b.author} (${b.year || 'n.d.'}): «${b.title}»`)
    ];

    if (known.length === 0) {
      return `\n[ڕێسای سەرچاوە زانستییەکان - ZERO HALLUCINATION POLICY]:\nهیچ سەرچاوەیەکی دەرەکی ساختە یان نووسەری خەیاڵی لەنێو کەوانەدا مەنوسە. لەکاتی نەبوونی سەرچاوەی دیاریکراو، بە چەمکسازیی لۆژیکی و چوارچێوەی ئیپستۆمۆلۆژی بابەتەکە شیکار بکە.`;
    }

    return `\n[سەرچاوە ڕاستەقینە باوەڕپێکراوەکان - ZERO HALLUCINATION POLICY]:\nتەنها و تەنها ڕێگەپێدراوە لەم سەرچاوانەی خوارەوە ئاماژەی کەوانەیی (نووسەر، ساڵ) بەکاربهێنیت:\n${known.slice(0, 15).join('\n')}\nقەدەغەکردنی ڕەها: دانانی هەر سەرچاوە، نووسەر، یان ساڵێکی ساختە بە توندی قەدەغەیە؛ ئەگەر پێویست بوو بنووسە: [پێویستی بە سەرچاوە: تێزی توێژەر].`;
  }

  /**
   * Validates in-text citations against project store and library catalog, neutralizing hallucinations.
   */
  public validateAndSanitizeCitations(text: string): string {
    if (!text) return text;
    const projectSources = this.academicStore.sources() || [];
    const libraryBooks = this.digitalLibrary.books() || [];
    const allKnown = [
      ...projectSources.map(s => (s.author || '').toLowerCase()),
      ...libraryBooks.map(b => (b.author || '').toLowerCase())
    ];

    const citeRegex = /\(([\u0600-\u06FFa-zA-Z\s.-]+?)[،,]\s*(\d{4}|[\u0660-\u0669]{4}|n\.d\.)\)/g;
    const skip = new Set(['بڕوانە', 'وەکو', 'سەیربکە', 'لاپەڕە', 'see', 'note']);

    return text.replace(citeRegex, (match, author) => {
      const trimmed = author.trim();
      if (skip.has(trimmed.toLowerCase())) return match;
      const isKnown = allKnown.some(ka => ka && (ka.includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(ka)));
      if (isKnown || allKnown.length === 0) return match;
      this.academicStore.addLog(`[پشکنینی سەرچاوە] ئاماژەی نادۆزراوە «${match}» دەستنیشانکرا.`);
      return `[پێویستی بە سەرچاوەی پشتڕاستکراوەیە: ${trimmed}]`;
    });
  }

  /**
   * Generates a long academic section by measuring actual Kurdish word count, enforcing real sources,
   * and executing multi-pass sub-axis expansions when targetWordCount > 900 or output is under 90% of target.
   */
  public async generateLongAcademicSection(
    prompt: string,
    targetWordCount: number = 1500,
    onProgressCallback?: (progress: { currentWords: number; targetWords: number; percent: number }) => void
  ): Promise<{ content: string; wordCount: number }> {
    const targetWords = Math.max(300, targetWordCount);
    const enrichedPrompt = `${prompt}\n${this.getRealSourcesPromptContext()}`;
    let accumulatedContent = '';

    if (targetWords <= 900) {
      this.currentWordCountProgress.set({ currentWords: 0, targetWords, percent: 20, currentHeading: 'داڕشتنی ڕاستەوخۆ' });
      accumulatedContent = await this.fetchChapterChunk(enrichedPrompt, enrichedPrompt.slice(0, 100), targetWords);
    }

    let currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;

    if (targetWords > 900 || currentCount < targetWords * 0.90) {
      const subAxes = [
        'تەوەری یەکەم: چوارچێوەی ئیپستۆمۆلۆژی، چەمکسازی و کێشەی توێژینەوە',
        'تەوەری دووەم: پێداچوونەوەی ڕەخنەگرانەی ئەدەبیاتی پێشوو و بۆشایی مەعریفی',
        'تەوەری سێیەم: شیکاریی بەڵگەمحوەر و بونیاتنانی ئەرگیومێنت بە مۆدێلی تولمین',
        'تەوەری چوارەم: خستنەڕووی بۆچوونی جیاواز، ڕەخنەگری و وەڵامدانەوەی زانستی',
        'تەوەری پێنجەم: دەرەنجامگیری، هاوسەنگیی دیالێکتیکی و لێکەوتە زانستییەکان'
      ];

      const remainingBudget = Math.max(targetWords - currentCount, targetWords);
      const sectionWords = Math.round(remainingBudget / subAxes.length);

      for (let i = 0; i < subAxes.length; i++) {
        const axis = subAxes[i];
        currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;
        const percent = Math.min(95, Math.round((currentCount / targetWords) * 100));

        this.currentWordCountProgress.set({ currentWords: currentCount, targetWords, percent, currentHeading: axis });
        onProgressCallback?.({ currentWords: currentCount, targetWords, percent });

        const axisPrompt = `${enrichedPrompt}\n\n[پڕۆتۆکۆڵی داڕشتنی دکتۆرا بە تولمین و سۆرانیی پاراو]:\nتەوەر: «${axis}»\nئامانجی وشە: لانیکەم ${sectionWords} وشە.\nپاشخانی پێشوو:\n${accumulatedContent.slice(-800)}`;
        const text = await this.fetchChapterChunk(axisPrompt, axis, sectionWords);
        if (text) accumulatedContent += (accumulatedContent ? '\n\n' : '') + text;
      }

      currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;

      if (currentCount < targetWords * 0.90) {
        const deficit = targetWords - currentCount;
        const continuationHeading = 'تەوەری شەشەم: سەنتێزی فرەڕەهەند و شیکاریی قوڵتر';
        const extraText = await this.fetchChapterChunk(enrichedPrompt, continuationHeading, deficit);
        if (extraText) accumulatedContent += '\n\n' + extraText;
      }
    }

    accumulatedContent = this.validateAndSanitizeCitations(accumulatedContent);
    currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;

    this.currentWordCountProgress.set({ currentWords: currentCount, targetWords, percent: 100, currentHeading: 'تەواو بوو' });
    onProgressCallback?.({ currentWords: currentCount, targetWords, percent: 100 });
    setTimeout(() => this.currentWordCountProgress.set(null), 4000);

    return { content: accumulatedContent, wordCount: currentCount };
  }
}
