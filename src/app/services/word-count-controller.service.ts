import { Injectable, signal, computed, inject } from '@angular/core';
import { KurdishWordCounter, WordCountOptions } from '../helpers/kurdish-word-counter';
import { EditorService } from '../features/editor/services/editor';
import { GeminiRequestManagerService } from './gemini-request-manager.service';
import { SYSTEM_PROMPT_GENERATE_CHAPTER } from '../../prompts/system-prompts';

export type WordCountStatusKind = 'EXACT' | 'UNDER' | 'OVER' | 'EMPTY';

export interface ChapterWordCountAudit {
  chapterId: number;
  chapterTitle: string;
  targetWords: number;
  currentWords: number;
  bodyWords: number;
  bibliographyWords: number;
  remainingWords: number;
  percentage: number;
  status: WordCountStatusKind;
  statusLabel: string;
  badgeClass: string;
}

export interface FullManuscriptWordAudit {
  targetWords: number;
  currentWords: number;
  remainingWords: number;
  percentage: number;
  status: WordCountStatusKind;
  statusLabel: string;
  chapterAudits: ChapterWordCountAudit[];
  isCompliant: boolean;
}

const STORAGE_TARGET_KEY = 'MAM_MANUSCRIPT_TARGET_WORDS';
const STORAGE_SECTION_TARGETS_KEY = 'MAM_SECTION_TARGET_WORDS';

@Injectable({
  providedIn: 'root'
})
export class WordCountControllerService {
  public editorService: EditorService;
  public requestManager?: GeminiRequestManagerService;

  // Targets
  public readonly manuscriptTargetWords = signal<number>(this.loadStoredTarget(12000));
  public readonly sectionTargets = signal<Record<number, number>>(this.loadStoredSectionTargets());

  // Counting preferences
  public readonly excludeBibliography = signal<boolean>(true);
  public readonly excludeTitles = signal<boolean>(true);

  constructor() {
    try {
      this.editorService = inject(EditorService, { optional: true }) || new EditorService();
      this.requestManager = inject(GeminiRequestManagerService, { optional: true }) || undefined;
    } catch {
      this.editorService = new EditorService();
    }
  }

  // Status computation for individual chapters and overall manuscript
  public readonly manuscriptAudit = computed<FullManuscriptWordAudit>(() => {
    const chapters = this.editorService.chapters();
    const globalTarget = this.manuscriptTargetWords();
    const customTargets = this.sectionTargets();
    const countOptions: WordCountOptions = {
      excludeBibliography: this.excludeBibliography(),
      excludeTitles: this.excludeTitles()
    };

    let totalWords = 0;
    const chapterAudits: ChapterWordCountAudit[] = [];

    // Distribute default target if not set
    const defaultPerChapter = chapters.length > 0 ? Math.round(globalTarget / chapters.length) : 2000;

    for (const ch of chapters) {
      const target = customTargets[ch.id] || ch.customTargetWords || defaultPerChapter;
      const breakdown = KurdishWordCounter.analyze(ch.content || '');
      const countedWords = KurdishWordCounter.countWords(ch.content || '', countOptions);

      totalWords += countedWords;
      const remaining = target - countedWords;
      const pct = target > 0 ? Math.round((countedWords / target) * 100) : 0;

      let status: WordCountStatusKind = 'EXACT';
      let statusLabel = 'تەواو لە ئامانجدایە (تەواو)';
      let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

      if (countedWords === 0) {
        status = 'EMPTY';
        statusLabel = 'دەق نەنووسراوە (سفر وشە)';
        badgeClass = 'bg-slate-700/40 text-slate-400 border-slate-600/40';
      } else if (pct < 95) {
        status = 'UNDER';
        statusLabel = `کەمترە لە ئامانج (${Math.abs(remaining)} وشە ماوە)`;
        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      } else if (pct > 105) {
        status = 'OVER';
        statusLabel = `زیاترە لە ئامانج (+${countedWords - target} وشە)`;
        badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      }

      chapterAudits.push({
        chapterId: ch.id,
        chapterTitle: ch.title,
        targetWords: target,
        currentWords: countedWords,
        bodyWords: breakdown.bodyWords,
        bibliographyWords: breakdown.bibliographyWords,
        remainingWords: remaining,
        percentage: pct,
        status,
        statusLabel,
        badgeClass
      });
    }

    const totalRemaining = globalTarget - totalWords;
    const overallPct = globalTarget > 0 ? Math.round((totalWords / globalTarget) * 100) : 0;

    let overallStatus: WordCountStatusKind = 'EXACT';
    let overallLabel = `دەستنووس لە ئامانجدایە (${totalWords} وشە)`;

    if (totalWords === 0) {
      overallStatus = 'EMPTY';
      overallLabel = 'دەستنووس بەتاڵە';
    } else if (overallPct < 90) {
      overallStatus = 'UNDER';
      overallLabel = `کەمتر لە ئامانجی گشتی (${totalRemaining} وشە ماوە)`;
    } else if (overallPct > 110) {
      overallStatus = 'OVER';
      overallLabel = `زیاتر لە ئامانجی گشتی (+${totalWords - globalTarget} وشە)`;
    }

    // Must be at least 85% of total target and no chapters empty to be export compliant
    const isCompliant = totalWords > 0 && overallPct >= 85 && overallPct <= 120 && !chapterAudits.some(c => c.status === 'EMPTY');

    return {
      targetWords: globalTarget,
      currentWords: totalWords,
      remainingWords: totalRemaining,
      percentage: overallPct,
      status: overallStatus,
      statusLabel: overallLabel,
      chapterAudits,
      isCompliant
    };
  });

