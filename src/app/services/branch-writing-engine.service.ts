import { Injectable, inject, signal } from '@angular/core';
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

export interface BranchWritingOptions {
  manuscriptTitle?: string;
  academicLevel?: string;
  discipline?: string;
  targetChapterId?: number;
  refineFormValue?: any;
  onUpdate?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class BranchWritingEngineService {
  private notifications = inject(AppNotificationsService);
  private editorService = inject(EditorService);
  private requestManager = inject(GeminiRequestManagerService);
  private subSectionWriter = inject(SubSectionWriterService);
  public citationManager = inject(AcademicCitationManager);

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
      // Memory state for cognitive bridging between successive sub-sections
      let lastSubSectionInfo: {
        code: string;
        title: string;
        executiveSummary: string;
        lastParagraph: string;
      } | undefined = undefined;

      for (let chIdx = 0; chIdx < targetChapters.length; chIdx++) {
        const chapter = targetChapters[chIdx];
        if (!chapter.axes || chapter.axes.length === 0) continue;

        chapter.status = 'writing';
        const chName = chapter.title.split(':')[0] || `بەشی ${chIdx + 1}`;
        let chContent = (chapter.content || '').trim();

        for (let aIdx = 0; aIdx < chapter.axes.length; aIdx++) {
          const axis = chapter.axes[aIdx];

          // Check if Axis header already exists in content
          const axisHeader = `## ${axis.code}: ${axis.title}`;
          if (!chContent.includes(axisHeader) && !chContent.includes(axis.code)) {
            chContent += (chContent ? '\n\n' : '') + `${axisHeader}\n`;
          }

          for (let bIdx = 0; bIdx < axis.branches.length; bIdx++) {
            const branch = axis.branches[bIdx];
            const targetWords = Math.max(350, branch.targetWords || 600);

            this.activeSubBranchId.set(branch.id);
            this.targetBranchWords.set(targetWords);
            this.currentBranchWords.set(0);
            this.branchProgressPercent.set(0);
            branch.status = 'writing';

            const statusText = `خەریکی نووسینی ${chName} / ${axis.code} / لقی ${branch.code} — ٠ لە ${targetWords} وشە...`;
            this.currentWritingStatus.set(statusText);

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

            // 1. Send dedicated structured request with cognitive bridging
            const subWriterResult = await this.subSectionWriter.writeAcademicSubSection({
              thesisTitle: title,
              degreeLevel: level === 'دکتۆرا' ? 'دکتۆرا' : 'ماستەر',
              methodologySummary: options.refineFormValue?.methodology || discipline,
              chapterTitle: chapter.title,
              sectionTitle: `${axis.code}: ${axis.title}`,
              currentSubSection: {
                code: branch.code,
                title: branch.title,
                targetWords: targetWords
              },
              previousSubSection: lastSubSectionInfo,
              nextSubSection: nextSubSection,
              customInstructions: options.refineFormValue?.customInstructions
            });

            let branchContent = (subWriterResult.academicContentMarkdown || '').trim();
            let words = countKurdishWords(branchContent);
            this.currentBranchWords.set(words);
            this.branchProgressPercent.set(Math.min(100, Math.round((words / targetWords) * 100)));

            // 2. Deep Analytical Expansion Loop if words < 95% of quota
            let expansionAttempts = 0;
            const maxExpansions = 3;

            while (words < targetWords * 0.95 && expansionAttempts < maxExpansions) {
              expansionAttempts++;
              branch.status = 'expanding';
              const deficit = targetWords - words;

              const expansionStatus = `درێژەپێدانی قووڵی زانستی: ${chName} / ${axis.code} / لقی ${branch.code} — ${words} لە ${targetWords} وشە...`;
              this.currentWritingStatus.set(expansionStatus);

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

            // 4. Complete branch and stream/append into chapter
            branch.content = branchContent;
            branch.wordCount = words;
            branch.status = 'completed';
            branch.expansionRounds = expansionAttempts;
            branch.executiveSummary = subWriterResult.executiveSummaryForNext;
            branch.closingParagraph = subWriterResult.closingParagraph;
            branch.suggestedCitations = subWriterResult.suggestedCitations;
            branch.keyConceptsCovered = subWriterResult.keyConceptsCovered;

            const branchHeading = `### ${branch.code} ${branch.title}`;
            const branchBlock = `${branchHeading}\n\n${branchContent}`;

            if (chContent.includes(branchHeading)) {
              // Replace existing branch section
              const escapedHeading = branchHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const replaceRegex = new RegExp(`${escapedHeading}[\\s\\S]*?(?=(?:###|##|$))`);
              chContent = chContent.replace(replaceRegex, `${branchBlock}\n\n`);
            } else {
              chContent += (chContent ? '\n\n' : '') + `${branchBlock}\n`;
            }

            chapter.content = chContent.trim();
            chapter.wordCount = countKurdishWords(chapter.content);
            syncLiveTOCWordCounts(chapters);

            this.editorService.updateChapterContent(
              chapter.id,
              chapter.content,
              `نووسینی لقی ${branch.code} بە ستانداردی ئەکادیمی`
            );

            options.onUpdate?.();
            this.currentWritingStatus.set(`تەواوبوو: ${chName} / ${axis.code} / لقی ${branch.code} (${words} وشە)`);
          }
        }

        chapter.status = 'completed';
        this.notifications.showSuccess(
          'تەواوبوونی بەش',
          `تەواوی تەوەر و لقەکانی «${chapter.title}» بە سەرکەوتوویی نووسران (${chapter.wordCount} وشە).`
        );
      }

      // Automatically update the References / Bibliography chapter if present
      const refChapter = chapters.find(
        (c) => c.title.includes('سەرچاوە') || c.title.toLowerCase().includes('references')
      );
      if (refChapter && this.citationManager.getAllSources().length > 0) {
        const bibMarkdown = this.citationManager.generateFinalBibliographyMarkdown();
        refChapter.content = bibMarkdown;
        refChapter.wordCount = countKurdishWords(bibMarkdown);
        refChapter.status = 'completed';
        this.editorService.updateChapterContent(
          refChapter.id,
          bibMarkdown,
          'نوێکردنەوەی خودکاری لیستی سەرچاوە و بیبلۆگرافیا بەپێی زمانەکان'
        );
      }

      this.currentWritingStatus.set('سەرجەم لقەکان بە سەرکەوتوویی تەواو کران.');
      this.notifications.showSuccess('تەواوبوونی نووسینی لقەکان', 'نووسینی لق بە لق بە تەواوی ئامانجی وشەکان بە ئەنجام گەیشت.');
    } catch (error) {
      console.error('Error during branch writing:', error);
      this.notifications.showError('هەڵە لە نووسینی لقەکان', 'پڕۆسەی نووسینی لقەکان ڕاوەستا.');
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
