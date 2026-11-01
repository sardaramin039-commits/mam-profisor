import { Type, Schema } from "@google/genai";
import {
  AcademicLevel,
  LEVEL_PROFILES,
  buildLevelSystemInstruction,
  normalizeKurdishAcademicProse
} from "./LevelProfiles";
import { SubSectionPlan } from "./BlueprintAgent";
import { AdaptiveCitationManager, SourceItem } from "./CitationManager";
import { GeminiCoreEngine } from "./CoreEngine";

interface PassOutput {
  proseMarkdown: string;
  evidenceAndProofsSummary: string[];
  coveredPoints: string[];
  closingParagraph: string;
  sources: SourceItem[];
}

const passSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    proseMarkdown: { type: Type.STRING },
    evidenceAndProofsSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
    coveredPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    closingParagraph: { type: Type.STRING },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          author: { type: Type.STRING },
          year: { type: Type.STRING },
          title: { type: Type.STRING },
          publisherOrLocation: { type: Type.STRING },
          language: { type: Type.STRING, enum: ["ku", "fa", "ar", "en"] },
          pageOrNote: { type: Type.STRING },
          verificationOrigin: {
            type: Type.STRING,
            enum: ["google_search_grounded", "user_verified_library", "primary_corpus"]
          }
        },
        required: ["id", "author", "year", "title", "publisherOrLocation", "language", "verificationOrigin"]
      }
    }
  },
  required: ["proseMarkdown", "evidenceAndProofsSummary", "coveredPoints", "closingParagraph", "sources"]
};

const IRONCLAD_ACADEMIC_AND_COHESION_LAWS = `
یاسا پۆڵایینەکانی ئەکادیمی (شکاندنی هەر خاڵێک بە هەموو شێوەیەک قەدەغەیە):
١. قەدەغەکردنی ڕەهای کورتبڕی (ZERO TRUNCATION):
   - هەرگیز بابەتەکان کورت مەکەرەوە و دەستەواژەی وەک (بە کورتی، هتد...) بەکارمەهێنە؛ هەر خاڵێک بە پەرەگرافی تێروتەسەل و شیکردنەوەی قووڵ بنووسە تا دەگاتە تەواوی ژمارەی وشەی داواکراو.
٢. قەدەغەکردنی ڕەهای نووسینی بێ بەڵگە (ZERO UNSUBSTANTIATED PROSE):
   - هەموو پەرەگرافێک دەبێت لەسەر بنەمای: [تێز و بیرۆکە + بەڵگەی کۆنکرێتی (دەق، داتا، ڕووداوی مێژوویی، یان هاوکێشەی زانستی) + سەرچاوەی ڕاستەقینە {{CITE:id}} + شیکردنەوە و ڕاڤەی قووڵ] دابڕێژرێت.
٣. قەدەغەکردنی ڕەهای سەرچاوەی ساختە (ZERO HALLUCINATED CITATIONS):
   - هەرگیز ناوی نووسەر، کتێب، ساڵ یان ژمارەی لاپەڕە لە خەیاڵی خۆتەوە دروست مەکە؛ تەنها پشت بەو سەرچاوە ڕاستەقینانە ببەستە کە لە گەڕانی زیندوو و کتێبخانەی توێژەرەوە پێت دراون.
٤. پاراستنی یەکێتیی زنجیرەیی نێوان (بەش -> تەوەر -> لق -> پەرەگراف):
   - پەرەگرافی یەکەم دەبێت ڕاستەوخۆ وەک تەواوکەری لۆژیکیی پەرەگرافی کۆتایی پێشوو دەست پێ بکات و پەرەگرافی کۆتاییش زەمینە بۆ لقی داهاتوو خۆش بکات.
   - ڕێنووس و ڕستەسازیی کوردی دەبێت ١٠٠٪ پاراو، ڕەسەن و بێ هەڵەی ڕێزمانی بێت.
`;

export const COHESION_AND_INTEGRITY_LAWS = IRONCLAD_ACADEMIC_AND_COHESION_LAWS;
export const IRONCLAD_ACADEMIC_LAWS = IRONCLAD_ACADEMIC_AND_COHESION_LAWS;

