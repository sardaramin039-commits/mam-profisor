import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppNotificationsService } from '../core/app.notifications';
import { EditorService } from '../features/editor/services/editor';
import { GeminiRequestManagerService } from './gemini-request-manager.service';
import { SubSectionWriterService } from './sub-section-writer.service';
import { AcademicCitationManager, AcademicSource } from './academic-citation-manager.service';
import { ChapterItemModel as ChapterItem, AxisItem, SubBranchItem } from '../domain/models';
import { countKurdishWords } from './data';
import { syncLiveTOCWordCounts } from '../helpers/outline-structure';
import { SYSTEM_PROMPT_GENERATE_CHAPTER } from '../../prompts/system-prompts';
import { DOCTORAL_ACADEMIC_DIRECTIVES } from '../../prompts/academic-rules';

import { LiveProgressService } from './live-progress.service';
import { AcademicLevel } from '../models/level-profiles';
import { AcademicControlsMatrixService } from '../core/services/academic-controls-matrix.service';

export interface BranchWritingOptions {
  manuscriptTitle?: string;
  academicLevel?: string;
  discipline?: string;
  targetChapterId?: number;
  targetBranchId?: string;
  refineFormValue?: any;
  chaptersSignal?: { (): ChapterItem[]; set: (v: ChapterItem[]) => void };
  onUpdate?: () => void;
}

interface ReviewedBranchTitle {
  id: string;
  title: string;
}

interface ReviewedAxisTitle {
  id: string;
  title: string;
  branches: ReviewedBranchTitle[];
}

interface ReviewedChapterTitle {
  id: number;
  title: string;
  axes: ReviewedAxisTitle[];
}

interface ReviewedManuscriptTitles {
  title: string;
  chapters: ReviewedChapterTitle[];
}

@Injectable({
  providedIn: 'root'
})
export class BranchWritingEngineService {
  private http = inject(HttpClient);
  private notifications = inject(AppNotificationsService);
  private editorService = inject(EditorService);
  private requestManager = inject(GeminiRequestManagerService);
  private subSectionWriter = inject(SubSectionWriterService);
  public citationManager = inject(AcademicCitationManager);
  public liveProgress = inject(LiveProgressService);
  private academicControlsMatrix = inject(AcademicControlsMatrixService);

  public isBranchWritingInProgress = signal<boolean>(false);
  public currentWritingStatus = signal<string>('');
  public activeSubBranchId = signal<string | null>(null);
  public currentBranchWords = signal<number>(0);
  public targetBranchWords = signal<number>(0);
  public branchProgressPercent = signal<number>(0);

