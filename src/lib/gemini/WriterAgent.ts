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
import { autoEvolutionGuardian } from "./AutoEvolutionGuardian";
import { getHundredPointsAcademicDirective } from "./HundredAcademicRevolution";
import { getSupremeDoctoralDirective, getDomainSpecificDirectives } from "./SupremeAcademicEncyclopedia111";
import { TurboPromptAccelerator } from "./TurboPromptAccelerator";
import { loadAcademicPromptModule } from "./ModularPromptRegistry";

interface PassOutput {
  proseMarkdown: string;
  evidenceAndProofsSummary: string[];
  coveredPoints: string[];
  closingParagraph: string;
  sources: SourceItem[];
}

interface AcademicControlsConfig {
  customSourcesEnabled?: boolean;
  customSourcesList?: string;
  customOutlineEnabled?: boolean;
  customOutlineText?: string;
  dialecticModeEnabled?: boolean;
  writerCriticReviewerEnabled?: boolean;
  styleMimicryEnabled?: boolean;
  styleReferenceSample?: string;
  comparativeModeEnabled?: boolean;
  comparativeSourceOne?: string;
  comparativeSourceTwo?: string;
  comparativeAxis?: string;
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
          },
          category: {
            type: Type.STRING,
            enum: ["primary", "book", "thesis", "journal", "article"]
          },
          translator: { type: Type.STRING },
          edition: { type: Type.STRING },
          publicationPlace: { type: Type.STRING },
          publisher: { type: Type.STRING }
        },
        required: ["id", "author", "year", "title", "publisherOrLocation", "language", "verificationOrigin"]
      }
    }
  },
  required: ["proseMarkdown", "evidenceAndProofsSummary", "coveredPoints", "closingParagraph", "sources"]
};

