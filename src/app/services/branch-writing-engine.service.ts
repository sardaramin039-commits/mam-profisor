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

  public isBranchWritingInProgress = signal<boolean>(false);
  public currentWritingStatus = signal<string>('');
  public activeSubBranchId = signal<string | null>(null);
  public currentBranchWords = signal<number>(0);
  public targetBranchWords = signal<number>(0);
  public branchProgressPercent = signal<number>(0);

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

      const normLevel: AcademicLevel = (level.includes('دکتۆرا') || level.toLowerCase().includes('phd'))
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
              const streamResp = await fetch('/api/gemini/stream-subsection', {
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
                  previousClosingParagraph: lastSubSectionInfo?.lastParagraph || ''
                })
              });

              if (streamResp.ok && streamResp.body) {
                const reader = streamResp.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let sseBuf = '';

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  sseBuf += decoder.decode(value, { stream: true });
                  const lines = sseBuf.split('\n');
                  sseBuf = lines.pop() || '';

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const dataStr = trimmed.replace(/^data:\s*/, '');
                    if (dataStr === '[DONE]') break;

                    try {
                      const parsed = JSON.parse(dataStr);
                      if (parsed.status === 'chunk') {
                        applyBranchProgress(parsed.markdown, parsed.wordCount, parsed.step);
                      } else if (parsed.status === 'completed' && parsed.result) {
                        subWriterResult = {
                          academicContentMarkdown: (parsed.result.fullSubSectionMarkdown || '').trim(),
                          closingParagraph: parsed.result.lastParagraph || '',
                          executiveSummaryForNext: (parsed.result.keyFindings || []).join(' | '),
                          suggestedCitations: []
                        };
                        if (parsed.bibliography) {
                          lastServerBibliography = parsed.bibliography;
                        }
                      } else if (parsed.error) {
                        lastBranchError = parsed.error;
                      }
                    } catch {}
                  }
                }
              }
            } catch (streamErr: any) {
              lastBranchError = streamErr?.message || String(streamErr);
              console.warn('stream-subsection notice, falling back to write-subsection:', streamErr);
            }

            // Fallback to unary server API if streaming didn't produce full content
            if (!subWriterResult?.academicContentMarkdown) {
              try {
                const apiRes = await firstValueFrom(
                  this.http.post<{ success: boolean; result: any; bibliography?: string }>('/api/gemini/write-subsection', {
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
                    previousClosingParagraph: lastSubSectionInfo?.lastParagraph || ''
                  })
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
                lastBranchError = apiErr?.message || String(apiErr);
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
