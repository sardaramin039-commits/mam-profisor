// AdaptiveCitationManager.ts
import { LEVEL_PROFILES, type AcademicLevel } from './LevelProfiles';
import { CitationVerificationTrackerService } from './citation-verification-tracker.service';

export interface SourceItem {
  id: string;
  author: string;
  year: string;
  title: string;
  publisherOrLocation: string;
  language: 'ku' | 'fa' | 'ar' | 'en';
  pageOrNote?: string;
  verificationOrigin?: 'google_search_grounded' | 'user_verified_library' | 'primary_corpus';
}

export class AdaptiveCitationManager {
  private level: AcademicLevel;
  private sourcesMap: Map<string, SourceItem> = new Map();
  private footnoteCounter: number = 1;
  private tracker?: CitationVerificationTrackerService;

  // لیستی وشە گوماناوی و ساختەکان بۆ ڕەتکردنەوەی سەرچاوەی نادروست
  public readonly BANNED_FAKE_PATTERNS = [
    'unknown',
    'anonymous',
    'n/a',
    'example',
    'placeholder',
    ' نەناسراو',
    'بێ ناو',
    'سەرچاوەی گریمانەیی',
    'کتێبی نموونە',
    'فڵان',
    'test author'
  ];

  constructor(level: AcademicLevel = 'phd', tracker?: CitationVerificationTrackerService) {
    this.level = level;
    this.tracker = tracker;
  }

  public setTracker(tracker: CitationVerificationTrackerService): void {
    this.tracker = tracker;
  }

  public setLevel(level: AcademicLevel): void {
    this.level = level;
  }

  public getLevel(): AcademicLevel {
    return this.level;
  }

  public reset(): void {
    this.sourcesMap.clear();
    this.footnoteCounter = 1;
  }

  public getSources(): SourceItem[] {
    return Array.from(this.sourcesMap.values());
  }

  private toKurdishNum(num: number | string): string {
    const d = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().replace(/\d/g, (m) => d[parseInt(m, 10)]);
  }

  private makeKey(author: string, title: string): string {
    return `${author.trim()}_${title.trim()}`.toLowerCase().replace(/\s+/g, '_');
  }

  // پشکنینی ڕاستگۆیی سەرچاوەکە پێش تۆمارکردنی
  public isAuthenticSource(src: SourceItem): { valid: boolean; pattern?: string; reason?: string } {
    if (!src || !src.author || !src.title || !src.year) {
      return { valid: false, reason: 'زانیارییە سەرەکییەکانی سەرچاوەکە بەتاڵن' };
    }
    const combined = `${src.author} ${src.title} ${src.publisherOrLocation || ''}`.toLowerCase();
    for (const pattern of this.BANNED_FAKE_PATTERNS) {
      if (combined.includes(pattern.trim().toLowerCase())) {
        return { valid: false, pattern, reason: `دەستەواژەی قەدەغەکراوی (${pattern}) تێدایە` };
      }
    }
    const cleanYear = src.year.replace(/[^\d٠-٩]/g, '');
    if (cleanYear.length < 3) {
      return { valid: false, reason: 'ساڵی چاپ ناتەواوە' };
    }
    if (src.author.trim().length < 3 || src.title.trim().length < 3) {
      return { valid: false, reason: 'ناوی نووسەر یان ناونیشان ناتەواوە' };
    }
    return { valid: true };
  }

