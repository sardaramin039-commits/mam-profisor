// BlueprintAndOutlineAgent.ts
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Injectable } from '@angular/core';
import { AcademicLevel, LEVEL_PROFILES } from './LevelProfiles';

export interface SubSectionPlan {
  code: string;
  title: string;
  targetWords: number;
  microTopicsToCover: string[];
}

export interface SectionPlan {
  title: string;
  targetWords: number;
  subSections: SubSectionPlan[];
}

export interface ChapterPlan {
  chapterType: 'intro' | 'core' | 'conclusion';
  title: string;
  targetWords: number;
  sections: SectionPlan[];
}

export interface AcademicBlueprint {
  level: AcademicLevel;
  titleAnalysis: {
    coreSubject: string;
    primaryDimension: string;
    secondaryDimension: string;
    recommendedApproach: string;
  };
  frontMatterAndIntro: {
    dedicationAndAck: string;
    abstractKurdish: string;
    abstractEnglish: string;
    fullIntroductionMarkdown: string;
  };
  chapters: ChapterPlan[];
}

export const blueprintSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titleAnalysis: {
      type: Type.OBJECT,
      description: 'شیکاریی قوڵ و ڕەهەندەکانی ناونیشانی تێز/توێژینەوە',
      properties: {
        coreSubject: { type: Type.STRING, description: 'بابەتی ناوەکی یان کەرەستەی سەرەکی' },
        primaryDimension: { type: Type.STRING, description: 'ڕەهەندی یەکەم' },
        secondaryDimension: { type: Type.STRING, description: 'ڕەهەندی دووەم' },
        recommendedApproach: { type: Type.STRING, description: 'میتۆد و ڕێبازی پێشنیارکراو' }
      },
      required: ['coreSubject', 'primaryDimension', 'secondaryDimension', 'recommendedApproach']
    },
    frontMatterAndIntro: {
      type: Type.OBJECT,
      description: 'ڕێوڕەسمی سەرەتایی، پوختە و دەقی تەواوی پێشەکی',
      properties: {
        dedicationAndAck: { type: Type.STRING, description: 'بەخشین و سوپاسنامەی فەرمی بە کوردی' },
        abstractKurdish: { type: Type.STRING, description: 'پوختەی ئەکادیمی بە کوردی' },
        abstractEnglish: { type: Type.STRING, description: 'پوختەی ئەکادیمی بە ئینگلیزی' },
        fullIntroductionMarkdown: { type: Type.STRING, description: 'دەقی تێروتەسەلی پێشەکی/دەروازە' }
      },
      required: ['dedicationAndAck', 'abstractKurdish', 'abstractEnglish', 'fullIntroductionMarkdown']
    },
    chapters: {
      type: Type.ARRAY,
      description: 'پێڕست و بەشە سەرەکی و لقە کالیبرەکراوەکان',
      items: {
        type: Type.OBJECT,
        properties: {
          chapterType: { type: Type.STRING, enum: ['intro', 'core', 'conclusion'] },
          title: { type: Type.STRING },
          targetWords: { type: Type.INTEGER },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                targetWords: { type: Type.INTEGER },
                subSections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      title: { type: Type.STRING },
                      targetWords: { type: Type.INTEGER },
                      microTopicsToCover: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'تەوەرە وردەکانی ئەم لقە بۆ ڕێگری لە دووبارەبوونەوە'
                      }
                    },
                    required: ['code', 'title', 'targetWords', 'microTopicsToCover']
                  }
                }
              },
              required: ['title', 'targetWords', 'subSections']
            }
          }
        },
        required: ['chapterType', 'title', 'targetWords', 'sections']
      }
    }
  },
  required: ['titleAnalysis', 'frontMatterAndIntro', 'chapters']
};

function resolveApiKeysList(): string[] {
  const keys: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('MAM_GEMINI_API_KEYS') || '';
      keys.push(...stored.split(/[\s,;]+/).map(k => k.trim()).filter(Boolean));
    } catch {}
  }
  if (typeof process !== 'undefined' && process.env && process.env['GEMINI_API_KEY']) {
    keys.push(...process.env['GEMINI_API_KEY'].split(/[\s,;]+/).map(k => k.trim()).filter(Boolean));
  }
  return Array.from(new Set(keys));
}

interface BlueprintGenConfig {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: Schema;
  temperature?: number;
  thinkingConfig?: { thinkingBudget?: number };
}

/**
 * دروستکردنی پەیکەر و نەخشەی ئەندازیاریی تێز بەپێی کالیبراسیۆنی وردی ئاستە ئەکادیمییەکان بە جیمینی
 */
