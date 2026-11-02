import { AcademicLevel, LEVEL_PROFILES, normalizeKurdishAcademicProse } from "./LevelProfiles";

export interface SourceItem {
  id: string;
  author: string;
  year: string;
  title: string;
  publisherOrLocation: string;
  language: "ku" | "fa" | "ar" | "en";
  pageOrNote?: string;
  verificationOrigin?: "google_search_grounded" | "user_verified_library" | "primary_corpus";
}

export class AdaptiveCitationManager {
  private level: AcademicLevel;
  private sourcesMap: Map<string, SourceItem> = new Map();
  private footnoteCounter = 1;

  private readonly BANNED_FAKE_PATTERNS = [
    "unknown",
    "anonymous",
    "n/a",
    "example",
    "placeholder",
    "نەناسراو",
    "بێ ناو",
    "سەرچاوەی گریمانەیی",
    "کتێبی نموونە",
    "فڵان",
    "test author"
  ];

  constructor(level: AcademicLevel) {
    this.level = level;
  }

  private toKurdishNum(num: number | string): string {
    const d = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return num.toString().replace(/\d/g, (m) => d[parseInt(m, 10)]);
  }

  private makeKey(author: string, title: string): string {
    return `${author.trim()}_${title.trim()}`.toLowerCase().replace(/\s+/g, "_");
  }

  private isAuthenticSource(src: SourceItem): boolean {
    if (!src || !src.author || !src.title || !src.year) return false;
    const combined = `${src.author} ${src.title} ${src.publisherOrLocation}`.toLowerCase();
    for (const pattern of this.BANNED_FAKE_PATTERNS) {
      if (combined.includes(pattern.toLowerCase())) return false;
    }
    const cleanYear = src.year.replace(/[^\d٠-٩]/g, "");
    if (cleanYear.length < 3) return false;
    return src.author.trim().length >= 3 && src.title.trim().length >= 3;
  }

  public registerSource(src: SourceItem): void {
    if (!this.isAuthenticSource(src)) return;
    const key = this.makeKey(src.author, src.title);
    if (!this.sourcesMap.has(key)) {
      this.sourcesMap.set(key, { ...src, id: key });
    }
  }

  public getAllSources(): SourceItem[] {
    return Array.from(this.sourcesMap.values());
  }

  public registerAndFormatCitations(
    rawMarkdown: string,
    sources: SourceItem[]
  ): { cleanMarkdown: string; footnotesBlock: string } {
    const mode = LEVEL_PROFILES[this.level].citationMode;
    let text = normalizeKurdishAcademicProse(rawMarkdown);
    const localFootnotes: string[] = [];

    for (const src of sources || []) {
      const tagRegex = new RegExp(`\\{\\{CITE:${src.id}\\}\\}`, "g");

      if (!this.isAuthenticSource(src)) {
        text = text.replace(tagRegex, "");
        continue;
      }

      const key = this.makeKey(src.author, src.title);
      const existedBefore = this.sourcesMap.has(key);

      if (!existedBefore) {
        this.sourcesMap.set(key, { ...src, id: key });
      }

      if (mode === "simple_list") {
        text = text.replace(tagRegex, ` (${src.author}، ${src.year})`);
      } else {
        const fnNum = this.toKurdishNum(this.footnoteCounter++);
        text = text.replace(tagRegex, `<sup>(${fnNum})</sup>`);

        const pagePart = src.pageOrNote && src.pageOrNote !== "—" ? `، ل ${src.pageOrNote}` : "";
        const fnLine = existedBefore
          ? `(${fnNum}) ${src.author}، *${src.title}*، (سەرچاوەی پێشوو)${pagePart}.`
          : `(${fnNum}) ${src.author} (${src.year})، *${src.title}*، ${src.publisherOrLocation}${pagePart}.`;
        localFootnotes.push(fnLine);
      }
    }

    text = text.replace(/\{\{CITE:[^}]+\}\}/g, "");

    const footnotesBlock =
      localFootnotes.length > 0
        ? `\n\n---\n**پەراوێز و سەرچاوەکان:**\n` + localFootnotes.join("\n")
        : "";

    return { cleanMarkdown: text, footnotesBlock };
  }

  public buildBibliographySection(): string {
    const all = Array.from(this.sourcesMap.values());
    if (all.length === 0) return "";

    if (this.level === "school") {
      return (
        `## سەرچاوەکانی ڕاپۆرت\n\n` +
        all
          .map((s, i) => `${this.toKurdishNum(i + 1)}. ${s.author} (${s.year})، *${s.title}*، ${s.publisherOrLocation}.`)
          .join("\n")
      );
    }

    const byLang = (lang: SourceItem["language"]) =>
      all.filter((s) => s.language === lang).sort((a, b) => a.author.localeCompare(b.author));

    const sections: { title: string; list: SourceItem[]; rtl: boolean }[] = [
      { title: "یەکەم: سەرچاوە کوردییەکان", list: byLang("ku"), rtl: true },
      { title: "دووەم: سەرچاوە فارسییەکان", list: byLang("fa"), rtl: true },
      { title: "سێیەم: سەرچاوە عەرەبییەکان", list: byLang("ar"), rtl: true },
      { title: "چوارەم: سەرچاوە ئینگلیزی و نێودەوڵەتییەکان (English References)", list: byLang("en"), rtl: false }
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
            .join("\n") +
          `\n\n`;
      }
    }
    return out;
  }
}