  public registerAndFormatCitations(
    rawMarkdown: string,
    sources: SourceItem[]
  ): { cleanMarkdown: string; footnotesBlock: string } {
    const mode = LEVEL_PROFILES[this.level]?.citationMode || 'scholarly_multilingual_footnotes';
    let text = rawMarkdown;
    const localFootnotes: string[] = [];

    for (const src of sources || []) {
      const tagRegex = new RegExp(`\\{\\{CITE:${src.id}\\}\\}`, 'g');

      // پشکنینی ڕاستگۆیی و نەبوونی وشەی قەدەغەکراو لە سەرچاوەکە
      const authCheck = this.isAuthenticSource(src);
      if (!authCheck.valid) {
        // تۆمارکردنی ئاگاداری ڕەتکردنەوە لە سیستمەکە بۆ ئاگادارکردنەوەی بەکارهێنەر لە UI
        if (this.tracker) {
          this.tracker.recordRejection(
            src,
            authCheck.reason || 'سەرچاوەی ساختە یان نادروست ڕەتکرایەوە',
            authCheck.pattern || 'banned_pattern'
          );
        }
        text = text.replace(tagRegex, '');
        continue;
      }

      const key = this.makeKey(src.author, src.title);
      const existedBefore = this.sourcesMap.has(key);

      if (!existedBefore) {
        this.sourcesMap.set(key, { ...src, id: key });
      }

      let assignedFootnoteNum: string | undefined;

      if (mode === 'simple_list') {
        text = text.replace(tagRegex, ` (${src.author}، ${src.year})`);
      } else {
        const fnNum = this.toKurdishNum(this.footnoteCounter++);
        assignedFootnoteNum = fnNum;
        text = text.replace(tagRegex, `<sup>(${fnNum})</sup>`);

        const pagePart = src.pageOrNote && src.pageOrNote !== '—' ? `، ل ${src.pageOrNote}` : '';
        const fnLine = existedBefore
          ? `(${fnNum}) ${src.author}، *${src.title}*، (سەرچاوەی پێشوو)${pagePart}.`
          : `(${fnNum}) ${src.author} (${src.year})، *${src.title}*، ${src.publisherOrLocation}${pagePart}.`;
        localFootnotes.push(fnLine);
      }

      // تۆمارکردنی سەرچاوەی پشتڕاستکراو لە ترێکەری سیستم بۆ شریتی پێشکەوتن و لیستی زیندوو
      if (this.tracker) {
        this.tracker.recordVerification({
          ...src,
          footnoteNum: assignedFootnoteNum,
          verificationOrigin: src.verificationOrigin || 'google_search_grounded'
        });
      }
    }

    // پاککردنەوەی هەر تاگێکی زیادە ئەگەر مابێتەوە
    text = text.replace(/\{\{CITE:[^}]+\}\}/g, '');

    const footnotesBlock =
      localFootnotes.length > 0
        ? `\n\n---\n**پەراوێز و سەرچاوە پشتڕاستکراوەکان:**\n` + localFootnotes.join('\n')
        : '';

    // نوێکردنەوەی دەقی شیکاریکراو لە ترێکەر بۆ هەژمارکردنی Quality Score
    if (this.tracker) {
      this.tracker.updateAnalyzedText(text);
    }

    return { cleanMarkdown: text, footnotesBlock };
  }

  public buildBibliographySection(): string {
    const all = Array.from(this.sourcesMap.values());
    if (all.length === 0) return '';

    if (this.level === 'school') {
      return (
        `## سەرچاوەکانی ڕاپۆرت\n\n` +
        all
          .map((s, i) => `${this.toKurdishNum(i + 1)}. ${s.author} (${s.year})، *${s.title}*، ${s.publisherOrLocation}.`)
          .join('\n')
      );
    }

    const byLang = (lang: SourceItem['language']) =>
      all.filter((s) => s.language === lang).sort((a, b) => a.author.localeCompare(b.author));

    const sections: { title: string; list: SourceItem[]; rtl: boolean }[] = [
      { title: 'یەکەم: سەرچاوە کوردییەکان', list: byLang('ku'), rtl: true },
      { title: 'دووەم: سەرچاوە فارسییەکان', list: byLang('fa'), rtl: true },
      { title: 'سێیەم: سەرچاوە عەرەبییەکان', list: byLang('ar'), rtl: true },
      { title: 'چوارەم: سەرچاوە ئینگلیزییەکان (English References)', list: byLang('en'), rtl: false }
    ];

    let out = `## لیستی سەرچاوە و بیبلۆگرافیا\n\n`;
    for (const sec of sections) {
      if (sec.list.length > 0) {
        out +=
          `### ${sec.title}\n` +
          sec.list
            .map((s, i) => {
              const num = sec.rtl ? this.toKurdishNum(i + 1) : `${i + 1}`;
              return `${num}. ${s.author} (${s.year}). *${s.title}*. ${s.publisherOrLocation}.`;
            })
            .join('\n') +
          `\n\n`;
      }
    }
    return out;
  }
}