export async function buildLevelCalibratedBlueprint(
  title: string,
  level: AcademicLevel = 'phd'
): Promise<AcademicBlueprint> {
  const profile = LEVEL_PROFILES[level] || LEVEL_PROFILES.phd;
  const {
    totalWords,
    introWords,
    conclusionWords,
    coreChaptersCount,
    sectionsPerChapter,
    subSectionsPerSection
  } = profile.structure;

  const remainingCoreWords = totalWords - introWords - conclusionWords;
  const wordsPerCoreChapter = Math.round(remainingCoreWords / Math.max(1, coreChaptersCount));
  const wordsPerSection = Math.round(wordsPerCoreChapter / Math.max(1, sectionsPerChapter));
  const wordsPerSubSection = Math.round(wordsPerSection / Math.max(1, subSectionsPerSection));

  const systemInstruction = `
تۆ پڕۆفیسۆر و تەلارسازی باڵای پەیکەری تێزی ئەکادیمیت بە زمانی کوردی (سۆرانی).
ئەرکی تۆ دروستکردنی نەخشەی ئەندازیاریی تێزە (Academic Blueprint) کە هەموو بەش و تەوەر و لقەکان بەپێی کالیبراسیۆنی زانستیی ئاستی دیاریکراو دابڕێژێت.
قەدەغەکردنی سەردێڕی قاڵبی: نابێت هیچ ناوێکی گشتی یان قاڵبی هەبێت؛ ١٠٠٪ی ناو و لقەکان بە شێوەی داینامیکی بەپێی تایبەتمەندیی بابەتەکە دابڕێژە.

پڕۆفایلی کەسایەتیی ئاستەکە:
${profile.personaPrompt}

یاساکانی زمان و شێواز:
${profile.vocabularyAndStyleRules}

یاسا قەدەغەکراوە توندەکان:
${profile.strictlyForbiddenRules}

یاساکانی دابەشکردنی وشەکان:
- کۆی گشتیی وشەکان: ${totalWords.toLocaleString()} وشە
- دەروازە / پێشەکی: نزیکەی ${introWords.toLocaleString()} وشە
- ئەنجامەکان: نزیکەی ${conclusionWords.toLocaleString()} وشە
- ژمارەی بەشە سەرەکییەکان: ${coreChaptersCount} بەش
- تەوەر لە هەر بەشێکدا: ${sectionsPerChapter} تەوەر
- لق لە هەر تەوەرێکدا: ${subSectionsPerSection} لق
- وشەی هەر لقێک: نزیکەی ${wordsPerSubSection.toLocaleString()} وشە
`;

  const userPrompt = `
تکایە نەخشەی ئەندازیاریی ئەکادیمی (Academic Blueprint) بۆ ئەم ناونیشانە دروست بکە:
ناونیشانی توێژینەوە: "${title}"
ئاستی خوێندن: ${profile.kurdishTitle} (${level})
پێویستە وەڵامەکەت لە قاڵبی JSONدا بێت بەپێی Schemای دیاریکراو بەبێ هیچ دەقێکی قاڵبی و جێگیر.
`;

  const keys = resolveApiKeysList();
  if (keys.length === 0) {
    throw new Error('تکایە لانیکەم یەک کلیلی Gemini API دابین بکە بۆ دروستکردنی پەیکەری ئەکادیمی.');
  }

  let lastError: unknown = null;
  const isDeepLevel = level === 'master' || level === 'phd';

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const config: BlueprintGenConfig = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: blueprintSchema,
        temperature: 0.35
      };

      if (isDeepLevel) {
        config.thinkingConfig = { thinkingBudget: 8192 };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config
      });

      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText) as AcademicBlueprint;

      if (parsed && parsed.titleAnalysis && parsed.chapters) {
        parsed.level = level;
        calibrateBlueprintWordCounts(parsed, profile);
        return parsed;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`هەوڵی کلیلی ${i + 1} سەرکەوتوو نەبوو، خولانەوە بۆ کلیلی دواتر...`, err);
    }
  }

  throw new Error(`شکست لە داڕشتنی پەیکەری ئەکادیمی بە شێوەی داینامیک: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function calibrateBlueprintWordCounts(
  blueprint: AcademicBlueprint,
  profile: (typeof LEVEL_PROFILES)[AcademicLevel]
): void {
  const { introWords, conclusionWords, coreChaptersCount, sectionsPerChapter, subSectionsPerSection, totalWords } = profile.structure;
  const remainingCoreWords = totalWords - introWords - conclusionWords;
  const wordsPerCoreChapter = Math.round(remainingCoreWords / Math.max(1, coreChaptersCount));
  const wordsPerSection = Math.round(wordsPerCoreChapter / Math.max(1, sectionsPerChapter));
  const wordsPerSubSection = Math.round(wordsPerSection / Math.max(1, subSectionsPerSection));

  blueprint.chapters.forEach(ch => {
    if (ch.chapterType === 'intro') {
      ch.targetWords = introWords;
    } else if (ch.chapterType === 'conclusion') {
      ch.targetWords = conclusionWords;
    } else {
      ch.targetWords = wordsPerCoreChapter;
    }

    if (Array.isArray(ch.sections)) {
      ch.sections.forEach(sec => {
        sec.targetWords = ch.chapterType === 'core' ? wordsPerSection : Math.round(ch.targetWords / Math.max(1, ch.sections.length));
        if (Array.isArray(sec.subSections)) {
          sec.subSections.forEach(sub => {
            sub.targetWords = ch.chapterType === 'core' ? wordsPerSubSection : Math.round(sec.targetWords / Math.max(1, sec.subSections.length));
          });
        }
      });
    }
  });
}

@Injectable({
  providedIn: 'root'
})
export class BlueprintAndOutlineAgentService {
  public async generateBlueprint(title: string, level: AcademicLevel): Promise<AcademicBlueprint> {
    return buildLevelCalibratedBlueprint(title, level);
  }
}
