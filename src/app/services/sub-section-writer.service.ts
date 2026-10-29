import { Injectable, inject, signal } from '@angular/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AppNotificationsService } from '../core/app.notifications';
import { AcademicCitationManager, AcademicSource } from './academic-citation-manager.service';
import { countKurdishWords } from './data';
import { LEVEL_PROFILES, AcademicLevel, LevelCalibrationProfile } from '../models/level-profiles';

export { LEVEL_PROFILES };
export type { AcademicLevel, LevelCalibrationProfile };

interface ModelConfig {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: Schema;
  temperature?: number;
  thinkingConfig?: { thinkingBudget?: number };
}

export function resolveLevelCalibration(level?: string): LevelCalibrationProfile {
  if (!level) return LEVEL_PROFILES.phd;
  const l = level.toLowerCase();
  if (l === 'school' || l.includes('قوتابخانە') || l.includes('ئامادەیی') || l.includes('بنەڕەتی')) {
    return LEVEL_PROFILES.school;
  }
  if (l === 'bachelor' || l.includes('بەکالۆریۆس') || l.includes('دەرچوون')) {
    return LEVEL_PROFILES.bachelor;
  }
  if (l === 'master' || l.includes('ماستەر')) {
    return LEVEL_PROFILES.master;
  }
  return LEVEL_PROFILES.phd;
}

export interface SubSectionWriterContext {
  thesisTitle: string;
  degreeLevel?: 'قوتابخانە' | 'بەکالۆریۆس' | 'ماستەر' | 'دکتۆرا' | AcademicLevel | string;
  academicLevel?: AcademicLevel;
  methodologySummary: string;
  chapterTitle: string;
  sectionTitle: string;
  currentSubSection: {
    code: string;
    title: string;
    targetWords: number;
  };
  previousSubSection?: {
    code: string;
    title: string;
    executiveSummary: string;
    lastParagraph: string;
  };
  nextSubSection?: {
    code: string;
    title: string;
  };
  customInstructions?: string;
}

export interface SubSectionGeneratedOutput {
  academicContentMarkdown: string;
  executiveSummaryForNext: string;
  closingParagraph: string;
  keyConceptsCovered: string[];
  suggestedCitations: string[];
}

export const subSectionWriterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    academicContentMarkdown: {
      type: Type.STRING,
      description: 'دەقی تەواوی زانستیی لقەکە بە زمانی کوردیی ئەکادیمی بەپێی ئاستەکە.'
    },
    executiveSummaryForNext: {
      type: Type.STRING,
      description: 'پوختەیەکی چڕی ئەوەی لەم لقەدا شیکرایەوە بۆ لقی دوای خۆی.'
    },
    closingParagraph: {
      type: Type.STRING,
      description: 'دوایین پەرەگرافی دەقەکە بۆ دروستکردنی پردی لۆژیکی بۆ لقی داهاتوو.'
    },
    keyConceptsCovered: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'لیستی چەمک و زاراوە شیکراوەکانی ناو ئەم لقە.'
    },
    suggestedCitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'لیستی سەرچاوە ڕاستەقینەکان کە ئاماژەیان پێکراوە.'
    }
  },
  required: [
    'academicContentMarkdown',
    'executiveSummaryForNext',
    'closingParagraph',
    'keyConceptsCovered',
    'suggestedCitations'
  ]
};

export const SUB_SECTION_WRITER_SYSTEM_PROMPT = `
تۆ توێژەر و پڕۆفیسۆری باڵای زانستیت بۆ نووسینی لقەکانی تێز و توێژینەوەی ئەکادیمی بە زمانی کوردی (سۆرانی).
یاساکان:
١. نووسینی ١٠٠٪ داینامیک: نابێت هیچ ناوەڕۆک یان سەردێڕێکی قاڵبی و پێشوەختە هەبێت؛ هەموو شتێک دەبێت بە شێوەیەکی تایبەتمەند لە ناوەڕۆکی بابەتەکە و ناونیشانەکەوە دەربهێنرێت.
٢. گرێدانی مەعریفی لەگەڵ لقی پێشوو و دیاریکردنی سنووری لقی داهاتوو.
٣. پاراستنی زمانی بابەتی، ڕەسەنایەتیی سەرچاوەکان و دوورکەوتنەوە لە زانیاری و سەرچاوەی خەیاڵی (Zero Hallucination).
`;