  private loadStoredTarget(fallback: number): number {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(STORAGE_TARGET_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return fallback;
  }

  private loadStoredSectionTargets(): Record<number, number> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_SECTION_TARGETS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  }

  public setManuscriptTarget(target: number): void {
    if (target <= 0) return;
    this.manuscriptTargetWords.set(target);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_TARGET_KEY, String(target));
      } catch {}
    }
  }

  public setSectionTarget(chapterId: number, target: number): void {
    this.sectionTargets.update(prev => {
      const next = { ...prev, [chapterId]: target };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_SECTION_TARGETS_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }

  /**
   * Generates / Revises chapter text strictly to reach the exact requested word count
   * Without padding by repetition!
   */
  public async adjustChapterToExactWordCount(chapterId: number, onProgress?: (msg: string) => void): Promise<{ success: boolean; newCount: number; message: string }> {
    const chapter = this.editorService.chapters().find(c => c.id === chapterId);
    if (!chapter) {
      return { success: false, newCount: 0, message: 'بەشی داواکراو نەدۆزرایەوە.' };
    }

    const customTarget = this.sectionTargets()[chapterId];
    const targetWords = customTarget || chapter.customTargetWords || Math.round(this.manuscriptTargetWords() / Math.max(1, this.editorService.chapters().length));
    const countOptions = { excludeBibliography: this.excludeBibliography(), excludeTitles: this.excludeTitles() };

    let currentContent = chapter.content || '';
    let currentWords = KurdishWordCounter.countWords(currentContent, countOptions);

    if (Math.abs(currentWords - targetWords) <= 20) {
      return {
        success: true,
        newCount: currentWords,
        message: `بەشەکە لە بنەڕەتدا لە سنووری تەواوی ئامانجدایە (${currentWords} وشە بەرامبەر ${targetWords}).`
      };
    }

    if (!this.requestManager) {
      return {
        success: false,
        newCount: currentWords,
        message: 'سێرڤیسی ژیریی دەستکرد بەردەست نییە.'
      };
    }

    onProgress?.(`دەستپێکردنی ڕێکخستنی وشەکان: ${currentWords} وشەی ئێستا ⬅️ ${targetWords} وشەی ئامانج...`);

    const maxRounds = 3;
    let round = 0;
    const reqMgr = this.requestManager;

    while (round < maxRounds && Math.abs(currentWords - targetWords) > 25) {
      round++;
      const diff = targetWords - currentWords;

      if (diff > 0) {
        // Need expansion: add substantive analytical content without repetition
        onProgress?.(`فراوانکردنی بەڵگەمحوەر (خولی ${round}): پێویستی بە +${diff} وشەیە بێ دووبارەکردنەوە...`);
        const expansionPrompt = `
[کۆنتڕۆڵکەری ژمارەی وشەی ئەکادیمی - چەسپاندنی تەواو]
ناونیشانی بەش: «${chapter.title}»
ژمارەی وشەی ئێستا: ${currentWords}
ژمارەی وشەی ئامانجی فەرمی: ${targetWords}
ژمارەی وشەی پێویست بۆ زیادکردن: ${diff} وشە.

دەقی ئێستای بەشەکە:
${currentContent}

ڕێنمایی زۆر توند:
١. بە تەواوی قەدەغەیە بە دووبارەکردنەوەی دەستەواژەکان، ڕستە هاوشێوەکان یان دەستەواژەی زیادە ژمارەی وشەکان پڕبکرێتەوە (Never pad by repetition).
٢. لقی شیکاریی نوێ، ڕەهەندی بەراوردکاری، لێکدانەوەی تیۆری و شیکاریی چەمکیی پەیوەندیدار بنووسە کە بە تەواوی درێژەی بەشی ئێستا بێت.
٣. دەقێکی ئەکادیمیی نوێ بنووسە کە درێژییەکەی بە تەواوی لە دەوروبەری ${diff} وشەی زمانی کوردیی سۆرانی بێت تا ببەسترێتەوە بە دەقی سەرەکییەوە.
٤. تەنها دەقە نوێیەکە بگەڕێنەوە بێ هیچ پێشەکی یان سڵاو.
`;
        const extraText = await reqMgr.callGeminiApi(expansionPrompt, SYSTEM_PROMPT_GENERATE_CHAPTER);
        if (extraText && extraText.trim()) {
          currentContent = (currentContent ? currentContent.trim() + '\n\n' : '') + extraText.trim();
          currentWords = KurdishWordCounter.countWords(currentContent, countOptions);
        } else {
          break;
        }
      } else {
        // Need tightening / trimming surplus
        const surplus = Math.abs(diff);
        onProgress?.(`پوختەکردنی ورد (خولی ${round}): کەمکردنەوەی ${surplus} وشەی زیادە بە چڕکردنەوەی دەق...`);
        const trimPrompt = `
[کۆنتڕۆڵکەری ژمارەی وشەی ئەکادیمی - چڕکردنەوە و بێژنگکردن]
ناونیشانی بەش: «${chapter.title}»
ژمارەی وشەی ئێستا: ${currentWords}
ژمارەی وشەی ئامانج: ${targetWords} (پێویستە نزیکەی ${surplus} وشەی لێ کەمبکرێتەوە بە شێوەیەکی زانستی).

دەقی بەشەکە:
${currentContent}

ڕێنمایی:
١. هەموو بەڵگەکان و سەرچاوەکان بپارێزە.
٢. دەربڕینە دوورودرێژەکان و پەڕەگرافە دووبارەبووەکان چڕ بکەوە بە زمانی سۆرانیی ئەکادیمیی بێخەوش.
٣. دەقی پوختەکراوی تەواوی بەشەکە بگەڕێنەوە کە بە تەواوی یەکسان بێت بە ${targetWords} وشە.
٤. تەنها دەقە سەرەکییەکە بگەڕێنەوە بێ دەقی زیادە.
`;
        const trimmedText = await reqMgr.callGeminiApi(trimPrompt, SYSTEM_PROMPT_GENERATE_CHAPTER);
        if (trimmedText && trimmedText.trim()) {
          currentContent = trimmedText.trim();
          currentWords = KurdishWordCounter.countWords(currentContent, countOptions);
        } else {
          break;
        }
      }
    }

    // Save final updated content to Editor
    this.editorService.updateChapterContent(chapterId, currentContent, `ڕێکخستنی ژمارەی وشەکان بۆ ${currentWords}`);

    return {
      success: true,
      newCount: currentWords,
      message: `ژمارەی وشەکانی بەشەکە نوێکرایەوە بۆ ${currentWords} وشە (ئامانج: ${targetWords}).`
    };
  }

  /**
   * Pre-export compliance validation
   */
  public validateForExport(chapters: Array<{ title: string; content: string }>): { valid: boolean; errors: string[] } {
    const audit = this.manuscriptAudit();
    const errors: string[] = [];

    if (audit.currentWords === 0) {
      errors.push('تێزەکە هیچ ناوەڕۆکێکی نووسراوی تێدا نییە (سفر وشە).');
    }

    if (audit.percentage < 70) {
      errors.push(`ژمارەی وشەکانی تێز (${audit.currentWords}) زۆر کەمترە لە ئامانجی پێویست (${audit.targetWords} وشە - تەنها ${audit.percentage}٪ تەواوکراوە).`);
    }

    for (const ca of audit.chapterAudits) {
      if (ca.currentWords === 0) {
        errors.push(`بەشی «${ca.chapterTitle}» بە تەواوی بەتاڵە و هیچ ناوەڕۆکێکی تێدا نییە.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
