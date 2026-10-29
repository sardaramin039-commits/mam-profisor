import { Injectable, inject, signal } from '@angular/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ChapterItemModel, SubBranchItem, AxisItem } from '../domain/models';
import { AppNotificationsService } from '../core/app.notifications';
import { EditorService } from '../features/editor/services/editor';
import { AcademicStoreService } from './academic-store.service';

// ١. پێناسەکردنی تایپەکان هاوتا لەگەڵ پێکهاتەی داواکراو
export interface SubSectionNode {
  code: string;
  title: string;
  targetWords: number;
  status: 'لە چاوەڕوانیدایە' | 'تەواوکراو';
}

export interface SectionNode {
  title: string;
  targetWords: number;
  subSections: SubSectionNode[];
}

export interface ChapterNode {
  id: string;
  levelLabel: string;
  chapterType: 'front_matter' | 'intro' | 'theory' | 'practical_1' | 'practical_2' | 'conclusion' | 'back_matter';
  title: string;
  targetWords: number;
  sections: SectionNode[];
}

export interface ThesisOutlineResponse {
  titleDeconstruction: {
    researchNature: 'qualitative_textual' | 'quantitative_empirical' | 'mixed';
    coreSubject: string;
    dimensionOne: string;
    dimensionTwo: string;
    methodologyAndTheory: string;
  };
  chapters: ChapterNode[];
}

// ٢. JSON Schema بۆ داڕشتنی پەیکەری ستاندارد بە Gemini
export const thesisOutlineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titleDeconstruction: {
      type: Type.OBJECT,
      description: 'شیتەڵکردنی زانستیی ناونیشانەکە پێش داڕشتنی پێڕستەکە',
      properties: {
        researchNature: {
          type: Type.STRING,
          enum: ['qualitative_textual', 'quantitative_empirical', 'mixed'],
          description: 'سروشتی توێژینەوەکە'
        },
        coreSubject: {
          type: Type.STRING,
          description: 'بابەت یان کەرەستەی سەرەکیی توێژینەوەکە'
        },
        dimensionOne: {
          type: Type.STRING,
          description: 'ڕەهەند یان گۆڕاوی یەکەمی ناونیشانەکە'
        },
        dimensionTwo: {
          type: Type.STRING,
          description: 'ڕەهەند یان گۆڕاوی دووەمی ناونیشانەکە'
        },
        methodologyAndTheory: {
          type: Type.STRING,
          description: 'میتۆد و تیۆرییە سەرەکییەکان'
        }
      },
      required: ['researchNature', 'coreSubject', 'dimensionOne', 'dimensionTwo', 'methodologyAndTheory']
    },
    chapters: {
      type: Type.ARRAY,
      description: 'لیستی بەشە سەرەکییەکان',
      items: {
        type: Type.OBJECT,
        properties: {
          chapterType: {
            type: Type.STRING,
            enum: ['intro', 'theory', 'practical_1', 'practical_2', 'conclusion']
          },
          title: {
            type: Type.STRING,
            description: 'ناونیشانی تەواوی بەشەکە بە زمانی کوردیی ئەکادیمیی پاراو'
          },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'ناونیشانی تەوەرەکە بە دەستپێکی (تەوەری یەکەم/دووەم/سێیەم: ...)'
                },
                subSections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: {
                        type: Type.STRING,
                        description: 'کۆدی ژمارەیی لقەکە وەک 0.1.1 یان 1.1.1'
                      },
                      title: {
                        type: Type.STRING,
                        description: 'ناونیشانی زانستی و تایبەتمەندی لقەکە بەبێ سەردێڕی قاڵبی'
                      }
                    },
                    required: ['code', 'title']
                  }
                }
              },
              required: ['title', 'subSections']
            }
          }
        },
        required: ['chapterType', 'title', 'sections']
      }
    }
  },
  required: ['titleDeconstruction', 'chapters']
};