function getResolvedApiKeys(): string[] {
  const keys: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('MAM_GEMINI_API_KEYS') || '';
      keys.push(...stored.split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean));
    } catch {}
  }
  if (typeof process !== 'undefined' && process.env && process.env['GEMINI_API_KEY']) {
    keys.push(...process.env['GEMINI_API_KEY'].split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean));
  }
  return Array.from(new Set(keys));
}

export function buildSubSectionPrompt(ctx: SubSectionWriterContext): string {
  const profile = resolveLevelCalibration(ctx.academicLevel || ctx.degreeLevel);

  return `
زانیارییەکانی چوارچێوەی گشتی:
- ناونیشانی توێژینەوە: "${ctx.thesisTitle}"
- ئاستی ئەکادیمی: ${profile.kurdishTitle} (${profile.level})
- میتۆدۆلۆژیا: ${ctx.methodologySummary}
- بەش: ${ctx.chapterTitle} | تەوەر: ${ctx.sectionTitle}
- لق: ${ctx.currentSubSection.code} - ${ctx.currentSubSection.title}
- ئامانجی وشە: نزیکەی ${ctx.currentSubSection.targetWords} وشە.
- شێوازی سەرچاوە: ${profile.citationMode}
${ctx.customInstructions ? `- ڕێنمایی تایبەت: ${ctx.customInstructions}` : ''}

کالیبراسیۆنی ئاست:
${profile.personaPrompt}
${profile.vocabularyAndStyleRules}
${profile.strictlyForbiddenRules}

${ctx.previousSubSection ? `[لقی پێشوو: ${ctx.previousSubSection.code} - ${ctx.previousSubSection.title}]\nپوختە: ${ctx.previousSubSection.executiveSummary}\nدواپەرەگرافی پێشوو: "${ctx.previousSubSection.lastParagraph}"` : ''}
${ctx.nextSubSection ? `[لقی داهاتوو: ${ctx.nextSubSection.code} - ${ctx.nextSubSection.title}]` : ''}
`;
}

