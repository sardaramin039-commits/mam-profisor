import { AcademicLevel, LEVEL_PROFILES, normalizeKurdishAcademicProse } from "./LevelProfiles";

export interface SourceItem {
  id: string;
  author: string;
  year: string;
  title: string;
  publisherOrLocation: string;
  language: "ku" | "fa" | "ar" | "en" | "tr" | "fr";
  pageOrNote?: string;
  translator?: string;
  edition?: string;
  publicationPlace?: string;
  publisher?: string;
  category?: "primary" | "book" | "thesis" | "journal" | "article";
  verificationOrigin?: "google_search_grounded" | "user_verified_library" | "primary_corpus";
  doi?: string;
  isbn?: string;
  issn?: string;
  isExplanatoryCommentary?: boolean;
  transliteratedAuthor?: string;
}

export class AdaptiveCitationManager {
  private level: AcademicLevel;
  private citationStyle?: string;
  private sourcesMap: Map<string, SourceItem> = new Map();
  private citedSources = new Set<string>();
  private sourceNumbers = new Map<string, number>();

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

  constructor(level: AcademicLevel, citationStyle?: string) {
    this.level = level;
    this.citationStyle = citationStyle;
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
    const style = (this.citationStyle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const styleIsExplicit = ["apa", "apa7", "mla", "mla9", "harvard", "ieee", "chicago", "chicagoturabian"].includes(style);
    const useInTextStyle = styleIsExplicit && style !== "chicago" && style !== "chicagoturabian";
    const isIeee = style === "ieee";
    const isMla = style === "mla" || style === "mla9";
    let text = normalizeKurdishAcademicProse(rawMarkdown);
    const localFootnotes: string[] = [];
    const sourcesById = new Map(
      (sources || []).filter((source) => this.isAuthenticSource(source)).map((source) => [source.id, source])
    );
    let sectionFootnoteCounter = 1;
    let sectionLastCitedKey: string | null = null;

    text = text.replace(/\{\{CITE:([^}]+)\}\}/g, (_citation, sourceId: string) => {
      const src = sourcesById.get(sourceId);
      if (!src) return "";

      const key = this.makeKey(src.author, src.title);
      if (!this.sourcesMap.has(key)) this.sourcesMap.set(key, { ...src, id: key });
      if (useInTextStyle || (!styleIsExplicit && mode === "simple_list")) {
        this.citedSources.add(key);
        if (isIeee) {
          let number = this.sourceNumbers.get(key);
          if (!number) {
            number = this.sourceNumbers.size + 1;
            this.sourceNumbers.set(key, number);
          }
          return ` [${this.toKurdishNum(number)}]`;
        }
        return isMla
          ? ` (${src.author}${src.pageOrNote ? ` ${src.pageOrNote}` : ""})`
          : ` (${src.author}، ${src.year})`;
      }

      const fnNum = this.toKurdishNum(sectionFootnoteCounter++);
      const wasCitedBefore = this.citedSources.has(key);
      const isImmediateRepeat = sectionLastCitedKey === key;
      const pagePart = src.pageOrNote && src.pageOrNote !== "—" ? `، ل ${src.pageOrNote}` : "";
      const doiPart = src.doi ? ` DOI: <bdi dir="ltr">${src.doi}</bdi>` : "";
      const commentaryPrefix = src.isExplanatoryCommentary ? " [تێبینیی ڕوونکردنەوەیی]: " : "";
      const publication = src.publisher
        ? `${src.publicationPlace || src.publisherOrLocation}: ${src.publisher}`
        : src.publicationPlace || src.publisherOrLocation;
      const translator = src.translator ? `، وەرگێڕ: ${src.translator}` : "";
      const edition = src.edition ? `، چاپی ${src.edition}` : "";
      const fnLine = !wasCitedBefore
        ? `(${fnNum}) ${commentaryPrefix}${src.author} (${src.year})، *${src.title}*${translator}${edition}، ${publication}${pagePart}.${doiPart}`
        : isImmediateRepeat
          ? `(${fnNum}) هەمان سەرچاوە${pagePart}.${doiPart}`
          : `(${fnNum}) ${src.author}، *${src.title}*، (سەرچاوەی پێشوو)${pagePart}.${doiPart}`;
      localFootnotes.push(fnLine);
      this.citedSources.add(key);
      sectionLastCitedKey = key;
      return `<sup>(${fnNum})</sup>`;
    });

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
        "# لیستی سەرچاوەکان\n\n" +
        all
          .map((s, i) => `${this.toKurdishNum(i + 1)}. ${s.author} (${s.year})، *${s.title}*، ${s.publisherOrLocation}.`)
          .join("\n")
      );
    }

    const primarySources = all
      .filter((s) => s.category === "primary" || s.verificationOrigin === "primary_corpus")
      .sort((a, b) => a.author.localeCompare(b.author));

    const secondaryAll = all.filter((s) => !primarySources.includes(s));
    const languageOrder: Record<SourceItem["language"], number> = {
      ku: 0,
      fa: 1,
      ar: 2,
      en: 3,
      tr: 4,
      fr: 5
    };
    const sortByLanguageThenAuthor = (a: SourceItem, b: SourceItem) =>
      languageOrder[a.language] - languageOrder[b.language] || a.author.localeCompare(b.author);
    const bookSources = secondaryAll
      .filter((s) => !s.category || s.category === "book")
      .sort(sortByLanguageThenAuthor);
    const academicSources = secondaryAll
      .filter((s) => s.category === "thesis" || s.category === "journal" || s.category === "article")
      .sort(sortByLanguageThenAuthor);

    const sections: { title: string; list: SourceItem[]; rtl: boolean }[] = [
      { title: "یەکەم: سەرچاوە بنەڕەتی و دەقەکان (Primary Sources & Manuscripts)", list: primarySources, rtl: true },
      { title: "دووەم: کتێب و سەرچاوە تیۆرییەکان (بە زمانی کوردی، فارسی، عەرەبی، ئینگلیزی)", list: bookSources, rtl: true },
      { title: "سێیەم: نامە ئەکادیمییەکان (ماستەر و دکتۆرا) و گۆڤارە زانستییەکان", list: academicSources, rtl: true }
    ];

    let out = "# لیستی سەرچاوە و ژێدەرەکان\n\n";
    const style = (this.citationStyle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const sec of sections) {
      if (sec.list.length > 0) {
        out +=
          `## ${sec.title}\n` +
          sec.list
            .map((s, i) => {
              const num = sec.rtl ? this.toKurdishNum(i + 1) : i + 1;
              if (style === "ieee") {
                const key = this.makeKey(s.author, s.title);
                const ieeeNumber = this.sourceNumbers.get(key) || i + 1;
                return `[${this.toKurdishNum(ieeeNumber)}] ${s.author}, *${s.title}*, ${s.publisherOrLocation}, ${s.year}.`;
              }
              if (style === "mla" || style === "mla9") {
                return `${num}. ${s.author}. *${s.title}*. ${s.publisherOrLocation}, ${s.year}.`;
              }
              if (style === "apa" || style === "apa7" || style === "harvard") {
                return `${num}. ${s.author} (${s.year}). *${s.title}*. ${s.publisherOrLocation}.`;
              }
              return `${num}. ${s.author} (${s.year})، *${s.title}*، ${s.publisherOrLocation}.`;
            })
            .join("\n") +
          "\n\n";
      }
    }
    return out;
  }
}