export const ACADEMIC_OUTLINE_SYSTEM_PROMPT = `
تۆ پڕۆفیسۆرێکی پسپۆڕی لە داڕشتنی پڕۆپۆزەڵ و پەیکەری تێزی ئەکادیمی (قوتابخانە، بەکالۆریۆس، ماستەر، دکتۆرا) بە زمانی کوردی (سۆرانی).
ئەرکی تۆ داڕشتنی پێڕستێکی ئەکادیمیی زۆر ورد و تایبەتمەندە کە ١٠٠٪ لە هەناوی چەمکەکانی ناونیشانی توێژینەوەکەوە بە شێوەیەکی داینامیکی هەڵقوڵابێت.

یاساکانی داڕشتنی داینامیک:
١. هیچ سەردێڕێکی قاڵبی و گشتی بەکارمەهێنە؛ هەموو ناوەکان دەبێت چەمکی ڕاستەقینەی ناو بابەتەکە بن.
٢. دابەشکردنی لۆژیکی بۆ بەشەکان:
   - دەروازە (intro): ٣ تەوەر (کێشە و ئامانج، سنوور و میتۆد، پێشینە و کەلێنی مەعریفی). کۆدی لق: 0.1.1 تا 0.3.3.
   - بەشی تیۆری (theory): ٣ تەوەر بۆ شیکردنەوەی چەمک و تیۆرییەکان. کۆدی لق: 1.1.1 تا 1.3.3.
   - بەشە پراکتیکییەکان (practical_1 & practical_2): شیکاریی ڕەهەندە سەرەکییەکان لە ٢ بۆ ٣ تەوەردا.
   - ئەنجامەکان (conclusion): ٢ تەوەر (دۆزینەوەکان، و ڕاسپاردەکان).
٣. وشەکان و زاراوەکان دەبێت بە تەواوی لەگەڵ ئاستی زانستیی داواکراو بگونجێن.
`;

export function distributeAcademicWordCounts(
  aiChapters: ChapterNode[],
  totalWords: number = 95000
): ChapterNode[] {
  const fixedCaps = {
    dedication: 150,
    toc: 500,
    intro: 6000,
    conclusion: 3500,
    abstracts: 1000,
    references: 4000
  };

  const remainingCoreWords =
    totalWords -
    (fixedCaps.dedication +
      fixedCaps.toc +
      fixedCaps.intro +
      fixedCaps.conclusion +
      fixedCaps.abstracts +
      fixedCaps.references);

  const coreWeights: Record<string, number> = {
    theory: Math.round(remainingCoreWords * 0.28),
    practical_1: Math.round(remainingCoreWords * 0.36),
    practical_2: Math.round(remainingCoreWords * 0.36)
  };

  const processedCoreChapters: ChapterNode[] = aiChapters.map((chapter, idx) => {
    let chapterWords = 6000;
    if (chapter.chapterType === 'intro') chapterWords = fixedCaps.intro;
    else if (chapter.chapterType === 'conclusion') chapterWords = fixedCaps.conclusion;
    else if (coreWeights[chapter.chapterType]) chapterWords = coreWeights[chapter.chapterType];

    const sectionCount = chapter.sections?.length || 1;
    const wordsPerSection = Math.floor(chapterWords / sectionCount);

    const updatedSections: SectionNode[] = (chapter.sections || []).map((sec) => {
      const subCount = sec.subSections?.length || 1;
      const wordsPerSub = Math.floor(wordsPerSection / subCount);

      return {
        ...sec,
        targetWords: wordsPerSection,
        subSections: (sec.subSections || []).map((sub) => ({
          ...sub,
          targetWords: wordsPerSub,
          status: 'لە چاوەڕوانیدایە'
        }))
      };
    });

    return {
      ...chapter,
      id: `chapter_${idx + 1}`,
      levelLabel: 'ئاستی ١: بەش',
      targetWords: chapterWords,
      sections: updatedSections
    };
  });

  const frontMatter: ChapterNode[] = [
    {
      id: 'front_dedication',
      levelLabel: 'ئاستی ١: بەش',
      chapterType: 'front_matter',
      title: 'پێشکەشە و سوپاسنامە (Dedication & Acknowledgments)',
      targetWords: fixedCaps.dedication,
      sections: []
    },
    {
      id: 'front_toc',
      levelLabel: 'ئاستی ١: بەش',
      chapterType: 'front_matter',
      title: 'پێڕستی بابەتەکان و خشتەکان (Table of Contents)',
      targetWords: fixedCaps.toc,
      sections: []
    }
  ];

  const backMatter: ChapterNode[] = [
    {
      id: 'back_abstracts',
      levelLabel: 'ئاستی ١: بەش',
      chapterType: 'back_matter',
      title: 'پوختەی توێژینەوە بە عەرەبی و ئینگلیزی (Arabic & English Abstracts)',
      targetWords: fixedCaps.abstracts,
      sections: []
    },
    {
      id: 'back_references',
      levelLabel: 'ئاستی ١: بەش',
      chapterType: 'back_matter',
      title: 'لیستی سەرچاوە و بیبلۆگرافیا (References & Bibliography)',
      targetWords: fixedCaps.references,
      sections: []
    }
  ];

  return [...frontMatter, ...processedCoreChapters, ...backMatter];
}

