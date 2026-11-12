import { Type, Schema } from "@google/genai";
import {
  AcademicLevel,
  LEVEL_PROFILES,
  buildLevelSystemInstruction,
  detectAcademicDomain,
  normalizeKurdishAcademicProse
} from "./LevelProfiles";
import { GeminiCoreEngine } from "./CoreEngine";
import { getHundredPointsAcademicDirective } from "./HundredAcademicRevolution";
import { getSupremeDoctoralDirective, getDomainSpecificDirectives } from "./SupremeAcademicEncyclopedia111";

export interface SubSectionPlan {
  code: string;
  title: string;
  targetWords: number;
  microTopicsToCover: string[];
  transitionFromPreviousGoal: string;
  transitionToNextGoal: string;
}

export interface SectionPlan {
  title: string;
  axisCentralArgument: string;
  axisIntroBridge: string;
  targetWords: number;
  subSections: SubSectionPlan[];
}

export interface ChapterPlan {
  chapterType: "intro" | "core" | "conclusion";
  title: string;
  chapterObjective: string;
  chapterOpeningBridge: string;
  chapterClosingSynthesisGoal: string;
  targetWords: number;
  sections: SectionPlan[];
}

export interface GlossaryTermItem {
  termKurdish: string;
  termEnglish: string;
  termArabic: string;
  scholarlyDefinition: string;
}

export interface TocEntry {
  levelType: "front" | "chapter" | "section" | "subsection" | "end";
  title: string;
  pageLabel: string;
}

export interface AcademicBlueprint {
  level: AcademicLevel;
  domainName: string;
  titleAnalysis: {
    coreSubject: string;
    primaryDimension: string;
    secondaryDimension: string;
    recommendedApproach: string;
    centralThesisThread: string;
    lockedTerminology: string[];
  };
  frontMatterAndIntro: {
    dedicationMarkdown: string;
    acknowledgmentMarkdown: string;
    abstractKurdish: string;
    abstractEnglish: string;
    abstractArabic: string;
    fullIntroductionMarkdown: string;
  };
  tocMarkdown: string;
  tocEntries: TocEntry[];
  chapters: ChapterPlan[];
  glossaryTerms: GlossaryTermItem[];
  glossaryMarkdown: string;
}

function buildControlDirectives(config: Record<string, unknown> | null): string {
  if (!config) return "";
  const text = (key: string) => String(config[key] || "").trim();
  const blocks: string[] = [];
  if (config["customSourcesEnabled"] === true) {
    blocks.push(`سەرچاوەکان تەنها لەم لیستەوە هەڵبژێرە و هیچ سەرچاوەیەکی دەرەکی زیاد مەکە:\n${text("customSourcesList")}`);
  }
  if (config["customOutlineEnabled"] === true) {
    blocks.push(`ئەم پێڕستە و پەیوەندیی پلەبەندییەکانی بە دەقاودەق جێبەجێ بکە:\n${text("customOutlineText")}`);
  }
  if (config["dialecticModeEnabled"] === true) {
    blocks.push("هەر تەوەرێک لە تێز، دژەتێز و سێنتێزدا شیکەرەوە.");
  }
  if (config["writerCriticReviewerEnabled"] === true) {
    blocks.push("پێش دەرکردنی blueprint، نووسین و ڕەخنەی میتۆدی و پێداچوونەوەی زمانەوانی جێبەجێ بکە.");
  }
  if (config["styleMimicryEnabled"] === true && text("styleReferenceSample")) {
    blocks.push(`تۆنی ئەکادیمی و ڕیتمی گشتی لەم نموونەیەوە فێربە، بەبێ لەبەرگرتنەوەی دەقەکە:\n${text("styleReferenceSample")}`);
  }
  if (config["comparativeModeEnabled"] === true) {
    blocks.push(
      `شیکاریی بەراوردی بکە لەنێوان "${text("comparativeSourceOne")}" و "${text("comparativeSourceTwo")}" لەسەر تەوەری "${text("comparativeAxis")}".`
    );
  }
  return blocks.join("\n\n");
}

const blueprintSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titleAnalysis: {
      type: Type.OBJECT,
      properties: {
        coreSubject: { type: Type.STRING },
        primaryDimension: { type: Type.STRING },
        secondaryDimension: { type: Type.STRING },
        recommendedApproach: { type: Type.STRING },
        centralThesisThread: { type: Type.STRING },
        lockedTerminology: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: [
        "coreSubject",
        "primaryDimension",
        "secondaryDimension",
        "recommendedApproach",
        "centralThesisThread",
        "lockedTerminology"
      ]
    },
    frontMatterAndIntro: {
      type: Type.OBJECT,
      properties: {
        dedicationMarkdown: {
          type: Type.STRING,
          description: "دەقی تەواوی پێشکەشکردن بە زمانێکی کوردیی ئەدەبی و ئەکادیمیی باڵا"
        },
        acknowledgmentMarkdown: {
          type: Type.STRING,
          description: "دەقی تەواوی سوپاس و پێزانین بە جیاکراوەیی لە پێشکەشکردن"
        },
        abstractKurdish: {
          type: Type.STRING,
          description: "پوختەی ئەکادیمیی تێروتەسەل بە زمانی کوردی (دەوروبەری ٢٥٠ وشە بە داڕشتەی: کێشە و ئامانج، میتۆدۆلۆژیا، دۆزینەوە سەرەکییەکان، و ئەنجامی مەعریفی)"
        },
        abstractEnglish: {
          type: Type.STRING,
          description: "Comprehensive scholarly abstract in English (~250 words covering background, objective, methodology, core findings, and contributions)"
        },
        abstractArabic: {
          type: Type.STRING,
          description: "مستخلص أكاديمي رصين باللغة العربية (~٢٥٠ كلمة يشمل إشكالية البحث، الأهداف، المنهجية، وأهم النتائج والتوصيات)"
        },
        fullIntroductionMarkdown: {
          type: Type.STRING,
          description: "دەقی تێروتەسەلی پێشەکی / دەروازەی گشتیی توێژینەوەکە بەپێی پێوەری ئاستەکە"
        }
      },
      required: [
        "dedicationMarkdown",
        "acknowledgmentMarkdown",
        "abstractKurdish",
        "abstractEnglish",
        "abstractArabic",
        "fullIntroductionMarkdown"
      ]
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          chapterObjective: { type: Type.STRING },
          chapterOpeningBridge: { type: Type.STRING },
          chapterClosingSynthesisGoal: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                axisCentralArgument: { type: Type.STRING },
                axisIntroBridge: { type: Type.STRING },
                subSections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      title: { type: Type.STRING },
                      microTopicsToCover: { type: Type.ARRAY, items: { type: Type.STRING } },
                      transitionFromPreviousGoal: { type: Type.STRING },
                      transitionToNextGoal: { type: Type.STRING }
                    },
                    required: [
                      "code",
                      "title",
                      "microTopicsToCover",
                      "transitionFromPreviousGoal",
                      "transitionToNextGoal"
                    ]
                  }
                }
              },
              required: ["title", "axisCentralArgument", "axisIntroBridge", "subSections"]
            }
          }
        },
        required: [
          "title",
          "chapterObjective",
          "chapterOpeningBridge",
          "chapterClosingSynthesisGoal",
          "sections"
        ]
      }
    },
    glossaryTerms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          termKurdish: { type: Type.STRING },
          termEnglish: { type: Type.STRING },
          termArabic: { type: Type.STRING },
          scholarlyDefinition: { type: Type.STRING }
        },
        required: ["termKurdish", "termEnglish", "termArabic", "scholarlyDefinition"]
      }
    }
  },
  required: ["titleAnalysis", "frontMatterAndIntro", "chapters", "glossaryTerms"]
};

function toKurdishDigits(num: number | string): string {
  const d = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().replace(/\d/g, (m) => d[parseInt(m, 10)]);
}

