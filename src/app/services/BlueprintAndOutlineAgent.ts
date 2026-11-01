// BlueprintAndOutlineAgent.ts
import { Injectable } from '@angular/core';
import { AcademicLevel, LEVEL_PROFILES } from './LevelProfiles';

export type Schema = Record<string, any>;
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

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

/**
 * دروستکردنی پەیکەر و نەخشەی ئەندازیاریی تێز بەپێی کالیبراسیۆنی وردی ئاستە ئەکادیمییەکان بە جیمینی
 */
export async function buildLevelCalibratedBlueprint(
  title: string,
  level: AcademicLevel = 'phd'
): Promise<AcademicBlueprint> {
  const profile = LEVEL_PROFILES[level] || LEVEL_PROFILES.phd;

  try {
    const resp = await fetch('/api/gemini/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, level })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.blueprint) {
        const bp = data.blueprint as AcademicBlueprint;
        bp.level = level;
        calibrateBlueprintWordCounts(bp, profile);
        return bp;
      }
    }
  } catch (err) {
    console.warn('Server blueprint generation call failed:', err);
  }

  // Secondary Fallback: smart-generate
  try {
    const prompt = `تکایە نەخشەی ئەندازیاریی ئەکادیمی (Academic Blueprint) بۆ ئەم ناونیشانە دروست بکە: "${title}" بەپێی ئاستی ${profile.kurdishTitle}`;
    const resp = await fetch('/api/gemini/smart-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskType: 'deep_academic_reasoning',
        prompt,
        responseSchema: blueprintSchema,
        enableThinking: true,
        temperature: 0.35
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.result) {
        const bp = (typeof data.result === 'string' ? JSON.parse(data.result) : data.result) as AcademicBlueprint;
        bp.level = level;
        calibrateBlueprintWordCounts(bp, profile);
        return bp;
      }
    }
  } catch (err) {
    console.warn('Smart generate blueprint fallback failed:', err);
  }

  // Graceful default fallback blueprint
  const defaultBp: AcademicBlueprint = {
    level,
    titleAnalysis: {
      coreSubject: title,
      primaryDimension: 'چەمکسازی و بنەما تیۆرییەکان',
      secondaryDimension: 'شیکاریی بەراوردکاری و داتا',
      recommendedApproach: 'میتۆدی شیکاریی زانستی'
    },
    frontMatterAndIntro: {
      dedicationAndAck: `بەخشین بە ڕێگای زانست و پێشکەش بە ئەوانەی لە پێناوی تێگەیشتندا ماندوو دەبن.\nسوپاس و پێزانینی تایبەت بۆ هەموو مامۆستایان و چاودێرانی ئەم لێکۆڵینەوەیە.`,
      abstractKurdish: `ئەم توێژینەوەیە بە ناونیشانی «${title}» بەدواداچوون بۆ ڕەهەندە سەرەکییەکان دەکات.`,
      abstractEnglish: `This academic thesis investigates the dimensions and applications of "${title}".`,
      fullIntroductionMarkdown: `## دەروازە و پێشەکیی گشتی\n\nئەم لێکۆڵینەوەیە بەوردی تیشک دەخاتە سەر گرنگیی مەعریفی و کێشەی زانستیی «${title}» لە ڕوانگەیەکی هاوچەرخەوە.`
    },
    chapters: [
      {
        chapterType: 'intro',
        title: 'بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە و پێشینە',
        targetWords: profile.structure.introWords,
        sections: [
          {
            title: 'تەوەری یەکەم: کێشە، گرنگی و پرسیارەکانی توێژینەوە',
            targetWords: Math.round(profile.structure.introWords / 2),
            subSections: [
              { code: '١.١', title: 'کێشەی سەرەکی و هۆکاری هەڵبژاردنی بابەتەکە', targetWords: Math.round(profile.structure.introWords / 4), microTopicsToCover: ['دەستنیشانکردنی کەلێنی زانستی'] },
              { code: '١.٢', title: 'ئامانج، گریمانە و سنووری لێکۆڵینەوە', targetWords: Math.round(profile.structure.introWords / 4), microTopicsToCover: ['دیاریکردنی پرسیار و سنوورەکان'] }
            ]
          }
        ]
      },
      {
        chapterType: 'core',
        title: 'بەشی دووەم: بنەما تیۆرییەکان و شیکاریی زانستی',
        targetWords: Math.round((profile.structure.totalWords - profile.structure.introWords - profile.structure.conclusionWords) / 2),
        sections: [
          {
            title: 'تەوەری یەکەم: چەمکسازی و ئیپستۆمۆلۆژیای بابەتەکە',
            targetWords: 5000,
            subSections: [
              { code: '٢.١', title: 'پێناسە و ڕیشەی مێژوویی چەمکەکان', targetWords: 2500, microTopicsToCover: ['چەمکسازیی سەرەکی'] },
              { code: '٢.٢', title: 'دیدگای تیۆرییەکانی پێشوو و ڕەخنەگری', targetWords: 2500, microTopicsToCover: ['پێداچوونەوەی ئەدەبیات'] }
            ]
          }
        ]
      },
      {
        chapterType: 'conclusion',
        title: 'بەشی کۆتایی: دەرەنجام و ڕاسپاردە زانستییەکان',
        targetWords: profile.structure.conclusionWords,
        sections: [
          {
            title: 'تەوەری کۆتایی: کۆبەندی دۆزینەوەکان و پێشنیارەکان',
            targetWords: profile.structure.conclusionWords,
            subSections: [
              { code: '٣.١', title: 'کۆبەندی دەرەنجامە زانستییە بەدەستهاتووەکان', targetWords: Math.round(profile.structure.conclusionWords / 2), microTopicsToCover: ['پوختەی ئەنجامەکان'] },
              { code: '٣.٢', title: 'ڕاسپاردەکان بۆ توێژەرانی داهاتوو', targetWords: Math.round(profile.structure.conclusionWords / 2), microTopicsToCover: ['پێشنیاری توێژینەوەی نوێ'] }
            ]
          }
        ]
      }
    ]
  };

  calibrateBlueprintWordCounts(defaultBp, profile);
  return defaultBp;
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