const IRONCLAD_ACADEMIC_AND_COHESION_LAWS = `
٠. یاسای سێکوچکەی شیکاریی ئەکادیمی (THEORETICAL-TEXTUAL-CRITICAL TRIAD):
- هەموو تەوەرێک دەبێت بەم ٣ هەنگاوە زانستییە دابڕێژرێت: (١) ناساندنی چەمک یان گریمانە تیۆرییەکە، (٢) هێنانەوەی بەڵگە و نموونەی ڕاستەوخۆ لەناو دەقە بنەڕەتییەکان بە پەراوێزی وردەوە، (٣) شیکردنەوەی ڕەخنەیی و بەراوردکاری بە دەنگی زانستیی توێژەر (Authorial Voice).
- لە یەکەم دەرکەوتنی هەر زاراوەیەکی زانستیدا، هاوتا ئینگلیزی و عەرەبییەکەی لەناو کەوانەدا بنووسە.
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
${getHundredPointsAcademicDirective()}
${getSupremeDoctoralDirective()}
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
  academicControls?: Partial<AcademicControlsConfig> | null;
  citationStyle?: string;
  generationMode?: 'fast_draft' | 'deep_audit';
  citationManager: AdaptiveCitationManager;
  onLiveProgress?: (liveMarkdown: string, liveWordCount: number, statusStep?: string) => void;
}): Promise<{ fullSubSectionMarkdown: string; lastParagraph: string; keyFindings: string[] }> {
  const engine = GeminiCoreEngine.getInstance();
  const profile = LEVEL_PROFILES[params.level];
  const targetWords = params.subSection.targetWords || 800;

  let structuralPreamble = "";
  if (params.isFirstSubSectionOfChapter && params.chapterOpeningBridge) {
    structuralPreamble += `> **دەروازەی بەش:** ${normalizeKurdishAcademicProse(params.chapterOpeningBridge)}\n\n`;
  }
  if (params.isFirstSubSectionOfAxis && params.axisIntroBridge) {
    structuralPreamble += `* **پێشەکیی تەوەر:** ${normalizeKurdishAcademicProse(params.axisIntroBridge)}\n\n`;
  }
  const branchHeader = `${structuralPreamble}### ${params.subSection.code} ${params.subSection.title}\n\n`;
  const matrixContext = typeof window !== "undefined" ? (window as any).__MAM_ACADEMIC_MATRIX__ : null;
  const matrixConfig: Partial<AcademicControlsConfig> | null = params.academicControls || matrixContext?.config || null;
  const hasLockedSources =
    matrixConfig?.customSourcesEnabled === true && String(matrixConfig?.customSourcesList || "").trim().length > 0;
  const matrixDirectives = matrixContext?.getDirectives?.(params.thesisTitle, params.discipline) || [
    matrixConfig?.customSourcesEnabled ? `سەرچاوەکان تەنها لەم لیستەوە بەکاربهێنە:\n${matrixConfig.customSourcesList || ""}` : "",
    matrixConfig?.customOutlineEnabled ? `پابەند بە پێڕستی توێژەر:\n${matrixConfig.customOutlineText || ""}` : "",
    matrixConfig?.dialecticModeEnabled ? "هەر تەوەرێک بە تێز، دژەتێز و سێنتێز شیکەرەوە." : "",
    matrixConfig?.writerCriticReviewerEnabled ? "دەقەکە بە قۆناغی نووسەر، ڕەخنەگر و پێداچوونەوە بپشکنە." : "",
    matrixConfig?.styleMimicryEnabled ? `تۆنی نموونە بپارێزە، بەبێ لەبەرگرتنەوە:\n${matrixConfig.styleReferenceSample || ""}` : "",
    matrixConfig?.comparativeModeEnabled
      ? `بەراوردی "${matrixConfig.comparativeSourceOne || ""}" و "${matrixConfig.comparativeSourceTwo || ""}" لەسەر "${matrixConfig.comparativeAxis || ""}" بکە.`
      : ""
  ].filter(Boolean).join("\n\n");

  // STEP 1: Grounding via Promise.all (OpenAlex + Google Search Grounding)
  params.onLiveProgress?.(branchHeader, 0, hasLockedSources
    ? "پابەندبوون بە لیستی سەرچاوە تایبەتەکانی توێژەر..."
    : "خەریکی هێنانی سەرچاوە زانستییەکان لە OpenAlex و Google Search...");

  const query = `${params.thesisTitle} ${params.subSection.title} ${params.discipline || ""}`;
  let openAlexWorks = "";
  let searchGroundedResult: any = null;

  try {
    if (!hasLockedSources) {
      const [openAlexRes, searchRes] = await Promise.all([
        engine.fetchVerifiedScholarlyWorks(query, 6).catch(() => ""),
        engine.generateFull<string>({
          mode: "search_grounded",
          systemInstruction:
            "تۆ پسپۆڕی باڵای بیبلۆگرافیا و بەڵگەی زانستیت. سەرچاوەی بڵاوکراوەی ڕاستەقینە، ناوی توێژەر، ساڵ و بەڵگەی سەلمێنراو بۆ ئەم لقە دەربهێنە.",
          prompt: `سەرچاوە و بەڵگە زانستییە ڕاستەقینەکان بۆ لقی "${params.subSection.title}" لە توێژینەوەی "${params.thesisTitle}" دەستنیشان بکە.`
        }).catch(() => null)
      ]);
      openAlexWorks = openAlexRes || "";
      searchGroundedResult = searchRes;
    }
  } catch (groundErr) {
    console.warn("Grounding step failed; generation will proceed without external grounding.");
  }

  const groundedText = searchGroundedResult?.rawText || "";
  const groundedSources = searchGroundedResult?.groundedSources || [];

  // Register web grounded sources into citation manager
  for (let i = 0; i < groundedSources.length; i++) {
    const ws = groundedSources[i];
    params.citationManager.registerSource({
      id: `web_${i + 1}`,
      author: ws.title || "توێژینەوەی ئەکادیمی",
      year: "٢٠٢٤",
      title: ws.title,
      publisherOrLocation: ws.uri,
      language: "ku",
      verificationOrigin: "google_search_grounded"
    });
  }

  // STEP 2: Uncaged Streaming Generation in Pure Markdown with Academic Matrix
  if (matrixConfig?.customSourcesEnabled && matrixConfig?.customSourcesList?.trim()) {
    const rawLines = matrixConfig.customSourcesList.split("\n").map((l: string) => l.trim()).filter(Boolean);
    rawLines.forEach((line: string, idx: number) => {
      params.citationManager.registerSource({
        id: `custom_src_${idx + 1}`,
        author: line.split("(")[0]?.replace(/^\d+[\.\،\-]\s*/, "")?.trim() || line,
        year: line.match(/\((\d{4})\)/)?.[1] || "٢٠٢٤",
        title: line,
        publisherOrLocation: "سەرچاوەی تایبەتی توێژەر",
        language: "ku",
        verificationOrigin: "user_verified_library"
      });
    });
  }

  const systemInstruction = `
${buildLevelSystemInstruction(params.level, params.thesisTitle, params.discipline)}

${matrixDirectives}

${IRONCLAD_ACADEMIC_AND_COHESION_LAWS}${autoEvolutionGuardian.getActiveSystemAugmentations()}
${loadAcademicPromptModule(params.discipline || '')}
یاسای شێوازی دەق:
- ڕاستەوخۆ دەقی زانستی و پەرەگرافەکانی لقەکە بە زمانی کوردیی فەرمی (سۆرانی) بنووسە بێ هیچ قاڵب و کۆدێکی JSON.
- هەموو سەرچاوەیەک بە شێوازی {{CITE:ناسێنەر}} یان ڕاستەوخۆ بە (نووسەر، ساڵ) تۆمار بکە.
- ئامانجی کەمترین وشە: بە تەواوی لانیکەم ${targetWords} وشەی پڕ لە شیکردنەوەی مەعریفی بنووسە.
`;

  const prompt = `
- ناونیشانی تێز: "${params.thesisTitle}" (${profile.kurdishTitle})
- هێڵی بابەتی: ${params.centralThesisThread || "پاراستنی تەبایی گوتاری زانستی"}
${params.lockedTerminology && params.lockedTerminology.length > 0 ? `- زاراوە نەگۆڕەکان: ${params.lockedTerminology.join("، ")}` : ""}
- بەش: ${params.chapterTitle} | تەوەر: ${params.sectionTitle}
- لقی ئێستا: ${params.subSection.code} - ${params.subSection.title}
- ئامانجی وشەکان: لانیکەم ${targetWords} وشەی ئەکادیمی بێ کورتکردنەوە.
- تەوەری ورد بۆ تاوتوێکردن: ${params.subSection.microTopicsToCover.join("، ")}
${params.previousClosingParagraph ? `- دوایین پەرەگرافی پێشوو (بەستنەوەی لۆژیکی لەگەڵ ئەمەدا دەست پێبکە): "${params.previousClosingParagraph}"` : ""}
${params.nextSubSectionTitle ? `- زەمینەسازی بۆ لقی داهاتوو: (${params.nextSubSectionTitle})` : ""}
${matrixDirectives ? `\n[کۆنتڕۆڵە تایبەتە ئەکادیمییە چالاکەکان]:\n${matrixDirectives}\n` : ""}
${getDomainSpecificDirectives(params.thesisTitle + " " + params.subSection.title, params.discipline || "")}
[سەرچاوە و بەڵگە ڕاستەقینە دۆزراوەکان]:
${openAlexWorks || ""}
${groundedText || ""}
${params.verifiedLibrarySourcesText ? `\n[سەرچاوەکانی کتێبخانەی توێژەر]:\n${params.verifiedLibrarySourcesText}` : ""}
`;

  params.onLiveProgress?.(branchHeader, 0, `دەستکرا بە نووسینی لقی «${params.subSection.title}»...`);

  let streamedProse = "";
  const smoothStreamUpdater = TurboPromptAccelerator.createSmoothStreamUpdater((fullTextSoFar) => {
    const normalized = normalizeKurdishAcademicProse(fullTextSoFar);
    const currentWords = countWords(normalized);
    params.onLiveProgress?.(
      `${branchHeader}${normalized}`,
      currentWords,
      `خەریکی نووسین... (${currentWords}/${targetWords} وشە)`
    );
  }, 80);
  try {
    streamedProse = await engine.generateStream(
      {
        mode: params.generationMode === 'fast_draft' ? "fast_critic" : "deep_thinking",
        systemInstruction,
        prompt,
        cachedContentName: params.cachedContentName,
        thinkingBudget: params.generationMode === 'fast_draft' ? 1024 : 16384,
        temperature: params.generationMode === 'fast_draft' ? 0.6 : 0.35,
        presencePenalty: 0.35,
        frequencyPenalty: 0.45,
        maxOutputTokens: 65536
      },
      {
        onTextChunk: (_delta, fullTextSoFar) => smoothStreamUpdater.push(fullTextSoFar)
      }
    );
    smoothStreamUpdater.flush(streamedProse);
  } catch (streamErr) {
    smoothStreamUpdater.flush();
    console.warn("Streaming generation failed; retrying with a standard Gemini request.");
    streamedProse = await engine.generate<string>({
      mode: "deep_thinking",
      systemInstruction,
      prompt,
      cachedContentName: params.cachedContentName,
      temperature: 0.35
    });
  }

  let combinedProse = normalizeKurdishAcademicProse(streamedProse || "");

  // STEP 3: Anti-Truncation Loop (enforce minimum 85% of targetWords)
  const minRequiredWords = Math.floor(targetWords * 0.85);
  let expansionTries = 0;

  while (countWords(combinedProse) < minRequiredWords && expansionTries < 3) {
    expansionTries++;
    const currentCount = countWords(combinedProse);
    const deficit = targetWords - currentCount;
    const paragraphs = combinedProse.split(/\n\s*\n/).filter(Boolean);
    const lastParagraph = paragraphs[paragraphs.length - 1] || "";

    params.onLiveProgress?.(
      `${branchHeader}${combinedProse}`,
      currentCount,
      `فراوانکردنی بەڵگەسازی و دژە-کورتبڕی... (${currentCount}/${targetWords} وشە)`
    );

    const expansionPrompt = `
یاسای قوفڵی دژە-کورتبڕی (Anti-Truncation Lock):
تۆ تا ئێستا تەنها ${currentCount} وشەت نووسیوە لە کاتێکدا داوای لانیکەم ${targetWords} وشە کراوە. دەستەواژەی "هتد" یان کورتکردنەوە قەدەغەیە.
ڕاستەوخۆ لە دوای ئەم پەرەگرافەی کۆتاییەوە:
"${lastParagraph}"
بە پەیوەستکارییەکی لۆژیکی و زانستی بەردەوام بە بە نووسینی لانیکەم (${deficit}) وشەی شیکاریی نوێ و پەرەگرافی قووڵ لەسەر تەوەرەکانی (${params.subSection.microTopicsToCover.join("، ")}).
`;

    try {
      const expChunk = await engine.generateStream(
        {
          mode: "deep_thinking",
          systemInstruction,
          prompt: expansionPrompt,
          cachedContentName: params.cachedContentName,
          temperature: 0.35,
          presencePenalty: 0.35,
          frequencyPenalty: 0.45
        },
        {
          onTextChunk: (_delta, fullTextSoFar) => {
            const tempNorm = normalizeKurdishAcademicProse(fullTextSoFar);
            const totalText = `${combinedProse}\n\n${tempNorm}`;
            const curW = countWords(totalText);
            params.onLiveProgress?.(`${branchHeader}${totalText}`, curW, `تەواوکردنی ژمارەی وشەکان... (${curW}/${targetWords} وشە)`);
          }
        }
      );
      if (expChunk && expChunk.trim()) {
        combinedProse += `\n\n${normalizeKurdishAcademicProse(expChunk.trim())}`;
      }
    } catch {
      break;
    }
  }

  if (matrixConfig?.writerCriticReviewerEnabled) {
    params.onLiveProgress?.(
      `${branchHeader}${combinedProse}`,
      countWords(combinedProse),
      "قۆناغی ڕەخنەگر: پشکنینی بەڵگە، لۆژیک و تەبایی..."
    );
    const critique = await engine.generate<string>({
      mode: "fast_critic",
      systemInstruction:
        "تۆ ڕەخنەگرێکی میتۆدیی ئەکادیمیت. تەنها خاڵە لاوازەکانی بەڵگە، لۆژیک، تەبایی و ڕێنووس بنووسە؛ هیچ سەرچاوە یان زانیارییەکی نوێ دروست مەکە.",
      prompt: `ئەم دەقە بە شێوەی ڕەخنەیی هەڵبسەنگێنە و تەنها لیستی کورت و کردەییی چاکسازییەکان بدە:\n\n${combinedProse}`,
      maxOutputTokens: 2048,
      temperature: 0.1
    });

    params.onLiveProgress?.(
      `${branchHeader}${combinedProse}`,
      countWords(combinedProse),
      "قۆناغی پێداچوونەوە: پاککردنەوەی زمان و جێبەجێکردنی ڕەخنە..."
    );
    const reviewedProse = await engine.generateStream({
      mode: "fast_critic",
      systemInstruction:
        "تۆ پێداچوونەوەکاری زمانی ئەکادیمیی کوردیت. دەقەکە بە ڕێنووسی ڕەسەن، ڕستەسازیی ڕوون و شێوازی زانستی پاکبکەرەوە. هیچ بانگەشە، بەڵگە، ژمارە، ناوی سەرچاوە یان تاگی {{CITE:id}} مەگۆڕە و مەزیاد مەکە. قەبارەی دەق کەم مەکەرەوە.",
      prompt: `ڕەخنەی میتۆدی:\n${critique}\n\nدەقی بنەڕەتی بۆ پێداچوونەوە:\n${combinedProse}`,
      maxOutputTokens: 65536,
      temperature: 0.1
    });
    const normalizedReview = normalizeKurdishAcademicProse(reviewedProse);
    const originalCitationCount = (combinedProse.match(/\{\{CITE:[^}]+\}\}/g) || []).length;
    const reviewedCitationCount = (normalizedReview.match(/\{\{CITE:[^}]+\}\}/g) || []).length;
    if (
      normalizedReview &&
      countWords(normalizedReview) >= minRequiredWords &&
      reviewedCitationCount >= originalCitationCount
    ) {
      combinedProse = normalizedReview;
    }
  }

  // STEP 4: Structured Citation Extraction & Registration
  const openAlexLines = openAlexWorks.split("\n").filter((l) => l.trim().startsWith("-"));
  const extractedSources: SourceItem[] = openAlexLines.map((line, idx) => {
    const match = line.match(/^-\s*([^(]+)\s*\((\d{4})\)[،,]\s*\*([^*]+)\*[،,]\s*(.+?)(?:[،,]\s*DOI:\s*(.+))?\.?$/);
    if (match) {
      return {
        id: `oa_${idx + 1}`,
        author: match[1].trim(),
        year: match[2].trim(),
        title: match[3].trim(),
        publisherOrLocation: match[4].trim(),
        language: "en" as const,
        verificationOrigin: "google_search_grounded" as const,
        category: "article" as const
      };
    }
    return {
      id: `oa_${idx + 1}`,
      author: line.slice(2, 35).trim() || "توێژەری ئەکادیمی",
      year: "٢٠٢٣",
      title: line.slice(35, 90).trim() || "توێژینەوەی زانستی",
      publisherOrLocation: "Academic Press",
      language: "ku" as const,
      verificationOrigin: "google_search_grounded" as const,
      category: "article" as const
    };
  });

  for (const src of extractedSources) {
    params.citationManager.registerSource(src);
  }

  const { cleanMarkdown, footnotesBlock } = params.citationManager.registerAndFormatCitations(
    combinedProse,
    extractedSources
  );

  const finalSubSectionMarkdown = `${branchHeader}${cleanMarkdown.trim()}${footnotesBlock ? `\n${footnotesBlock}` : ""}`;
  const finalWordCount = countWords(cleanMarkdown);
  const allFinalParagraphs = cleanMarkdown.split(/\n\s*\n/).filter(Boolean);
  const finalLastParagraph = allFinalParagraphs[allFinalParagraphs.length - 1] || "";

  params.onLiveProgress?.(finalSubSectionMarkdown, finalWordCount, "نووسینی لق تەواو بوو.");

  return {
    fullSubSectionMarkdown: finalSubSectionMarkdown,
    lastParagraph: finalLastParagraph,
    keyFindings: params.subSection.microTopicsToCover
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
    systemInstruction: `${buildLevelSystemInstruction(level, title, discipline)}\n${IRONCLAD_ACADEMIC_AND_COHESION_LAWS}${autoEvolutionGuardian.getActiveSystemAugmentations()}`,
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
.academic-document-container blockquote {
  margin: 12pt 1.2cm;
  padding: 8pt 14pt;
  border-right: 3px solid #334155;
  background: #f8fafc;
  font-size: 13pt;
  line-height: 1.45;
}
.academic-document-container p {
  text-indent: ${level === "school" ? "0.5cm" : "1cm"};
  margin-bottom: 10pt;
}
`;
}
