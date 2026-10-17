import { Injectable, inject, signal } from '@angular/core';
import { AppNotificationsService } from '../core/app.notifications';
import { EditorService } from '../features/editor/services/editor';
import { GeminiRequestManagerService } from './gemini-request-manager.service';
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
  onUpdate?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class BranchWritingEngineService {
  private notifications = inject(AppNotificationsService);
  private editorService = inject(EditorService);
  private requestManager = inject(GeminiRequestManagerService);

  public isBranchWritingInProgress = signal<boolean>(false);
  public currentWritingStatus = signal<string>('');
  public activeSubBranchId = signal<string | null>(null);
  public currentBranchWords = signal<number>(0);
  public targetBranchWords = signal<number>(0);
  public branchProgressPercent = signal<number>(0);

  /**
   * Unabbreviated branch-by-branch writing loop.
   * Strictly iterates through Chapter -> Axis -> SubBranch (لق بە لق)
   * Enforces exact word quota with automatic deep expansion calls.
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

            // 1. Send dedicated request for this exact sub-branch
            const prompt = this.buildSubBranchPrompt(title, level, discipline, chapter, axis, branch, targetWords);
            let branchContent = await this.requestManager.callGeminiApi(prompt, SYSTEM_PROMPT_GENERATE_CHAPTER);
            branchContent = (branchContent || '').trim();

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

            // 3. Complete branch and stream/append into chapter
            branch.content = branchContent;
            branch.wordCount = words;
            branch.status = 'completed';
            branch.expansionRounds = expansionAttempts;

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
    targetWords: number
  ): string {
    return `[سیستەمی نووسینی دکتۆرا و ماستەر بەپێی ستانداردی ئەکادیمی - بەرهەمهێنانی ڕاستەوخۆی لق]:
ناونیشانی گشتیی تێز: «${thesisTitle}»
کایەی زانستی: ${discipline}
ئاستی لێکۆڵینەوە: ${level}
بەشی سەرەکی: «${chapter.title}»
تەوەری زانستی: «${axis.code}: ${axis.title}»
لقی داواکراو بۆ نووسین: «${branch.code}: ${branch.title}»
ئامانجی وشە بۆ ئەم لقە: لانیکەم ${targetWords} وشەی ئەکادیمیی سۆرانی بەبێ کورتکردنەوە.

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
