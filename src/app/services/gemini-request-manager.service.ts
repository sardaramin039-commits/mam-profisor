import { Injectable, inject, signal } from '@angular/core';
import { generateGeminiTextWithRotation } from '../../lib/gemini-browser-client';
import { AppNotificationsService } from '../core/app.notifications';
import { AcademicStoreService } from './academic-store.service';
import { DigitalLibraryService } from './digital-library.service';
import { buildRealSourcesPromptContext, sanitizeCitationMatches } from '../helpers/real-sources-prompt.helper';
import { POLYPHONIC_SYNTHESIS_DIRECTIVES } from '../helpers/polyphonic-synthesis.helper';
import { buildTerminologyLockPromptContext } from '../helpers/terminology-consistency-checker';
import { buildPhase3PromptEnrichment } from '../helpers/thesis-enrichment.helper';

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

  readonly apiKeys = signal<string[]>(this.loadApiKeysFromStorage());
  readonly preferredModel = signal<'flash' | 'pro'>(this.loadModelFromStorage());
  readonly currentKeyIndex = signal<number>(0);

  private loadApiKeysFromStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      return (localStorage.getItem('MAM_GEMINI_API_KEYS') || '').split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
    } catch { return []; }
  }

  private loadModelFromStorage(): 'flash' | 'pro' {
    if (typeof window === 'undefined') return 'flash';
    try {
      return /pro/i.test(localStorage.getItem('MAM_GEMINI_MODEL') || '') ? 'pro' : 'flash';
    } catch { return 'flash'; }
  }

  public setApiKeys(keysInput: string | string[]): void {
    const list = Array.isArray(keysInput) ? keysInput.map(k => k.trim()).filter(Boolean) : keysInput.split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
    const unique = Array.from(new Set(list));
    this.apiKeys.set(unique);
    this.currentKeyIndex.set(0);
    if (typeof window !== 'undefined') localStorage.setItem('MAM_GEMINI_API_KEYS', unique.join(','));
  }

  public setPreferredModel(model: 'flash' | 'pro'): void {
    this.preferredModel.set(model);
    if (typeof window !== 'undefined') localStorage.setItem('MAM_GEMINI_MODEL', model);
  }

  public rotateToNextKey(): string | null {
    const keys = this.apiKeys();
    if (keys.length <= 1) return keys[0] || null;
    const nextIdx = (this.currentKeyIndex() + 1) % keys.length;
    this.currentKeyIndex.set(nextIdx);
    this.notifications.showWarning('خولانەوەی کلیلی API', `بەهۆی بەربەستی کوۆتا (429)، کلیلی ژمارە ${nextIdx + 1} چالاک کرا.`);
    return keys[nextIdx];
  }

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
    finalWords = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
    this.currentWordCountProgress.set({ currentWords: finalWords, targetWords, percent: 100, currentHeading: 'تەواو بوو' });
    this.isProcessing.set(false);
    setTimeout(() => this.currentWordCountProgress.set(null), 4000);
    return { content: accumulatedText, wordCount: finalWords };
  }

  public async callGeminiApi(contents: any, systemInstruction?: string, _retryCount = 0): Promise<string> {
    const keys = this.apiKeys();
    if (keys.length > 0) {
      try {
        const result = await generateGeminiTextWithRotation(keys, this.currentKeyIndex(), contents, systemInstruction, this.preferredModel());
        this.currentKeyIndex.set(result.nextKeyIndex);
        return result.text;
      } catch (error) {
        console.warn('Direct Gemini generation failed; trying the server proxy.', error);
        this.rotateToNextKey();
      }
    }

    try {
      const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
      const response = await fetch('/api/generate_chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: promptText.slice(0, 100),
          chapterTitle: promptText.slice(0, 80),
          discipline: 'ئەکادیمی',
          writingType: 'academic',
          academicLevel: 'ماستەر',
          targetWordsPerChapter: 1200,
          systemInstruction
        })
      });
      if (response.ok) {
        const data = await response.json();
        return typeof data?.content === 'string' ? data.content.trim() : '';
      }
    } catch (error) {
      console.warn('Gemini server proxy was unavailable.', error);
    }
    return '';
  }

  private async fetchChapterChunk(title: string, chapterTitle: string, words: number): Promise<string> {
    const prompt = `تکایە بەشێکی زانستیی دەوڵەمەند بۆ نامەی ماستەر لەسەر: «${title} - ${chapterTitle}» بنووسە. ئامانجی وشە نزیکەی ${words} وشەیە بە کوردیی سۆرانیی پێوەر و زاراوەی ئەکادیمی.`;
    return this.callGeminiApi(prompt);
  }

  /**
   * Builds prompt directives strictly enforcing real sources and zero hallucination.
   */
  public getRealSourcesPromptContext(): string {
    const projectSources = this.academicStore.sources() || [];
    const libraryBooks = this.digitalLibrary.books() || [];
    return buildRealSourcesPromptContext(projectSources, libraryBooks);
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

    return sanitizeCitationMatches(text, allKnown, (unmatched) => {
      this.academicStore.addLog(`[پشکنینی سەرچاوە] ئاماژەی نادۆزراوە «${unmatched}» دەستنیشانکرا.`);
    });
  }

  /**
   * Generates a long academic section by measuring actual Kurdish word count, enforcing real sources,
   * polyphonic literature synthesis, locked terminology, and multi-pass sub-axis expansions.
   */
  public async generateLongAcademicSection(
    prompt: string,
    targetWordCount: number = 1500,
    onProgressCallback?: (progress: { currentWords: number; targetWords: number; percent: number }) => void,
    chapterContext?: { chapterId?: number; chapterTitle?: string }
  ): Promise<{ content: string; wordCount: number }> {
    const targetWords = Math.max(300, targetWordCount);
    const sourcesContext = this.getRealSourcesPromptContext();
    const terminologyLock = buildTerminologyLockPromptContext();
    const phase3Directives = buildPhase3PromptEnrichment({
      chapterId: chapterContext?.chapterId ?? 1,
      chapterTitle: chapterContext?.chapterTitle,
      corpusCards: this.academicStore.researchCorpusCards(),
      matrix: this.academicStore.verticalAlignmentMatrix(),
      chapters: this.academicStore.chapters()
    });
    const enrichedPrompt = [prompt, sourcesContext, POLYPHONIC_SYNTHESIS_DIRECTIVES, terminologyLock, phase3Directives].filter(Boolean).join('\n\n');
    let accumulatedContent = '';

    if (targetWords <= 900) {
      this.currentWordCountProgress.set({ currentWords: 0, targetWords, percent: 20, currentHeading: 'داڕشتنی ڕاستەوخۆ' });
      accumulatedContent = await this.fetchChapterChunk(enrichedPrompt, enrichedPrompt.slice(0, 100), targetWords);
    }

    let currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;

    if (targetWords > 900 || currentCount < targetWords * 0.90) {
      const subAxes = [
        'تەوەری یەکەم: چوارچێوەی ئیپستۆمۆلۆژی، چەمکسازی و کێشەی توێژینەوە',
        'تەوەری دووەم: پێداچوونەوەی ڕەخنەگرانەی فرەدەنگی ئەدەبیاتی پێشوو و دیالۆگی زانایان',
        'تەوەری سێیەم: شیکاریی بەڵگەمحوەر و بونیاتنانی ئەرگیومێنت بە مۆدێلی تولمین',
        'تەوەری چوارەم: خستنەڕووی بۆچوونی جیاواز، ڕەخنەگری و وەڵامدانەوەی زانستی',
        'تەوەری پێنجەم: دەرەنجامگیری، سەنتێزی کەسیی توێژەر و لێکەوتە زانستییەکان'
      ];

      const remainingBudget = Math.max(targetWords - currentCount, targetWords);
      const sectionWords = Math.round(remainingBudget / subAxes.length);

      for (let i = 0; i < subAxes.length; i++) {
        const axis = subAxes[i];
        currentCount = accumulatedContent.trim().split(/\s+/).filter(Boolean).length;
        const percent = Math.min(95, Math.round((currentCount / targetWords) * 100));

        this.currentWordCountProgress.set({ currentWords: currentCount, targetWords, percent, currentHeading: axis });
        onProgressCallback?.({ currentWords: currentCount, targetWords, percent });

        const axisPrompt = `${enrichedPrompt}\n\n[پڕۆتۆکۆڵی داڕشتنی دکتۆرا بە فرەدەنگی، تولمین و سۆرانیی پاراو]:\nتەوەر: «${axis}»\nئامانجی وشە: لانیکەم ${sectionWords} وشە.\nپاشخانی پێشوو:\n${accumulatedContent.slice(-800)}`;
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