function resolveActiveKeys(): string[] {
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

// پێڕست بە شێوەی ١٠٠٪ داینامیک بە جیمینی بەرهەم دەهێنرێت بێ هیچ قاڵبێکی جێگیر
export async function generateAcademicThesisOutline(
  thesisTitle: string,
  degreeLevel: string = 'دکتۆرا',
  researchQuestions?: string[]
): Promise<{ titleAnalysis: ThesisOutlineResponse['titleDeconstruction']; outline: ChapterNode[] }> {
  const keys = resolveActiveKeys();
  if (keys.length === 0) {
    throw new Error('تکایە کلیلی Gemini API دابین بکە بۆ ئەوەی پێڕستەکە بە شێوەیەکی داینامیکی بەرهەم بهێنرێت.');
  }

  const prompt = `تکایە پێڕستێکی ئەکادیمیی تێروتەسەل بۆ ئەم توێژینەوەیە دابڕێژە:
- ناونیشانی توێژینەوە: "${thesisTitle}"
- ئاستی ئەکادیمی: ${degreeLevel}
${researchQuestions && researchQuestions.length > 0 ? `- پرسیارەکان:\n${researchQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}` : ''}
قەدەغەکردنی قاڵبی جێگیر: نابێت هیچ ناوێکی گشتی یان قاڵبی بەکاربهێنیت، ١٠٠٪ی ناوەکان دەبێت تایبەت بن بەم ناونیشانە.`;

  let lastError: unknown = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          systemInstruction: ACADEMIC_OUTLINE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: thesisOutlineSchema,
          thinkingConfig: { thinkingBudget: 8192 },
          temperature: 0.35
        }
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text) as ThesisOutlineResponse;
        const totalTargetWords = degreeLevel.includes('دکتۆرا') ? 95000 : 55000;
        return {
          titleAnalysis: parsedData.titleDeconstruction,
          outline: distributeAcademicWordCounts(parsedData.chapters, totalTargetWords)
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`هەوڵی داڕشتنی پێڕست بە کلیلی ${i + 1} سەرکەوتوو نەبوو، خولانەوە بۆ کلیلی دواتر...`, err);
    }
  }

  throw new Error(`داڕشتنی پێڕست بە سەرکەوتوویی ئەنجام نەدرا: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

@Injectable({
  providedIn: 'root'
})
export class GeminiStructuredOutlineService {
  private toastService = inject(AppNotificationsService);
  private editorService = inject(EditorService);
  private academicStore = inject(AcademicStoreService);

  public isGenerating = signal<boolean>(false);
  public lastGeneratedOutline = signal<ThesisOutlineResponse | null>(null);

  public async generateThesisOutline(
    title: string,
    options?: {
      academicLevel?: string;
      discipline?: string;
      targetWords?: number;
      researchQuestions?: string[];
    }
  ): Promise<ThesisOutlineResponse> {
    const rawTitle = (title || '').trim();
    if (!rawTitle) {
      throw new Error('تکایە ناونیشانی تێز دیاری بکە پێش داڕشتنی پێڕست.');
    }

    this.isGenerating.set(true);
    const academicLevel = options?.academicLevel || 'دکتۆرا';
    const targetWords = options?.targetWords || (academicLevel.includes('دکتۆرا') ? 95000 : 55000);

    try {
      const result = await generateAcademicThesisOutline(rawTitle, academicLevel, options?.researchQuestions);
      const outlineResponse: ThesisOutlineResponse = {
        titleDeconstruction: result.titleAnalysis,
        chapters: result.outline
      };
      this.lastGeneratedOutline.set(outlineResponse);
      this.toastService.showSuccess('پەیکەری تێز داڕێژرا', 'پەیکەری تێز بە مۆدی قووڵبیرکردنەوە (Deep Thinking) بە سەرکەوتوویی بەرهەمهێنرا.');
      return outlineResponse;
    } catch (err: any) {
      this.toastService.showWarning('کێشەی بەرهەمهێنان', err?.message || 'هەڵەیەک ڕوویدا لە داڕشتنی داینامیکی پێڕستدا.');
      throw err;
    } finally {
      this.isGenerating.set(false);
    }
  }

  public applyOutlineAndSetChapters(outline: ThesisOutlineResponse, targetWords: number = 15000): ChapterItemModel[] {
    const chapters = this.convertOutlineResponseToChapterItems(outline, targetWords);
    this.editorService.chapters.set(chapters);
    this.academicStore.chapters.set(chapters);
    if (chapters.length > 0) {
      this.editorService.activeChapterId.set(chapters[0].id);
    }
    return chapters;
  }

  public convertOutlineResponseToChapterItems(
    outline: ThesisOutlineResponse,
    _totalTargetWords: number = 15000
  ): ChapterItemModel[] {
    const chapters: ChapterItemModel[] = [];

    outline.chapters.forEach((ch, chIdx) => {
      const chapterId = chIdx + 1;
      const axes: AxisItem[] = [];

      let content = `# ${ch.title}\n\n`;

      if (ch.sections && ch.sections.length > 0) {
        ch.sections.forEach((sec, secIdx) => {
          content += `## ${sec.title}\n\n`;
          const branches: SubBranchItem[] = [];

          (sec.subSections || []).forEach((sub, subIdx) => {
            branches.push({
              id: `${chapterId}.${secIdx + 1}.${subIdx + 1}`,
              code: sub.code,
              title: sub.title,
              targetWords: sub.targetWords || Math.round(ch.targetWords / Math.max(1, ch.sections.length * 3)),
              wordCount: 0,
              status: sub.status === 'تەواوکراو' ? 'completed' : 'pending',
              content: `[دەقی ئەکادیمی بۆ ئەم لقە لێرە دەنووسرێت]`
            });
            content += `### ${sub.code} ${sub.title}\n[دەقی ئەکادیمی بۆ ئەم لقە لێرە دەنووسرێت]\n\n`;
          });

          axes.push({
            id: `${chapterId}.${secIdx + 1}`,
            code: sec.title.split(':')[0] || `تەوەری ${secIdx + 1}`,
            title: sec.title,
            targetWords: sec.targetWords || Math.round(ch.targetWords / Math.max(1, ch.sections.length)),
            wordCount: 0,
            branches
          });
        });
      } else {
        content += `[ناوەڕۆکی تایبەت بە «${ch.title}» لێرە دەنووسرێت]\n\n`;
      }

      chapters.push({
        id: chapterId,
        title: ch.title,
        content: content.trim(),
        wordCount: 0,
        status: 'pending',
        customTargetWords: ch.targetWords,
        axes
      });
    });

    return chapters;
  }
}