function formatTocLine(title: string, pageLabel: string, indentSpaces = 0): string {
  const indent = " ".repeat(indentSpaces);
  const cleanTitle = `${indent}${title.trim()}`;
  const totalWidth = 76;
  const dotsCount = Math.max(6, totalWidth - cleanTitle.length - pageLabel.length);
  const dots = ".".repeat(dotsCount);
  return `${cleanTitle} ${dots} ${pageLabel}`;
}

export function buildFormattedKurdishTOC(
  level: AcademicLevel,
  chapters: ChapterPlan[]
): { tocMarkdown: string; tocEntries: TocEntry[] } {
  const profile = LEVEL_PROFILES[level];
  const wordsPerPage = 350;
  const entries: TocEntry[] = [];
  const lines: string[] = [];

  lines.push("## پێڕستی بابەتەکان\n");
  lines.push(formatTocLine("بابەت", "لاپەڕە", 0));
  lines.push("─".repeat(78));

  if (level !== "school") {
    entries.push({ levelType: "front", title: "پێشکەشکردن", pageLabel: "أ" });
    lines.push(formatTocLine("پێشکەشکردن", "أ", 0));

    entries.push({ levelType: "front", title: "سوپاس و پێزانین", pageLabel: "ب" });
    lines.push(formatTocLine("سوپاس و پێزانین", "ب", 0));

    entries.push({ levelType: "front", title: "پوختەی توێژینەوە (کوردی / ئینگلیزی / عەرەبی)", pageLabel: "ج" });
    lines.push(formatTocLine("پوختەی توێژینەوە (کوردی / ئینگلیزی / عەرەبی)", "ج", 0));
  }

  let currentPage = 1;
  const introTitle = level === "school" ? "پێشەکی" : "دەروازەی گشتیی توێژینەوە";
  entries.push({ levelType: "front", title: introTitle, pageLabel: toKurdishDigits(currentPage) });
  lines.push(formatTocLine(introTitle, toKurdishDigits(currentPage), 0));

  currentPage += Math.max(1, Math.round(profile.structure.introWords / wordsPerPage));

  for (const ch of chapters) {
    const chPage = toKurdishDigits(currentPage);
    entries.push({ levelType: "chapter", title: ch.title, pageLabel: chPage });
    lines.push(formatTocLine(ch.title, chPage, 0));

    for (const sec of ch.sections) {
      const secPage = toKurdishDigits(currentPage);
      entries.push({ levelType: "section", title: sec.title, pageLabel: secPage });
      lines.push(formatTocLine(sec.title, secPage, 2));

      for (const sub of sec.subSections) {
        const subFullTitle = `${sub.code} ${sub.title}`;
        const subPage = toKurdishDigits(currentPage);
        entries.push({ levelType: "subsection", title: subFullTitle, pageLabel: subPage });
        lines.push(formatTocLine(subFullTitle, subPage, 4));

        currentPage += Math.max(1, Math.round((sub.targetWords || 800) / wordsPerPage));
      }
    }
  }

  const conclusionTitle = level === "school" ? "ئەنجامی ڕاپۆرت" : "ئەنجامەکانی توێژینەوە";
  const concPage = toKurdishDigits(currentPage);
  entries.push({ levelType: "end", title: conclusionTitle, pageLabel: concPage });
  lines.push(formatTocLine(conclusionTitle, concPage, 0));
  currentPage += Math.max(1, Math.round((profile.structure.conclusionWords * 0.6) / wordsPerPage));

  const recTitle = level === "school" ? "پێشنیار و سوودەکان" : "ڕاسپاردە و پێشنیارەکان";
  const recPage = toKurdishDigits(currentPage);
  entries.push({ levelType: "end", title: recTitle, pageLabel: recPage });
  lines.push(formatTocLine(recTitle, recPage, 0));
  currentPage += Math.max(1, Math.round((profile.structure.conclusionWords * 0.4) / wordsPerPage));

  const glossTitle = "فەرهەنگۆکی زاراوە زانستییەکان (Glossary)";
  const glossPage = toKurdishDigits(currentPage);
  entries.push({ levelType: "end", title: glossTitle, pageLabel: glossPage });
  lines.push(formatTocLine(glossTitle, glossPage, 0));
  currentPage += 2;

  const bibTitle = level === "school" ? "سەرچاوەکانی ڕاپۆرت" : "لیستی سەرچاوە و بیبلۆگرافیا";
  const bibPage = toKurdishDigits(currentPage);
  entries.push({ levelType: "end", title: bibTitle, pageLabel: bibPage });
  lines.push(formatTocLine(bibTitle, bibPage, 0));

  return { tocMarkdown: lines.join("\n"), tocEntries: entries };
}

