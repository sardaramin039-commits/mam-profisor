// AdaptiveCitationManager.ts
import { LEVEL_PROFILES, type AcademicLevel } from './LevelProfiles';

export interface SourceItem {
  id: string;
  author: string;
  year: string;
  title: string;
  publisherOrLocation: string;
  language: 'ku' | 'fa' | 'ar' | 'en';
  pageOrNote?: string;
}

export class AdaptiveCitationManager {
  private level: AcademicLevel;
  private sourcesMap: Map<string, SourceItem> = new Map();
  private footnoteCounter: number = 1;

  constructor(level: AcademicLevel = 'phd') {
    this.level = level;
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

  public registerAndFormatCitations(
    rawMarkdown: string,
    sources: SourceItem[]
  ): { cleanMarkdown: string; footnotesBlock: string } {
    const mode = LEVEL_PROFILES[this.level]?.citationMode || 'scholarly_multilingual_footnotes';
    let text = rawMarkdown;
    const localFootnotes: string[] = [];

    for (const src of sources) {
      const key = this.makeKey(src.author, src.title);
      const existedBefore = this.sourcesMap.has(key);

      if (!existedBefore) {
        this.sourcesMap.set(key, { ...src, id: key });
      }

      const tagRegex = new RegExp(`\\{\\{CITE:${src.id}\\}\\}`, 'g');

      if (mode === 'simple_list') {
        // بۆ ئاستی قوتابخانە: ژمارەی پەراوێزی ئاڵۆز دانانرێت، تەنها لە کۆتایی ڕاپۆرتەکە سەرچاوەکان ڕیز دەکرێن
        text = text.replace(tagRegex, '');
      } else {
        // بۆ زانکۆ، ماستەر و دکتۆرا: ژمارەی پەراوێزی زنجیرەیی دادەنرێت
        const fnNum = this.toKurdishNum(this.footnoteCounter++);
        text = text.replace(tagRegex, `<sup>(${fnNum})</sup>`);

        const fnLine = existedBefore
          ? `(${fnNum}) ${src.author}، *${src.title}*، (سەرچاوەی پێشوو)، ل ${src.pageOrNote || '—'}.`
          : `(${fnNum}) ${src.author} (${src.year})، *${src.title}*، ${src.publisherOrLocation}، ل ${
              src.pageOrNote || '—'
            }.`;
        localFootnotes.push(fnLine);
      }
    }

    // پاککردنەوەی هەر تاگێکی زیادە ئەگەر مابێتەوە
    text = text.replace(/\{\{CITE:[^}]+\}\}/g, '');

    const footnotesBlock =
      localFootnotes.length > 0
        ? `\n\n---\n**پەراوێزەکان:**\n` + localFootnotes.join('\n')
        : '';

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