export async function generateSubSectionContent(
  ctx: SubSectionWriterContext
): Promise<SubSectionGeneratedOutput> {
  const keys = getResolvedApiKeys();
  if (keys.length === 0) {
    throw new Error('تکایە کلیلی API دابین بکە بۆ ئەوەی ناوەڕۆکی لقەکە بە مۆدێلی ژیریی دەستکرد بنووسرێت.');
  }

  const prompt = buildSubSectionPrompt(ctx);
  const profile = resolveLevelCalibration(ctx.academicLevel || ctx.degreeLevel);
  const isDeepLevel = profile.level === 'master' || profile.level === 'phd';

  let lastError: unknown = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[attempt];
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const systemInstruction = `
${SUB_SECTION_WRITER_SYSTEM_PROMPT}
ڕێنمایی کالیبراسیۆنی ئاستی ${profile.kurdishTitle}:
${profile.personaPrompt}
${profile.vocabularyAndStyleRules}
${profile.strictlyForbiddenRules}
`;

      const config: ModelConfig = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: subSectionWriterSchema,
        temperature: 0.35
      };

      if (isDeepLevel) {
        config.thinkingConfig = { thinkingBudget: 8192 };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config
      });

      if (response.text) {
        return JSON.parse(response.text) as SubSectionGeneratedOutput;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`نووسینی لق بە کلیلی ${attempt + 1} سەرکەوتوو نەبوو، خولانەوە بۆ کلیلی دواتر...`, err);
    }
  }

  throw new Error(`نەتوانرا لقی «${ctx.currentSubSection.title}» بە شێوەی داینامیک بنووسرێت: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export interface LongSubSectionMultiPassParams {
  thesisTitle: string;
  chapterTitle: string;
  sectionTitle: string;
  subSectionCode: string;
  subSectionTitle: string;
  totalTargetWords?: number;
  previousSubSectionLastParagraph?: string;
  nextSubSectionTitle?: string;
  citationManager: AcademicCitationManager;
  citationStyle?: 'numbered_footnotes' | 'apa_in_text' | 'simple_list' | 'standard_footnotes' | 'scholarly_multilingual_footnotes';
  customInstructions?: string;
  degreeLevel?: 'قوتابخانە' | 'بەکالۆریۆس' | 'ماستەر' | 'دکتۆرا' | AcademicLevel | string;
  academicLevel?: AcademicLevel;
  methodologySummary?: string;
  onPassProgress?: (passIndex: number, totalPasses: number, currentWords: number) => void;
}

export interface LongSubSectionMultiPassResult {
  fullMarkdown: string;
  closingParagraphForNextSubSection: string;
  totalWords: number;
  passesCount: number;
  footnotes: string[];
  keyConcepts: string[];
}

export async function generateLongSubSectionMultiPass(
  params: LongSubSectionMultiPassParams
): Promise<LongSubSectionMultiPassResult> {
  const profile = resolveLevelCalibration(params.academicLevel || params.degreeLevel);
  const totalTargetWords = Math.max(300, params.totalTargetWords || (profile.level === 'school' ? 1000 : 4200));
  const citationStyle = (params.citationStyle as any) || (profile.citationMode === 'simple_list' ? 'simple_list' : 'numbered_footnotes');
  const degreeLevel = params.degreeLevel || profile.level;
  const methodologySummary = params.methodologySummary || 'شیکاریی زانستی و میتۆدۆلۆژیای پەسەندکراوی توێژینەوە';

  const passTargetSize = profile.structure.maxWordsPerSinglePass || 1400;
  const numPasses = totalTargetWords <= passTargetSize + 200 ? 1 : Math.max(2, Math.ceil(totalTargetWords / passTargetSize));
  const wordsPerPass = Math.round(totalTargetWords / numPasses);

  const passTexts: string[] = [];
  const allFootnotes: string[] = [];
  const allConcepts: Set<string> = new Set();

  let bridgeLastParagraph = params.previousSubSectionLastParagraph?.trim() || '';
  let finalClosingParagraph = '';

  for (let p = 1; p <= numPasses; p++) {
    const isFirstPass = p === 1;
    const isLastPass = p === numPasses;

    const passMission = isFirstPass
      ? `قۆناغی یەکەم (١ لە ${numPasses}): دەستپێکی مەعریفی و کێشەی زانستیی لقەکە (${profile.kurdishTitle}).`
      : !isLastPass
      ? `قۆناغی ناوەندی (${p} لە ${numPasses}): شیکاریی قووڵ، سەرچاوەکان و شیکردنەوەی بەڵگەکان.`
      : `قۆناغی کۆتایی (${p} لە ${numPasses}): سەنتێز، گەیشتن بە دەرەنجام و زەمینەسازی بۆ لقی داهاتوو.`;

    const passSubTitle = isFirstPass ? params.subSectionTitle : `${params.subSectionTitle} — بەشی ${p}`;

    const context: SubSectionWriterContext = {
      thesisTitle: params.thesisTitle,
      degreeLevel,
      academicLevel: profile.level,
      methodologySummary,
      chapterTitle: params.chapterTitle,
      sectionTitle: params.sectionTitle,
      currentSubSection: {
        code: `${params.subSectionCode}${isFirstPass ? '' : ` (${p})`}`,
        title: passSubTitle,
        targetWords: wordsPerPass
      },
      previousSubSection: bridgeLastParagraph
        ? {
            code: `${params.subSectionCode}`,
            title: isFirstPass ? 'لقی پێشوو' : `قۆناغی پێشوو (${p - 1})`,
            executiveSummary: `شیکاریی پێشوو`,
            lastParagraph: bridgeLastParagraph
          }
        : undefined,
      nextSubSection: isLastPass && params.nextSubSectionTitle
        ? { code: '', title: params.nextSubSectionTitle }
        : undefined,
      customInstructions: `${params.customInstructions || ''}\n${passMission}`
    };

    const passOutput = await generateSubSectionContent(context);
    const rawMarkdown = passOutput.academicContentMarkdown.trim();
    const sources: AcademicSource[] = (passOutput.suggestedCitations || []).map((citationStr, idx) =>
      params.citationManager.parseCitationStringToAcademicSource(citationStr, idx + (p * 10))
    );

    const { processedMarkdown, sectionFootnotes } = params.citationManager.processTextAndRegisterSources(
      rawMarkdown,
      `${params.subSectionCode}.${p}`,
      sources,
      citationStyle
    );

    let cleanedPassText = processedMarkdown;
    if (!isFirstPass) {
      cleanedPassText = cleanedPassText.replace(/^###\s+.*$/m, '').trim();
    }

    passTexts.push(cleanedPassText);
    allFootnotes.push(...sectionFootnotes);
    (passOutput.keyConceptsCovered || []).forEach(k => allConcepts.add(k));

    bridgeLastParagraph = passOutput.closingParagraph?.trim() || cleanedPassText.split('\n\n').pop() || '';
    if (isLastPass) {
      finalClosingParagraph = passOutput.closingParagraph?.trim() || bridgeLastParagraph;
    }

    params.onPassProgress?.(p, numPasses, countKurdishWords(passTexts.join('\n\n')));
  }

  const fullMarkdown = passTexts.join('\n\n');
  const totalWords = countKurdishWords(fullMarkdown);

  return {
    fullMarkdown,
    closingParagraphForNextSubSection: finalClosingParagraph,
    totalWords,
    passesCount: numPasses,
    footnotes: allFootnotes,
    keyConcepts: Array.from(allConcepts)
  };
}

export async function runThesisWritingPipeline(targetLevel: AcademicLevel = 'phd'): Promise<{
  subSection1: LongSubSectionMultiPassResult;
  subSection2: LongSubSectionMultiPassResult;
  finalBibliography: string;
}> {
  const profile = LEVEL_PROFILES[targetLevel] || LEVEL_PROFILES.phd;
  const citationManager = new AcademicCitationManager();
  const targetWords = profile.level === 'school' ? 800 : profile.level === 'bachelor' ? 1200 : profile.level === 'master' ? 2600 : 4200;

  const subSection1 = await generateLongSubSectionMultiPass({
    thesisTitle: 'توێژینەوەی زانستی و ئەکادیمی',
    chapterTitle: 'بەشی یەکەم: چوارچێوەی تیۆری',
    sectionTitle: 'تەوەری یەکەم: بنەما سەرەکییەکان',
    subSectionCode: '١.١.١',
    subSectionTitle: 'چەمکسازی و بنەما تیۆرییەکان',
    totalTargetWords: targetWords,
    academicLevel: profile.level,
    citationManager,
    citationStyle: (profile.citationMode === 'simple_list' ? 'simple_list' : 'numbered_footnotes') as any
  });

  const subSection2 = await generateLongSubSectionMultiPass({
    thesisTitle: 'توێژینەوەی زانستی و ئەکادیمی',
    chapterTitle: 'بەشی یەکەم: چوارچێوەی تیۆری',
    sectionTitle: 'تەوەری یەکەم: بنەما سەرەکییەکان',
    subSectionCode: '١.١.٢',
    subSectionTitle: 'شیکردنەوەی چەمکەکان و پێداچوونەوەی ئەدەبیات',
    totalTargetWords: targetWords,
    academicLevel: profile.level,
    previousSubSectionLastParagraph: subSection1.closingParagraphForNextSubSection,
    citationManager,
    citationStyle: (profile.citationMode === 'simple_list' ? 'simple_list' : 'numbered_footnotes') as any
  });

  const finalBibliography = citationManager.generateFinalBibliographyMarkdown();

  return { subSection1, subSection2, finalBibliography };
}

@Injectable({
  providedIn: 'root'
})
export class SubSectionWriterService {
  private notifications = inject(AppNotificationsService);
  public isWriting = signal<boolean>(false);

  public async writeSingleSubSection(ctx: SubSectionWriterContext): Promise<SubSectionGeneratedOutput> {
    this.isWriting.set(true);
    try {
      return await generateSubSectionContent(ctx);
    } catch (err: any) {
      this.notifications.showWarning('کێشەی نووسین', err?.message || 'هەڵە لە نووسینی لقەکەدا');
      throw err;
    } finally {
      this.isWriting.set(false);
    }
  }

  public async writeAcademicSubSection(ctx: SubSectionWriterContext): Promise<SubSectionGeneratedOutput> {
    return this.writeSingleSubSection(ctx);
  }

  public async runThesisWritingPipeline(targetLevel: AcademicLevel = 'phd'): Promise<{
    subSection1: LongSubSectionMultiPassResult;
    subSection2: LongSubSectionMultiPassResult;
    finalBibliography: string;
  }> {
    return runThesisWritingPipeline(targetLevel);
  }
}