  private geminiApiUrl(path: string): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return `http://${window.location.hostname}:3000${path}`;
    }
    return path;
  }

  public async reviewAllChapterStructure(
    chapters: ChapterItem[],
    manuscriptTitle: string
  ): Promise<string | null> {
    if (this.isBranchWritingInProgress()) {
      this.notifications.showWarning('پێداچوونەوەی پێکهاتە', 'پڕۆسەیەکی نووسین یان پشکنین لە کاردایە.');
      return null;
    }
    if (chapters.length === 0) {
      this.notifications.showWarning('پێداچوونەوەی پێکهاتە', 'هیچ بەشێک بۆ پێداچوونەوە نییە.');
      return null;
    }

    this.isBranchWritingInProgress.set(true);
    this.currentWritingStatus.set('پێداچوونەوەی ناونیشانەکان...');
    try {
      const source = {
        title: manuscriptTitle,
        chapters: chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          axes: (chapter.axes || []).map(axis => ({
            id: axis.id,
            title: axis.title,
            branches: (axis.branches || []).map(branch => ({ id: branch.id, title: branch.title }))
          }))
        }))
      };
      const responseText = await this.requestManager.callGeminiApi(
        `ناونیشانی گشتی و هەموو سەردێڕەکانی پێکهاتەی خوارەوە بە کوردیی ئەکادیمی چاک بکە. تەنها JSON ـێکی دروست بە هەمان ID و هەمان ڕیزبەندی بگەڕێنەوە؛ هیچ بەشێک مەسڕەوە و هیچ بەشێک زیاد مەکە. شێوازی وەڵام: {"title":"...","chapters":[{"id":1,"title":"...","axes":[{"id":"...","title":"...","branches":[{"id":"...","title":"..."}]}]}]}\n${JSON.stringify(source)}`,
        'تەنها پێکهاتە و ناونیشانەکان چاک بکە. ID و ژمارەی هەموو ئاستەکان بێ گۆڕان بمێنن.'
      );
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start < 0 || end <= start) throw new Error('وەڵامی پێداچوونەوە JSON ـی دروست نەبوو.');
      const reviewed = JSON.parse(responseText.slice(start, end + 1)) as ReviewedManuscriptTitles;
      if (
        typeof reviewed.title !== 'string' ||
        !reviewed.title.trim() ||
        !Array.isArray(reviewed.chapters) ||
        reviewed.chapters.length !== chapters.length
      ) {
        throw new Error('وەڵامی پێداچوونەوە شێوە یان ژمارەی بەشەکانی نەگونجاوە.');
      }
      if (new Set(reviewed.chapters.map(chapter => chapter.id)).size !== chapters.length) {
        throw new Error('وەڵامی پێداچوونەوە ناسنامەی دووبارەی بەشەکان هەیە.');
      }

      const reviewedById = new Map(reviewed.chapters.map(chapter => [chapter.id, chapter]));
      const updated = chapters.map(chapter => {
        const result = reviewedById.get(chapter.id);
        if (!result || typeof result.title !== 'string' || !result.title.trim()) {
          throw new Error(`ناونیشانی بەشی ${chapter.id} لە وەڵامدا نەدۆزرایەوە.`);
        }
        const existingAxes = chapter.axes || [];
        if (!Array.isArray(result.axes) || result.axes.length !== existingAxes.length) {
          throw new Error(`ژمارەی تەوەرەکانی بەشی ${chapter.id} لە وەڵامدا گۆڕاوە.`);
        }
        if (new Set(result.axes.map(axis => axis.id)).size !== existingAxes.length) {
          throw new Error(`ناسنامەی تەوەرەکانی بەشی ${chapter.id} دووبارەیە.`);
        }
        const axisById = new Map(result.axes.map(axis => [axis.id, axis]));
        const axes = existingAxes.map(axis => {
          const reviewedAxis = axisById.get(axis.id);
          if (!reviewedAxis || typeof reviewedAxis.title !== 'string' || !reviewedAxis.title.trim()) {
            throw new Error(`ناونیشانی تەوەری ${axis.id} لە وەڵامدا نەدۆزرایەوە.`);
          }
          if (!Array.isArray(reviewedAxis.branches) || reviewedAxis.branches.length !== axis.branches.length) {
            throw new Error(`ژمارەی لقەکانی تەوەری ${axis.id} لە وەڵامدا گۆڕاوە.`);
          }
          if (new Set(reviewedAxis.branches.map(branch => branch.id)).size !== axis.branches.length) {
            throw new Error(`ناسنامەی لقەکانی تەوەری ${axis.id} دووبارەیە.`);
          }
          const branchById = new Map(reviewedAxis.branches.map(branch => [branch.id, branch]));
          const branches = axis.branches.map(branch => {
            const reviewedBranch = branchById.get(branch.id);
            if (!reviewedBranch || typeof reviewedBranch.title !== 'string' || !reviewedBranch.title.trim()) {
              throw new Error(`ناونیشانی لقی ${branch.id} لە وەڵامدا نەدۆزرایەوە.`);
            }
            return { ...branch, title: reviewedBranch.title.trim() };
          });
          return { ...axis, title: reviewedAxis.title.trim(), branches };
        });
        return { ...chapter, title: result.title.trim(), axes };
      });

      this.editorService.setChapters(updated);
      this.notifications.showSuccess('پێداچوونەوەی پێکهاتە تەواو بوو', 'ناونیشانی کتێب و هەموو ئاستەکانی پێڕست چاککران.');
      return reviewed.title.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'پێداچوونەوەی پێکهاتە سەرکەوتوو نەبوو.';
      this.notifications.showError('هەڵە لە پێداچوونەوەی پێکهاتە', message);
      return null;
    } finally {
      this.isBranchWritingInProgress.set(false);
      this.currentWritingStatus.set('');
    }
  }

  public async humanizeChaptersSequentially(
    manuscriptTitle: string,
    academicLevel: string,
    discipline: string,
    chaptersSignal?: { (): ChapterItem[]; set: (value: ChapterItem[]) => void },
    onUpdate?: () => void
  ): Promise<void> {
    if (this.isBranchWritingInProgress()) {
      this.notifications.showWarning('ئۆتۆهیومانایز', 'پڕۆسەیەکی نووسین یان پشکنین لە کاردایە.');
      return;
    }
    const chapters = this.editorService.chapters();
    const completed = chapters.filter(chapter => chapter.content?.trim());
    if (completed.length === 0) {
      this.notifications.showWarning('ئۆتۆهیومانایز', 'هیچ دەقێکی تەواو نییە بۆ هیومانایزکردن.');
      return;
    }

    this.isBranchWritingInProgress.set(true);
    try {
      for (let index = 0; index < completed.length; index++) {
        const chapter = completed[index];
        this.currentWritingStatus.set(`هیومانایزکردنی بەشی ${chapter.id} لە ${completed.length}...`);
        const protectedText = this.protectVerbatimText(chapter.content);
        const revised = await this.requestManager.callGeminiApi(
          `دەقی کوردیی ئەکادیمیی خوارەوە بە شێوەیەکی ڕەوان و مرۆییتر بنووسە. ناونیشان: ${chapter.title}\nکتێب: ${manuscriptTitle}\nئاست: ${academicLevel}\nبوار: ${discipline}\nژمارە و نیشانەکانی [[MAM_LOCK_nnn]] دەبێت بە هەمان شێوە و تەنها یەک جار بمێنن؛ هیچ گۆڕانکارییەک لە پێکهاتەیاندا مەکە. هیچ پێشەکی یان کۆتاییی زیادە مەنووسە.\n\n${protectedText.text}`,
          'دەقەکە بە کوردیی ئەکادیمی ڕەوان بکە؛ نیشانە پارێزراوەکان، ژمارەکان و دەقی ناو وتە و پەراوێز دەستکاری مەکە.'
        );
        const content = this.restoreVerbatimText(revised, protectedText.tokens);
        if (!content.trim()) throw new Error(`هیومانایزکردنی بەشی ${chapter.id} وەڵامی بەتاڵی دا.`);

        this.editorService.updateChapterContent(chapter.id, content, 'هیومانایزکردنی زنجیرەیی');
        const updatedChapters = this.editorService.chapters();
        chaptersSignal?.set(updatedChapters);
        onUpdate?.();
      }
      this.notifications.showSuccess('ئۆتۆهیومانایز تەواو بوو', `هیومانایزکردنی ${completed.length} بەش بە ڕیز تەواو بوو.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'هیومانایزکردنی بەشەکان سەرکەوتوو نەبوو.';
      this.notifications.showError('هەڵە لە ئۆتۆهیومانایز', message);
    } finally {
      this.isBranchWritingInProgress.set(false);
      this.currentWritingStatus.set('');
    }
  }

  private protectVerbatimText(text: string): { text: string; tokens: string[] } {
    const tokens: string[] = [];
    const protectedText = text.replace(
      /«[^»\n]*»|“[^”\n]*”|"[^"\n]*"|\[[^\]\n]*[0-9٠-٩۰-۹][^\]\n]*\]|[0-9٠-٩۰-۹]+(?:[.,٫][0-9٠-٩۰-۹]+)*/gu,
      match => {
        const placeholder = `[[MAM_LOCK_${String(tokens.length).padStart(3, '0')}]]`;
        tokens.push(match);
        return placeholder;
      }
    );
    return { text: protectedText, tokens };
  }

  private restoreVerbatimText(text: string, tokens: string[]): string {
    const positions: number[] = [];
    for (let index = 0; index < tokens.length; index++) {
      const placeholder = `[[MAM_LOCK_${String(index).padStart(3, '0')}]]`;
      const first = text.indexOf(placeholder);
      if (
        first < 0 ||
        text.indexOf(placeholder, first + placeholder.length) >= 0 ||
        (positions.length > 0 && first <= positions[positions.length - 1])
      ) {
        throw new Error('مۆدێلی نووسین نیشانەی پارێزراوی وتە، ژمارە یان پەراوێزی گۆڕی.');
      }
      positions.push(first);
    }
    if (/\[\[MAM_LOCK_\d{3}\]\]/u.test(text)) {
      throw new Error('مۆدێلی نووسین نیشانەی پارێزراوێکی نەناسراوی زیاد کرد.');
    }
    let restored = text;
    for (let index = tokens.length - 1; index >= 0; index--) {
      const placeholder = `[[MAM_LOCK_${String(index).padStart(3, '0')}]]`;
      restored = restored.replace(placeholder, tokens[index]);
    }
    return restored;
  }

  /**
   * Unabbreviated branch-by-branch writing loop.
   * Strictly iterates through Chapter -> Axis -> SubBranch (لق بە لق)
   * Enforces exact word quota with cognitive bridging and automatic deep expansion.
   */
  public async executeBranchByBranchWriting(
    chapters: ChapterItem[],
    options: BranchWritingOptions = {}
  ): Promise<void> {
    if (this.isBranchWritingInProgress()) {
      this.notifications.showWarning('نووسین لە کاردایە', 'پڕۆسەی نووسینی لقەکان ئێستا چالاکە.');
      return;
    }

    const title = (options.manuscriptTitle || '').trim() || 'تێزی ئەکادیمی';
    const level = options.academicLevel || 'ماستەر';
    const discipline = options.discipline || 'زانستە ئەکادیمییەکان';

    const targetChapters = options.targetChapterId
      ? chapters.filter(c => c.id === options.targetChapterId)
      : chapters.filter(c => c.axes && c.axes.length > 0);

    if (targetChapters.length === 0) {
      this.notifications.showWarning('پێکهاتەی بەشەکان', 'تکایە سەرەتا پێکهاتەی ٣ ئاستی (بەش، تەوەر، لق) ڕێکبخە.');
      return;
    }

    this.isBranchWritingInProgress.set(true);

    try {
      let totalBranches = 0;
      for (const ch of targetChapters) {
        if (!ch.axes) continue;
        for (const ax of ch.axes) {
          if (!ax.branches) continue;
          for (const br of ax.branches) {
            if (!options.targetBranchId || br.id === options.targetBranchId) {
              totalBranches++;
            }
          }
        }
      }
      totalBranches = Math.max(1, totalBranches);
      let branchesCompleted = 0;

      const actionKey = options.targetBranchId
        ? `branch_${options.targetBranchId}`
        : options.targetChapterId
        ? `chapter_${options.targetChapterId}`
        : 'write_all';
      const initialDesc = options.targetBranchId
        ? 'خەریکی داڕشتنی لقی زانستی بە ستانداردی ئەکادیمی...'
        : `خەریکی نووسینی لقە ئەکادیمییەکان (١ لە ${totalBranches})...`;
      this.liveProgress.startTask(actionKey, initialDesc, totalBranches * 45);

      // Memory state for cognitive bridging between successive sub-sections
      let lastSubSectionInfo: {
        code: string;
        title: string;
        executiveSummary: string;
        lastParagraph: string;
      } | undefined = undefined;

      const normLevel: AcademicLevel = (level.includes('دکتۆرا') || level.toLowerCase().includes('phd') || level.toLowerCase().includes('journal') || level.toLowerCase().includes('scopus'))
        ? 'phd'
        : (level.includes('بەکالۆریۆس') || level.toLowerCase().includes('bachelor'))
        ? 'bachelor'
        : (level.includes('قوتابخانە') || level.toLowerCase().includes('school'))
        ? 'school'
        : 'master';

      let lastServerBibliography = '';

      for (let chIdx = 0; chIdx < targetChapters.length; chIdx++) {
        const chapter = targetChapters[chIdx];
        if (!chapter.axes || chapter.axes.length === 0) continue;

        chapter.status = 'writing';
        const chName = chapter.title.split(':')[0] || `بەشی ${chIdx + 1}`;

        for (let aIdx = 0; aIdx < chapter.axes.length; aIdx++) {
          const axis = chapter.axes[aIdx];

          for (let bIdx = 0; bIdx < axis.branches.length; bIdx++) {
            const branch = axis.branches[bIdx];
            if (options.targetBranchId && branch.id !== options.targetBranchId) {
              continue;
            }
            const targetWords = Math.max(350, branch.targetWords || 600);

            this.activeSubBranchId.set(branch.id);
            this.targetBranchWords.set(targetWords);
            this.currentBranchWords.set(0);
            this.branchProgressPercent.set(0);
            branch.status = 'writing';

            const statusText = `خەریکی نووسینی ${chName} لە ${targetChapters.length} (لقی ${branch.code}: ${branch.title})...`;
            this.currentWritingStatus.set(statusText);
            const currentPct = Math.round((branchesCompleted / totalBranches) * 100);
            this.liveProgress.updateProgress(currentPct, statusText, (totalBranches - branchesCompleted) * 45);

            // Compute next sub-section for boundary defense
            let nextSubSection: { code: string; title: string } | undefined = undefined;
            if (bIdx + 1 < axis.branches.length) {
              nextSubSection = {
                code: axis.branches[bIdx + 1].code,
                title: axis.branches[bIdx + 1].title
              };
            } else if (aIdx + 1 < chapter.axes.length && chapter.axes[aIdx + 1].branches?.length > 0) {
              nextSubSection = {
                code: chapter.axes[aIdx + 1].branches[0].code,
                title: chapter.axes[aIdx + 1].branches[0].title
              };
            }

            // Helper to update progress and UI signals as streamed chunks arrive
            const applyBranchProgress = (liveMarkdown: string, liveWordCount: number, statusStep?: string) => {
              branch.content = liveMarkdown;
              branch.wordCount = liveWordCount;
              this.currentBranchWords.set(liveWordCount);
              this.branchProgressPercent.set(Math.min(100, Math.round((liveWordCount / targetWords) * 100)));

              // Recalculate parent axis word count
              axis.wordCount = axis.branches.reduce((sum, b) => sum + (b.wordCount || 0), 0);

              // Rebuild chapter content
              let assembled = '';
              for (const ax of chapter.axes) {
                const writtenBranches = ax.branches.filter(b => b.content && b.content.trim().length > 0);
                if (writtenBranches.length > 0) {
                  assembled += `## ${ax.code}: ${ax.title}\n\n`;
                  for (const b of writtenBranches) {
                    const bText = b.content.trim();
                    if (!bText.startsWith('###')) {
                      assembled += `### ${b.code} ${b.title}\n\n${bText}\n\n`;
                    } else {
                      assembled += `${bText}\n\n`;
                    }
                  }
                }
              }
              chapter.content = assembled.trim();
              chapter.wordCount = countKurdishWords(chapter.content);

              // Immutably clone and update chapters state live across signals
              const liveClone = chapters.map(c => {
                if (c.id === chapter.id) {
                  return {
                    ...c,
                    content: chapter.content,
                    wordCount: chapter.wordCount,
                    axes: chapter.axes.map(ax => ({
                      ...ax,
                      wordCount: ax.branches.reduce((sum, b) => sum + (b.wordCount || 0), 0),
                      branches: ax.branches.map(br => ({ ...br }))
                    }))
                  };
                }
                return c;
              });

              this.editorService.setChapters(liveClone);
              if (options.chaptersSignal) {
                options.chaptersSignal.set(liveClone);
              }
              if (statusStep) {
                this.currentWritingStatus.set(statusStep);
              }
            };

            // 1. Send dedicated structured request to server-side Gemini stream-subsection engine
            let subWriterResult: any = null;
            let lastBranchError: string | null = null;

            try {
              const streamResp = await fetch(this.geminiApiUrl('/api/gemini/stream-subsection'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  thesisTitle: title,
                  level: normLevel,
                  discipline,
                  chapterTitle: chapter.title,
                  sectionTitle: `${axis.code}: ${axis.title}`,
                  subSection: {
                    code: branch.code,
                    title: branch.title,
                    targetWords: targetWords,
                    microTopicsToCover: [branch.title],
                    transitionFromPreviousGoal: lastSubSectionInfo?.title ? `گرێدان بە ${lastSubSectionInfo.title}` : '',
                    transitionToNextGoal: nextSubSection?.title ? `ڕادەستکردن بە ${nextSubSection.title}` : ''
                  },
                  previousClosingParagraph: lastSubSectionInfo?.lastParagraph || '',
                  academicControls: this.academicControlsMatrix.state(),
                  citationStyle: options.refineFormValue?.citationStyle || options.refineFormValue?.academicStyle || 'chicago'
                })
              });

              if (!streamResp.ok) {
                const responseText = await streamResp.text();
                try {
                  const payload = JSON.parse(responseText) as { error?: string; code?: string };
                  lastBranchError = payload.error || payload.code || `داواکاریی نووسین بە کۆدی ${streamResp.status} ڕەتکرایەوە.`;
                } catch {
                  lastBranchError = responseText.slice(0, 240) || `داواکاریی نووسین بە کۆدی ${streamResp.status} ڕەتکرایەوە.`;
                }
              } else if (!streamResp.body) {
                lastBranchError = 'سێرڤەری نووسین پەخشی دەق نەکرد.';
              } else {
                const reader = streamResp.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let sseBuf = '';
                const processSseFrame = (frame: string): void => {
                  const data = frame.split(/\r?\n/)
                    .filter(line => line.startsWith('data:'))
                    .map(line => line.replace(/^data:\s?/, ''))
                    .join('\n')
                    .trim();
                  if (!data || data === '[DONE]') return;

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.status === 'chunk') {
                      applyBranchProgress(parsed.markdown, parsed.wordCount, parsed.step);
                    } else if (parsed.status === 'completed') {
                      const completedText = typeof parsed.text === 'string'
                        ? parsed.text
                        : typeof parsed.content === 'string'
                        ? parsed.content
                        : typeof parsed.delta === 'string'
                        ? parsed.delta
                        : parsed.result?.fullSubSectionMarkdown || '';
                      if (typeof completedText === 'string' && completedText.trim()) {
                        subWriterResult = {
                          academicContentMarkdown: completedText.trim(),
                          closingParagraph: parsed.result?.lastParagraph || '',
                          executiveSummaryForNext: (parsed.result?.keyFindings || []).join(' | '),
                          suggestedCitations: []
                        };
                        if (parsed.bibliography) lastServerBibliography = parsed.bibliography;
                      }
                    } else if (parsed.error) {
                      lastBranchError = parsed.error;
                    }
                  } catch (parseError) {
                    lastBranchError = parseError instanceof Error
                      ? `وەڵامی پەخشی سێرڤەر نەخوێندرایەوە: ${parseError.message}`
                      : 'وەڵامی پەخشی سێرڤەر نەخوێندرایەوە.';
                  }
                };

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  sseBuf += decoder.decode(value, { stream: true });
                  const frames = sseBuf.split(/\r?\n\r?\n/);
                  sseBuf = frames.pop() || '';
                  for (const frame of frames) processSseFrame(frame);
                }
                sseBuf += decoder.decode();
                if (sseBuf.trim()) processSseFrame(sseBuf);

                if (!subWriterResult?.academicContentMarkdown && !lastBranchError) {
                  lastBranchError = 'پەخشی نووسین بەبێ وەڵامی تەواو کۆتایی هات؛ هەوڵی نووسینی ڕاستەوخۆ دەدرێت.';
                }
              }
            } catch (streamErr: unknown) {
              lastBranchError = streamErr instanceof Error ? streamErr.message : 'پەیوەندی بە سێرڤەری نووسین سەرکەوتوو نەبوو.';
            }

            // Retry through the non-streaming endpoint whenever the stream lacks a completed text result.
            if (!subWriterResult?.academicContentMarkdown) {
              try {
                const apiRes = await firstValueFrom(
                  this.http.post<{ success: boolean; result: any; bibliography?: string }>(
                    this.geminiApiUrl('/api/gemini/write-subsection'),
                    {
                    thesisTitle: title,
                    level: normLevel,
                    discipline,
                    chapterTitle: chapter.title,
                    sectionTitle: `${axis.code}: ${axis.title}`,
                    subSection: {
                      code: branch.code,
                      title: branch.title,
                      targetWords: targetWords,
                      microTopicsToCover: [branch.title],
                      transitionFromPreviousGoal: lastSubSectionInfo?.title ? `گرێدان بە ${lastSubSectionInfo.title}` : '',
                      transitionToNextGoal: nextSubSection?.title ? `ڕادەستکردن بە ${nextSubSection.title}` : ''
                    },
                    previousClosingParagraph: lastSubSectionInfo?.lastParagraph || '',
                    academicControls: this.academicControlsMatrix.state(),
                    citationStyle: options.refineFormValue?.citationStyle || options.refineFormValue?.academicStyle || 'chicago'
                    }
                  )
                );
                if (apiRes?.success && apiRes.result?.fullSubSectionMarkdown?.trim()) {
                  subWriterResult = {
                    academicContentMarkdown: apiRes.result.fullSubSectionMarkdown.trim(),
                    closingParagraph: apiRes.result.lastParagraph || '',
                    executiveSummaryForNext: (apiRes.result.keyFindings || []).join(' | '),
                    suggestedCitations: []
                  };
                  if (apiRes.bibliography) {
                    lastServerBibliography = apiRes.bibliography;
                  }
                }
              } catch (apiErr: any) {
                const serverMessage = apiErr?.error?.error;
                lastBranchError = typeof serverMessage === 'string'
                  ? serverMessage
                  : apiErr?.message || String(apiErr);
              }
            }

            let branchContent = (subWriterResult?.academicContentMarkdown || '').trim();
            let words = countKurdishWords(branchContent);

            // STOP immediately if generation yielded 0 words! Do not continue looping silently.
            if (!branchContent || words === 0) {
              const errMsg = lastBranchError || `نووسینی لقی «${branch.title}» ناوەڕۆکی بەرهەم نەهێنا.`;
              this.notifications.showError('هەڵە لە نووسیندا', errMsg);
              this.liveProgress.failTask(`نووسینی لقەکە ڕاوەستا: ${errMsg}`);
              this.currentWritingStatus.set(`هەڵە لە لقی ${branch.code}: ${errMsg}`);
              branch.status = 'pending';
              this.isBranchWritingInProgress.set(false);
              return;
            }

            this.currentBranchWords.set(words);
            this.branchProgressPercent.set(Math.min(100, Math.round((words / targetWords) * 100)));

            // 2. Deep Analytical Expansion Loop if words < 90% of quota
            let expansionAttempts = 0;
            const maxExpansions = 3;

            while (words < targetWords * 0.90 && expansionAttempts < maxExpansions) {
              expansionAttempts++;
              branch.status = 'expanding';
              const deficit = targetWords - words;

              const expansionStatus = `درێژەپێدانی قووڵی زانستی: ${chName} / ${axis.code} / لقی ${branch.code} — ${words} لە ${targetWords} وشە...`;
              this.currentWritingStatus.set(expansionStatus);

              try {
                const expPrompt = this.buildExpansionPrompt(branch, targetWords, words, deficit, branchContent);
                const extraText = await this.requestManager.callGeminiApi(expPrompt, SYSTEM_PROMPT_GENERATE_CHAPTER);

                if (extraText && extraText.trim()) {
                  branchContent += '\n\n' + extraText.trim();
                  words = countKurdishWords(branchContent);
                  this.currentBranchWords.set(words);
                  this.branchProgressPercent.set(Math.min(100, Math.round((words / targetWords) * 100)));
                } else {
                  break;
                }
              } catch {
                break;
              }
            }

            // 3. Update cognitive bridge state for the next branch
            const lastPara = subWriterResult.closingParagraph?.trim() || branchContent.split('\n\n').pop() || '';
            lastSubSectionInfo = {
              code: branch.code,
              title: branch.title,
              executiveSummary: subWriterResult.executiveSummaryForNext,
              lastParagraph: lastPara
            };

            // Process and register citations in the Master Bibliography
            if (subWriterResult.suggestedCitations && subWriterResult.suggestedCitations.length > 0) {
              const parsedSources = subWriterResult.suggestedCitations.map((c: string, i: number) =>
                this.citationManager.parseCitationStringToAcademicSource(c, i)
              );
              const citationResult = this.citationManager.processTextAndRegisterSources(
                branchContent,
                branch.code,
                parsedSources,
                'numbered_footnotes'
              );
              branchContent = citationResult.processedMarkdown;
              words = countKurdishWords(branchContent);
            }

            // 4. Update branch data
            branch.content = branchContent;
            branch.wordCount = words;
            branch.status = 'completed';
            branch.expansionRounds = expansionAttempts;
            branch.executiveSummary = subWriterResult.executiveSummaryForNext;
            branch.closingParagraph = subWriterResult.closingParagraph;
            branch.suggestedCitations = subWriterResult.suggestedCitations;
            branch.keyConceptsCovered = subWriterResult.keyConceptsCovered;

            // Recalculate parent axis word count
            axis.wordCount = axis.branches.reduce((sum, b) => sum + (b.wordCount || 0), 0);

            // Reconstruct chapter content cleanly from all non-empty branches
            let assembled = '';
            for (const ax of chapter.axes) {
              const writtenBranches = ax.branches.filter(b => b.content && b.content.trim().length > 0);
              if (writtenBranches.length > 0) {
                assembled += `## ${ax.code}: ${ax.title}\n\n`;
                for (const b of writtenBranches) {
                  const bText = b.content.trim();
                  const bHeading = `### ${b.code} ${b.title}`;
                  if (!bText.startsWith('###')) {
                    assembled += `${bHeading}\n\n${bText}\n\n`;
                  } else {
                    assembled += `${bText}\n\n`;
                  }
                }
              }
            }

            chapter.content = assembled.trim();
            chapter.wordCount = countKurdishWords(chapter.content);

            // Immutably clone and update chapters state across signals immediately
            const updatedChapters = chapters.map(c => {
              if (c.id === chapter.id) {
                return {
                  ...c,
                  content: chapter.content,
                  wordCount: chapter.wordCount,
                  axes: chapter.axes.map(ax => ({
                    ...ax,
                    wordCount: ax.branches.reduce((sum, b) => sum + (b.wordCount || 0), 0),
                    branches: ax.branches.map(br => ({ ...br }))
                  }))
                };
              }
              return c;
            });

            syncLiveTOCWordCounts(updatedChapters);
            this.editorService.setChapters(updatedChapters);
            if (options.chaptersSignal) {
              options.chaptersSignal.set(updatedChapters);
            }

            this.editorService.updateChapterContent(
              chapter.id,
              chapter.content,
              `نووسینی لقی ${branch.code} بە ستانداردی ئەکادیمی`
            );

            branchesCompleted++;
            const finishedPct = Math.round((branchesCompleted / totalBranches) * 100);
            this.liveProgress.updateProgress(finishedPct);

            options.onUpdate?.();
            this.currentWritingStatus.set(`تەواوبوو: ${chName} / ${axis.code} / لقی ${branch.code} (${words} وشە)`);

            // Add a 1500ms pacing delay between branches in writeAllChapters to prevent 429 rate limits
            if (!options.targetBranchId && branchesCompleted < totalBranches) {
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }

        chapter.status = 'completed';
      }

      // Automatically update the References / Bibliography chapter if present
      const refChapter = chapters.find(
        (c) => c.title.includes('سەرچاوە') || c.title.toLowerCase().includes('references') || c.title.includes('بیبلۆگرافیا')
      );
      if (refChapter) {
        const bibMarkdown = lastServerBibliography || this.citationManager.generateFinalBibliographyMarkdown();
        if (bibMarkdown && bibMarkdown.trim()) {
          refChapter.content = bibMarkdown;
          refChapter.wordCount = countKurdishWords(bibMarkdown);
          refChapter.status = 'completed';
          this.editorService.updateChapterContent(
            refChapter.id,
            bibMarkdown,
            'نوێکردنەوەی خودکاری لیستی سەرچاوە و بیبلۆگرافیا بەپێی زمانەکان'
          );
        }
      }

      // Verify that words were actually generated before showing green success toast
      let totalWrittenWords = 0;
      for (const ch of targetChapters) {
        for (const ax of ch.axes || []) {
          for (const br of ax.branches || []) {
            totalWrittenWords += (br.wordCount || 0);
          }
        }
      }

      if (totalWrittenWords > 0) {
        this.currentWritingStatus.set(`سەرجەم لقەکان بە سەرکەوتوویی تەواو کران (${totalWrittenWords} وشە).`);
        this.liveProgress.finishTask(`نووسینی لقە ئەکادیمییەکان بە تەواوی بە ئەنجام گەیشت (${totalWrittenWords} وشە).`);
        this.notifications.showSuccess('سەرکەوتوو بوو', `نووسینی لقە ئەکادیمییەکان بە سەرکەوتوویی تەواو بوو (${totalWrittenWords} وشە).`);
      } else {
        this.liveProgress.failTask('پڕۆسەی نووسین بەبێ بەرهەمهێنانی وشە کۆتایی هات.');
        this.notifications.showError('هەڵە', 'دەق بەرهەم نەهات. تکایە کلیل و پەیوەندیی سێرڤەر بپشکنە.');
      }
    } catch (error: any) {
      console.error('Error during branch writing:', error);
      const errMsg = error?.message || 'پڕۆسەی نووسینی لقەکان ڕاوەستا.';
      this.notifications.showError('هەڵە لە نووسیندا', errMsg);
      this.liveProgress.failTask(errMsg);
    } finally {
      this.isBranchWritingInProgress.set(false);
      this.activeSubBranchId.set(null);
      setTimeout(() => this.currentWritingStatus.set(''), 5000);
    }
  }

  private buildSubBranchPrompt(
    thesisTitle: string,
    level: string,
    discipline: string,
    chapter: ChapterItem,
    axis: AxisItem,
    branch: SubBranchItem,
    targetWords: number,
    refineFormValue?: any
  ): string {
    let customRules = '';
    if (refineFormValue) {
      if (refineFormValue.methodology) {
        customRules += `\n- میتۆدۆلۆژیای پەسەندکراو: ${refineFormValue.methodology}`;
      }
      if (refineFormValue.customInstructions?.trim()) {
        customRules += `\n- ڕێنمایی تایبەتی نووسەر: ${refineFormValue.customInstructions.trim()}`;
      }
      if (refineFormValue.customSourcesText?.trim()) {
        customRules += `\n- سەرچاوە زۆرەملێکانی دەستنیشانکراو: ${refineFormValue.customSourcesText.trim()}`;
      }
      if (refineFormValue.fieldWorkText?.trim()) {
        customRules += `\n- داتاکانی کاری مەیدانی بۆ شیتاڵکردن: ${refineFormValue.fieldWorkText.trim()}`;
      }
      if (refineFormValue.compareAspect?.trim()) {
        customRules += `\n- ڕووی بەراوردکاری: ${refineFormValue.compareAspect.trim()}`;
      }
      if (refineFormValue.copyStyleText?.trim()) {
        customRules += `\n- شێوازی داڕشتنی دەنگ: ${refineFormValue.copyStyleText.slice(0, 500).trim()}`;
      }
    }

    return `[سیستەمی نووسینی دکتۆرا و ماستەر بەپێی ستانداردی ئەکادیمی - بەرهەمهێنانی ڕاستەوخۆی لق]:
ناونیشانی گشتیی تێز: «${thesisTitle}»
کایەی زانستی: ${discipline}
ئاستی لێکۆڵینەوە: ${level}
بەشی سەرەکی: «${chapter.title}»
تەوەری زانستی: «${axis.code}: ${axis.title}»
لقی داواکراو بۆ نووسین: «${branch.code}: ${branch.title}»
ئامانجی وشە بۆ ئەم لقە: لانیکەم ${targetWords} وشەی ئەکادیمیی سۆرانی بەبێ کورتکردنەوە.
${customRules ? `مەرج و ڕێنماییە دەستنیشانکراوەکانی بەکارهێنەر:${customRules}\n` : ''}
یاسا و مەرجە نەگۆڕەکانی ئەم لقە:
١. تەنها و تەنها دەقی ناوەڕۆکی لقی «${branch.code}: ${branch.title}» بنووسە بە پەڕەگرافی چڕ و ڕەخنەگرانە.
٢. دەستپێکی ڕاستەوخۆی مەعریفی (Epistemological Framing) بەبێ هیچ پێشەکییەکی ڕۆژنامەوانی یان ئینشائی (وەک «یەکێکە لە گرنگترین بابەتەکان» یان «لە جیهانی ئەمڕۆدا»).
٣. یاسای پۆڵایینی دژە-کورتکردنەوە (STRICT ANTI-SHORTCUT):
   بە توندی قەدەغەیە بەکاربێنیت: «بە کورتی»، «لە کۆتاییدا»، «وەکو لە سەرەوە باسمان کرد»، «لێرەدا تیشکمان خستە سەر»، «بە کورتییەکەی»، «کۆتایی بەم تەوەرە دەهێنین».
٤. ئەرگیومێنتسازی بە پایەکانی مۆدێلی تولمین (Claim, Evidence, Warrant, Rebuttal, Synthesis)، پشتبەستن بە شیکاریی بەراوردکاری، و دیالۆگی فرەدەنگی لەنێوان سەرچاوەکان.
٥. پێویستە دەقەکە لە سەرەتاوە تا کۆتایی بە پەڕەگرافی چڕ و شیکاریی زانستی پەرەی پێبدرێت تا سەدی سەدی کوۆتای ${targetWords} وشە بەدی دێت.

${DOCTORAL_ACADEMIC_DIRECTIVES}

ڕاستەوخۆ دەست بە دەقی لقەکە بکە:`;
  }

  private buildExpansionPrompt(
    branch: SubBranchItem,
    targetWords: number,
    currentWords: number,
    deficitWords: number,
    previousText: string
  ): string {
    return `[بانگەوازی درێژەپێدانی قووڵی زانستی بۆ تەواوکردنی قەبارەی لق]:
دەقی پێشووی لقی «${branch.code}: ${branch.title}» تا ئێستا گەیشتووەتە ${currentWords} وشە، بەڵام کوۆتای پێویست بریتییە لە لانیکەم ${targetWords} وشە (${deficitWords} وشەی ماوە بۆ تەواوکردنی ١٠٠٪).

تکایە دەستبەجێ بە پەڕەگرافی قووڵ، چڕ و سەربەخۆ بەردەوامی بە شیکاریی ئەم لقە بدە:
- خستنەڕووی نموونەی بەڵگەیی نوێ و شیتاڵی ڕەخنەیی دەقەکان.
- تاوتوێکردنی بۆچوونی زانایانی دیکە و بەراوردکاریی فرەدەنگ.
- سەنتێزی مەعریفی و لێکەوتە تیۆری و پراکتیکییەکان.
- بێ بەکارهێنانی هیچ دەستەواژەیەکی کۆتاییهێنان یان کورتکردنەوە (وەک «بە کورتی»، «لە کۆتاییدا»).

پاشخانی چەند دێڕی کۆتایی دەقی پێشوو:
${previousText.slice(-500)}

تکایە دەستبەجێ دەقی درێژکراوەی نوێ بنووسە:`;
  }
}