export function buildGlossaryMarkdown(terms: GlossaryTermItem[]): string {
  if (!terms || terms.length === 0) return "";
  let md = `## فەرهەنگۆکی زاراوە زانستییەکان (Glossary)\n\n`;
  for (const item of terms) {
    md += `- **${normalizeKurdishAcademicProse(item.termKurdish)}** (*${item.termEnglish}* | ${item.termArabic}): ${normalizeKurdishAcademicProse(item.scholarlyDefinition)}\n`;
  }
  return md;
}

export async function buildLevelCalibratedBlueprint(
  title: string,
  level: AcademicLevel,
  discipline = "",
  targetChapters = LEVEL_PROFILES[level].structure.coreChaptersCount,
  targetWordCount?: number,
  academicControls?: Record<string, unknown> | null
): Promise<AcademicBlueprint> {
  const engine = GeminiCoreEngine.getInstance();
  const profile = LEVEL_PROFILES[level];
  const domain = detectAcademicDomain(title, discipline);

  // هەنگاوی ١: گەڕانی زیندوو لە گووگڵ بۆ کۆکردنەوەی چوارچێوەی ڕاستەقینەی بابەتەکە
  let groundedContext = "";
  try {
    groundedContext = await engine.generate<string>({
      mode: "search_grounded",
      systemInstruction:
        "تۆ پسپۆڕی بیبلۆگرافیا و نەخشەسازیی ئەکادیمیت. گرنگترین تەوەرە زانستییەکان، زاراوە سەرەکییەکان و سەرچاوە ڕاستەقینەکانی پەیوەست بەم ناونیشانە دەربهێنە.",
      prompt: `بابەت: "${title}" لە بواری (${domain.kurdishName}). گرنگترین ڕەهەندە تیۆری و پراکتیکییەکان و سەرچاوە باوەڕپێکراوەکان چین؟`
    });
  } catch {
    groundedContext = "";
  }

  const matrixContext = typeof window !== "undefined" ? (window as any).__MAM_ACADEMIC_MATRIX__ : null;
  const matrixConfig = academicControls || matrixContext?.config || null;
  const matrixDirectives = matrixContext?.getDirectives?.() || buildControlDirectives(matrixConfig);

  let outlineDirective = "";
  if (matrixConfig?.customOutlineEnabled && matrixConfig?.customOutlineText?.trim()) {
    outlineDirective = `\n[قوفڵی پێڕستی تایبەتی توێژەر]: دەبێت بە تەواوی نەخشەی بەشەکان لەسەر بنەمای ئەم پێڕستە دروست بکەیت:\n${matrixConfig.customOutlineText.trim()}\n`;
  }

  let sourcesDirective = "";
  if (matrixConfig?.customSourcesEnabled && matrixConfig?.customSourcesList?.trim()) {
    sourcesDirective = `\n[قوفڵی سەرچاوە تایبەتەکان]: تەنها و تەنها ئەم سەرچاوانەی خوارەوە بەکاربهێنە بۆ چوارچێوەی فەرهەنگۆک و بابەتەکە:\n${matrixConfig.customSourcesList.trim()}\n`;
  }

  const requestedChapterCount = Number.isFinite(Number(targetChapters))
    ? Math.max(1, Math.min(20, Math.floor(Number(targetChapters))))
    : profile.structure.coreChaptersCount;
  const requestedWordCount = Number.isFinite(Number(targetWordCount)) && Number(targetWordCount) > 0
    ? Math.floor(Number(targetWordCount))
    : profile.structure.totalWords;
  const systemInstruction = `
${buildLevelSystemInstruction(level, title, discipline)}

${matrixDirectives}${outlineDirective}${sourcesDirective}
${getHundredPointsAcademicDirective()}
${getSupremeDoctoralDirective()}
${getDomainSpecificDirectives(title, discipline || domain.kurdishName)}

ئەرکی تۆ: داڕشتنی پاکێجی تەواوی دەروازە (پێشکەشکردن، سوپاس و پێزانین، پوختەی تێروتەسەل بە ٣ زمانی کوردی، ئینگلیزی و عەرەبی هەر یەکەی دەوروبەری ٢٥٠ وشە، پێشەکیی تێروتەسەل) + نەخشەی پێڕستی زنجیرەیی (بەش -> تەوەر -> لق) + فەرهەنگۆکی زاراوەکان بۆ بابەتی: "${title}".

یاسای ئەندازەیی پێڕستەکە:
- پێشەکیی فەرمی بە ٧ بەشی جیاواز دابڕێژە: (١) گرنگیی بابەت و هۆکاری هەڵبژاردن، (٢) کێشەی توێژینەوە و پرسیارە سەرەکییەکان، (٣) ئامانج و گریمانەکان، (٤) میتۆد و چوارچێوەی تیۆری، (٥) سنووری بابەتی/کاتی/شوێنی، (٦) پێشینە و پێداچوونەوەی ئەدەبیات، (٧) پەیکەربەندیی بەشەکان.
- لە شیکردنەوەی ئەدەب و سەفەرنامەدا کرۆنۆتۆپی باختین، بونیادی گێڕانەوە و گۆشەنیگای ژێنێت، گوتار و دەسەڵاتی فۆکۆ، و نوێنەرایەتیی ئەویتری سەعید بە پێی گونجاوی بابەت بەکاربهێنە؛ لە زمانەوانیدا مۆرفۆ-سینتاکسی کوردی بە نموونەی ڕاستەقینە شیکەرەوە.
- پوختەی کوردی، ئینگلیزی و عەرەبی دەبێت پوختەی ڕاستەقینەی زانستی بن بە تەواوی ئامانج، میتۆد، دۆزینەوەکان و دەرەنجامەکان (نزیکەی ٢٥٠ وشە بۆ هەر زمانێک، هەرگیز ڕستەی کورت یان پلەیسهۆڵدەر دانەنێیت).
- دەبێت ڕێک (${requestedChapterCount}) بەشی سەرەکی دابڕێژیت و کۆی قەبارەی پلانی نووسین نزیکەی ${requestedWordCount} وشە بێت.
- هەر بەشێک دابەش بکە بۆ (${profile.structure.sectionsPerChapter}) تەوەر.
- هەر تەوەرێک دابەش بکە بۆ (${profile.structure.subSectionsPerSection}) لق.
- هەموو سەردێڕەکان دەبێت ١٠٠٪ هەڵقوڵاوی ناونیشانی "${title}" و بواری (${domain.kurdishName}) بن و بە زنجیرەیەکی توندوتۆڵ بەیەکەوە ببەسترێنەوە.
- بەشە سەرەکییەکان بە ناوی ڕەسەن و ستاندارد بنووسە: «بەشی یەکەم: ...»، «بەشی دووەم: ...» تا کۆتایی بەپێی ئاستەکە.
- لانیکەم ١٢ زاراوەی سەرەکیی بابەتەکە لە بەشی فەرهەنگۆک (glossaryTerms) بە کوردی، ئینگلیزی، عەرەبی و پێناسەی وردی زانستییەوە بنووسە.
`;

  const parsed = await engine.generate<any>({
    mode: "deep_thinking",
    systemInstruction,
    prompt: `ناونیشانی داواکراو: "${title}"\nئاست: ${profile.kurdishTitle}\nبوار: ${domain.kurdishName}\n${
      outlineDirective ? `[پێڕستی تایبەتی داواکراو لەلایەن توێژەرەوە]:\n${outlineDirective}\n` : ""
    }${
      sourcesDirective ? `[سەرچاوە باوەڕپێکراوە دیاریکراوەکان]:\n${sourcesDirective}\n` : ""
    }${
      groundedContext ? `[پاشخانی زانستیی پشتڕاستکراوە]:\n${groundedContext}` : ""
    }`,
    responseSchema: blueprintSchema,
    temperature: 0.3,
    presencePenalty: 0.35,
    frequencyPenalty: 0.45,
    topP: 0.92,
    topK: 40
  });

  const coreWordsTotal =
    profile.structure.totalWords - (profile.structure.introWords + profile.structure.conclusionWords);
  const wordsPerChapter = Math.round(coreWordsTotal / profile.structure.coreChaptersCount);
  const wordsPerSection = Math.round(wordsPerChapter / profile.structure.sectionsPerChapter);
  const wordsPerSubSection = Math.round(wordsPerSection / profile.structure.subSectionsPerSection);

  const calibratedChapters: ChapterPlan[] = (parsed.chapters || []).map((ch: any) => ({
    chapterType: "core",
    title: normalizeKurdishAcademicProse(ch.title),
    chapterObjective: normalizeKurdishAcademicProse(ch.chapterObjective || ""),
    chapterOpeningBridge: normalizeKurdishAcademicProse(ch.chapterOpeningBridge || ""),
    chapterClosingSynthesisGoal: normalizeKurdishAcademicProse(ch.chapterClosingSynthesisGoal || ""),
    targetWords: wordsPerChapter,
    sections: (ch.sections || []).map((sec: any) => ({
      title: normalizeKurdishAcademicProse(sec.title),
      axisCentralArgument: normalizeKurdishAcademicProse(sec.axisCentralArgument || ""),
      axisIntroBridge: normalizeKurdishAcademicProse(sec.axisIntroBridge || ""),
      targetWords: wordsPerSection,
      subSections: (sec.subSections || []).map((sub: any) => ({
        code: sub.code,
        title: normalizeKurdishAcademicProse(sub.title),
        targetWords: wordsPerSubSection,
        microTopicsToCover: (sub.microTopicsToCover || []).map((m: string) => normalizeKurdishAcademicProse(m)),
        transitionFromPreviousGoal: normalizeKurdishAcademicProse(sub.transitionFromPreviousGoal || ""),
        transitionToNextGoal: normalizeKurdishAcademicProse(sub.transitionToNextGoal || "")
      }))
    }))
  }));

  const { tocMarkdown, tocEntries } = buildFormattedKurdishTOC(level, calibratedChapters);
  const glossaryTerms: GlossaryTermItem[] = parsed.glossaryTerms || [];

  return {
    level,
    domainName: domain.kurdishName,
    titleAnalysis: parsed.titleAnalysis,
    frontMatterAndIntro: {
      dedicationMarkdown: normalizeKurdishAcademicProse(parsed.frontMatterAndIntro?.dedicationMarkdown || ""),
      acknowledgmentMarkdown: normalizeKurdishAcademicProse(parsed.frontMatterAndIntro?.acknowledgmentMarkdown || ""),
      abstractKurdish: normalizeKurdishAcademicProse(parsed.frontMatterAndIntro?.abstractKurdish || ""),
      abstractEnglish: parsed.frontMatterAndIntro?.abstractEnglish || "",
      abstractArabic: parsed.frontMatterAndIntro?.abstractArabic || "",
      fullIntroductionMarkdown: normalizeKurdishAcademicProse(
        parsed.frontMatterAndIntro?.fullIntroductionMarkdown || ""
      )
    },
    tocMarkdown,
    tocEntries,
    chapters: calibratedChapters,
    glossaryTerms,
    glossaryMarkdown: buildGlossaryMarkdown(glossaryTerms)
  };
}