export function countWords(text: string): number {
  return (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function writeCalibratedSubSection(params: {
  thesisTitle: string;
  level: AcademicLevel;
  discipline?: string;
  centralThesisThread?: string;
  lockedTerminology?: string[];
  chapterTitle: string;
  chapterObjective?: string;
  chapterOpeningBridge?: string;
  isFirstSubSectionOfChapter?: boolean;
  isLastSubSectionOfChapter?: boolean;
  chapterClosingSynthesisGoal?: string;
  sectionTitle: string;
  axisCentralArgument?: string;
  axisIntroBridge?: string;
  isFirstSubSectionOfAxis?: boolean;
  subSection: SubSectionPlan;
  previousClosingParagraph: string;
  cumulativeChapterMemory?: string[];
  nextSubSectionTitle?: string;
  verifiedLibrarySourcesText?: string;
  cachedContentName?: string;
  citationManager: AdaptiveCitationManager;
}): Promise<{ fullSubSectionMarkdown: string; lastParagraph: string; keyFindings: string[] }> {
  const engine = GeminiCoreEngine.getInstance();
  const profile = LEVEL_PROFILES[params.level];

  // هەنگاوی ١: گەڕانی زیندووی گووگڵ بۆ هێنانی سەرچاوە و بەڵگەی ڕاستەقینە پێش نووسین
  let groundedBibliographyAndFacts = "";
  try {
    groundedBibliographyAndFacts = await engine.generate<string>({
      mode: "search_grounded",
      systemInstruction:
        "تۆ پسپۆڕی بیبلۆگرافیا و ساغکردنەوەی سەرچاوە زانستییەکانیت. تەنها سەرچاوە، کتێب، توێژینەوە و بەڵگە ڕاستەقینەکان بە ناوی تەواوی نووسەر و ساڵی چاپەوە دەربهێنە.",
      prompt: `بۆ نووسینی لقی "${params.subSection.title}" (${params.subSection.microTopicsToCover.join("، ")}) لە ناو توێژینەوەی "${params.thesisTitle}"، گرنگترین سەرچاوە زانستییە ڕاستەقینەکان و بەڵگە سەلمێنراوەکان چین؟`
    });
  } catch {
    groundedBibliographyAndFacts = "";
  }

  const totalPasses = Math.max(
    1,
    Math.ceil(params.subSection.targetWords / profile.structure.maxWordsPerSinglePass)
  );
  const wordsPerPass = Math.round(params.subSection.targetWords / totalPasses);

  const passParagraphs: string[] = [];
  const passFootnotes: string[] = [];
  const cumulativeCovered: string[] = [];
  let rollingBridgeParagraph = params.previousClosingParagraph;

  for (let pass = 1; pass <= totalPasses; pass++) {
    const topicSlice =
      params.subSection.microTopicsToCover[pass - 1] ||
      params.subSection.microTopicsToCover.join("، ") ||
      params.subSection.title;

    const systemInstruction = `
${buildLevelSystemInstruction(params.level, params.thesisTitle, params.discipline)}

${IRONCLAD_ACADEMIC_AND_COHESION_LAWS}
`;

    const prompt = `
- ناونیشانی توێژینەوە: "${params.thesisTitle}" (${profile.kurdishTitle})
- هێڵی ناوەندیی توێژینەوەکە: ${params.centralThesisThread || "پاراستنی یەکێتیی بابەتی"}
${
  params.lockedTerminology && params.lockedTerminology.length > 0
    ? `- زاراوە جێگیرکراوەکان: ${params.lockedTerminology.join("، ")}`
    : ""
}
- بەش: ${params.chapterTitle} | تەوەر: ${params.sectionTitle}
- لقی ئێستا: ${params.subSection.code} - ${params.subSection.title}
- قۆناغی نووسین: ${pass} لە کۆی ${totalPasses} (ئامانجی زۆرەملێ: لانیکەم ${wordsPerPass} وشەی تەواو)
- تەوەری وردی ئەم قۆناغە: (${topicSlice})
${rollingBridgeParagraph ? `- دوایین پەرەگرافی پێش ئێستا (ڕاستەوخۆ لە دوای ئەمەوە بەردەوام بە): "${rollingBridgeParagraph}"` : ""}
${
  pass === totalPasses && params.nextSubSectionTitle
    ? `- لە کۆتاییدا زەمینە خۆش بکە بۆ لقی داهاتوو: (${params.nextSubSectionTitle})`
    : ""
}

[سەرچاوە و بەڵگە ڕاستەقینە دۆزراوەکان]:
${groundedBibliographyAndFacts || "پشت بە سەرچاوە باوەڕپێکراوەکانی بواری بابەتەکە ببەستە."}
${params.verifiedLibrarySourcesText ? `\n[سەرچاوەکانی کتێبخانەی توێژەر]:\n${params.verifiedLibrarySourcesText}` : ""}
${
  cumulativeCovered.length > 0
    ? `\n[خاڵە باسکراوەکانی قۆناغی پێشوو (دووبارەیان مەکەرەوە!)]:\n${cumulativeCovered.join(" | ")}`
    : ""
}
`;

    let data = await engine.generate<PassOutput>({
      mode: "deep_thinking",
      systemInstruction,
      prompt,
      responseSchema: passSchema,
      cachedContentName: params.cachedContentName,
      temperature: 0.3
    });

    let combinedPassProse = normalizeKurdishAcademicProse(data.proseMarkdown || "");
    let combinedPassSources: SourceItem[] = [...(data.sources || [])];

    // قوفڵی دژە-کورتبڕی (Anti-Truncation Loop)
    const minimumAcceptableWords = Math.floor(wordsPerPass * 0.85);
    let expansionAttempt = 0;

    while (countWords(combinedPassProse) < minimumAcceptableWords && expansionAttempt < 2) {
      expansionAttempt++;
      const deficitWords = wordsPerPass - countWords(combinedPassProse);

      const expansionData = await engine.generate<PassOutput>({
        mode: "deep_thinking",
        systemInstruction,
        prompt: `
تۆ تەنها ${countWords(combinedPassProse)} وشەت نووسیوە لە کاتێکدا داوای ${wordsPerPass} وشە کرابوو.
ڕاستەوخۆ لە دوای ئەم پەرەگرافەی کۆتاییەوە ("${data.closingParagraph}") بەردەوام بە و لانیکەم (${deficitWords}) وشەی نوێی پڕ لە شیکردنەوەی قووڵ، بەڵگەی زانستی/دەقی و نموونەی ڕاستەقینە لەسەر (${topicSlice}) بنووسە بێ دووبارەکردنەوە.
`,
        responseSchema: passSchema,
        cachedContentName: params.cachedContentName,
        temperature: 0.3
      });

      if (expansionData.proseMarkdown) {
        combinedPassProse += `\n\n${normalizeKurdishAcademicProse(expansionData.proseMarkdown)}`;
        combinedPassSources.push(...(expansionData.sources || []));
        data.closingParagraph = expansionData.closingParagraph || data.closingParagraph;
        data.coveredPoints.push(...(expansionData.coveredPoints || []));
      }
    }

    const { cleanMarkdown, footnotesBlock } = params.citationManager.registerAndFormatCitations(
      combinedPassProse,
      combinedPassSources
    );

    passParagraphs.push(cleanMarkdown.trim());
    if (footnotesBlock) passFootnotes.push(footnotesBlock);
    cumulativeCovered.push(...(data.coveredPoints || []));
    rollingBridgeParagraph = normalizeKurdishAcademicProse(data.closingParagraph);
  }

  let structuralPreamble = "";
  if (params.isFirstSubSectionOfChapter && params.chapterOpeningBridge) {
    structuralPreamble += `> **دەروازەی بەش:** ${normalizeKurdishAcademicProse(params.chapterOpeningBridge)}\n\n`;
  }
  if (params.isFirstSubSectionOfAxis && params.axisIntroBridge) {
    structuralPreamble += `* **پێشەکیی تەوەر:** ${normalizeKurdishAcademicProse(params.axisIntroBridge)}\n\n`;
  }

  const fullSubSectionMarkdown =
    `${structuralPreamble}### ${params.subSection.code} ${params.subSection.title}\n\n` +
    passParagraphs.join("\n\n") +
    (passFootnotes.length > 0 ? `\n${passFootnotes.join("\n")}` : "");

  return {
    fullSubSectionMarkdown,
    lastParagraph: rollingBridgeParagraph,
    keyFindings: cumulativeCovered
  };
}

export async function generateCalibratedConclusion(
  title: string,
  level: AcademicLevel,
  allFindings: string[],
  discipline = ""
): Promise<string> {
  const engine = GeminiCoreEngine.getInstance();
  const profile = LEVEL_PROFILES[level];

  const text = await engine.generate<string>({
    mode: "deep_thinking",
    systemInstruction: `${buildLevelSystemInstruction(level, title, discipline)}\n${IRONCLAD_ACADEMIC_AND_COHESION_LAWS}`,
    prompt: `
ناونیشان: "${title}"
ئاست: ${profile.kurdishTitle}
کۆی خاڵ و دۆزینەوە سەلمێنراوەکانی ناو تەواوی بەش و تەوەرەکانی توێژینەوەکە:
${allFindings.join("\n- ")}

تکایە هەردوو بەشی:
١. (ئەنجامەکانی توێژینەوە)
٢. (ڕاسپاردە و پێشنیارەکان)
بە جیاکراوەیی، بە وردی و بە قەبارەی لانیکەم ${profile.structure.conclusionWords} وشە بەپێی پێوەری (${profile.introAndConclusionRules}) بنووسە.
`
  });

  return normalizeKurdishAcademicProse(text || "");
}

export function generateLevelDesignStylesheet(level: AcademicLevel): string {
  const d = LEVEL_PROFILES[level].designSpec;
  return `
@page {
  size: A4;
  margin-top: ${d.marginsCm.top}cm;
  margin-bottom: ${d.marginsCm.bottom}cm;
  margin-right: ${d.marginsCm.right}cm;
  margin-left: ${d.marginsCm.left}cm;
}
.academic-document-container {
  direction: rtl;
  text-align: justify;
  font-family: ${d.fontFamily};
  font-size: ${d.bodyFontSizePt}pt;
  line-height: ${d.lineHeight};
  color: #1a1a1a;
}
.academic-document-container h1 {
  font-size: ${d.h1SizePt}pt;
  font-weight: bold;
  text-align: center;
  margin-top: 28pt;
  margin-bottom: 18pt;
  page-break-before: always;
}
.academic-document-container h2 {
  font-size: ${d.h2SizePt}pt;
  font-weight: bold;
  margin-top: 20pt;
  margin-bottom: 12pt;
  border-bottom: 1px solid #444;
  padding-bottom: 4pt;
}
.academic-document-container h3 {
  font-size: ${d.h3SizePt}pt;
  font-weight: bold;
  margin-top: 14pt;
  margin-bottom: 8pt;
}
.academic-document-container p {
  text-indent: ${level === "school" ? "0.5cm" : "1cm"};
  margin-bottom: 10pt;
}
`;
}
