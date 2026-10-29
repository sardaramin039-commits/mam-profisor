import { Type, type Schema } from '@google/genai';
import { generateGeminiContent } from './gemini.service';
import { academicLevelCriticService, type AcademicLevel } from './academic-level-critic.service';

export type AcademicPipelineStage =
  | 'grounding'
  | 'blueprint'
  | 'writing_subsection'
  | 'critic_refining'
  | 'conclusion'
  | 'completed'
  | 'error';

export interface AcademicPipelineEvent {
  stage: AcademicPipelineStage;
  progressPercent: number;
  message: string;
  sectionCode?: string;
  partialMarkdown?: string;
}

interface PipelineSubsection {
  code: string;
  title: string;
  purpose: string;
  keyQuestions: string[];
}
interface PipelineSection { title: string; subSections: PipelineSubsection[] }
interface PipelineChapter { title: string; purpose: string; sections: PipelineSection[] }
interface PipelineBlueprint {
  introductionOutline: string[];
  chapters: PipelineChapter[];
  conclusionOutline: string[];
}

const outlineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    introductionOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          purpose: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subSections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      title: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['code', 'title', 'purpose', 'keyQuestions']
                  }
                }
              },
              required: ['title', 'subSections']
            }
          }
        },
        required: ['title', 'purpose', 'sections']
      }
    },
    conclusionOutline: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['introductionOutline', 'chapters', 'conclusionOutline']
};

const LEVEL_GUIDANCE: Record<AcademicLevel, string> = {
  school: 'Use simple, clear age-appropriate language and explain technical terms.',
  bachelor: 'Use clear undergraduate-level academic argument and define specialized terms.',
  master: 'Use critical synthesis, explicit concepts, and methodological precision.',
  phd: 'Use doctoral-level critical depth, careful qualification, methodological awareness, and original synthesis.',
  professor: 'Use expert scholarly precision, field-aware distinctions, and critical synthesis.'
};
const MAX_TITLE_LENGTH = 500;
const MAX_SUBSECTIONS = 30;

function cleanString(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function validateBlueprint(value: unknown): PipelineBlueprint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The outline response is not an object.');
  const root = value as Record<string, unknown>;
  if (!Array.isArray(root['chapters']) || !root['chapters'].length) throw new Error('The generated outline contains no chapters.');
  const chapters: PipelineChapter[] = [];
  let count = 0;
  for (const rawChapter of root['chapters'].slice(0, 8)) {
    if (!rawChapter || typeof rawChapter !== 'object') continue;
    const chapter = rawChapter as Record<string, unknown>;
    const sections: PipelineSection[] = [];
    for (const rawSection of (Array.isArray(chapter['sections']) ? chapter['sections'] : []).slice(0, 8)) {
      if (!rawSection || typeof rawSection !== 'object') continue;
      const section = rawSection as Record<string, unknown>;
      const subSections: PipelineSubsection[] = [];
      for (const rawSub of (Array.isArray(section['subSections']) ? section['subSections'] : []).slice(0, 5)) {
        if (count >= MAX_SUBSECTIONS || !rawSub || typeof rawSub !== 'object') break;
        const sub = rawSub as Record<string, unknown>;
        const title = cleanString(sub['title']);
        if (!title) continue;
        count += 1;
        subSections.push({
          code: cleanString(sub['code'], 40) || `S${count}`,
          title,
          purpose: cleanString(sub['purpose'], 1500),
          keyQuestions: Array.isArray(sub['keyQuestions'])
            ? sub['keyQuestions'].filter((item): item is string => typeof item === 'string').slice(0, 8)
            : []
        });
      }
      const title = cleanString(section['title']);
      if (title && subSections.length) sections.push({ title, subSections });
    }
    const title = cleanString(chapter['title']);
    if (title && sections.length) chapters.push({ title, purpose: cleanString(chapter['purpose'], 1500), sections });
  }
  if (!chapters.length || !count) throw new Error('The generated outline did not contain usable subsections.');
  return {
    introductionOutline: Array.isArray(root['introductionOutline'])
      ? root['introductionOutline'].filter((item): item is string => typeof item === 'string').slice(0, 12)
      : [],
    chapters,
    conclusionOutline: Array.isArray(root['conclusionOutline'])
      ? root['conclusionOutline'].filter((item): item is string => typeof item === 'string').slice(0, 12)
      : []
  };
}

/**
 * Server-side sequential academic pipeline. Retrieved search output is explicitly
 * unverified; this service never invents a bibliography from model-generated names.
 */
export async function* executeAcademicPipeline(params: {
  title: string;
  level: AcademicLevel;
}): AsyncGenerator<AcademicPipelineEvent, void, unknown> {
  const title = cleanString(params.title, MAX_TITLE_LENGTH);
  if (!title) throw new Error('A research title is required.');

  yield { stage: 'grounding', progressPercent: 5, message: 'گەڕان بۆ دۆزینەوەی پاشخان و سەرچاوە پەیوەندیدارەکان؛ ئەنجامەکان هێشتا پشتڕاستکراو نین.' };
  const retrieved = await generateGeminiContent<string>({
    mode: 'search_grounded',
    systemInstruction: 'You are a scholarly research assistant. Distinguish retrieved claims from verified evidence. Never invent bibliographic details. Label results as retrieved-not-verified.',
    prompt: `For the research topic "${title}", summarize major concepts, debates, research directions, and any sources returned by Google Search. Clearly label all retrieved sources as retrieved-not-verified. Do not claim independent verification.`
  });

  yield { stage: 'blueprint', progressPercent: 15, message: 'داڕشتنی نەخشەی تایبەتمەند بە ئاستی ئەکادیمی...' };
  const rawBlueprint = await generateGeminiContent<PipelineBlueprint>({
    mode: 'deep_thinking',
    systemInstruction: `Design a topic-specific academic outline in valid JSON. Academic level: ${params.level}. Guidance: ${LEVEL_GUIDANCE[params.level]}. Avoid generic filler and duplicated subsections. Create at most 8 chapters and 30 subsections total. Do not fabricate citations.`,
    prompt: `Research title: ${title}\nRetrieved-not-verified background: ${retrieved}\nReturn an outline with an introduction outline, chapters, sections and subsections. Each subsection needs a short purpose and key questions.`,
    responseSchema: outlineSchema,
    temperature: 0.2,
    thinkingBudgetTokens: 8192
  });
  const blueprint = validateBlueprint(rawBlueprint);
  const introduction = await generateGeminiContent<string>({
    mode: 'deep_thinking',
    systemInstruction: `Write an academically responsible Sorani Kurdish introduction for the ${params.level} level. ${LEVEL_GUIDANCE[params.level]} Do not invent sources, statistics, quotations, or study results. Mark claims requiring evidence instead of pretending they are verified.`,
    prompt: `Title: ${title}\nOutline: ${JSON.stringify(blueprint.introductionOutline)}\nRetrieved-not-verified research context: ${retrieved}\nWrite a coherent introduction with background, problem, significance, aims, questions, scope and limitations. Clearly distinguish proposed framing from verified facts.`,
    temperature: 0.25
  });
  yield {
    stage: 'blueprint',
    progressPercent: 22,
    message: 'نەخشە و پێشەکی ئامادە کرا.',
    partialMarkdown: `# ${title}\n\n${introduction}\n\n## نەخشەی کار\n\n${blueprint.chapters.map((chapter, index) => `${index + 1}. ${chapter.title}`).join('\n')}`
  };

  const subsections = blueprint.chapters.flatMap(chapter =>
    chapter.sections.flatMap(section =>
      section.subSections.map(sub => ({ chapterTitle: chapter.title, sectionTitle: section.title, sub }))
    )
  );
  let previousClosing = '';
  const findings: string[] = [];
  for (let index = 0; index < subsections.length; index += 1) {
    const item = subsections[index];
    const next = subsections[index + 1];
    const progress = 25 + Math.round(((index + 1) / subsections.length) * 60);
    yield {
      stage: 'writing_subsection',
      progressPercent: progress - 2,
      sectionCode: item.sub.code,
      message: `نووسینی ${item.sub.code}: ${item.sub.title}`
    };
    const draft = await generateGeminiContent<string>({
      mode: 'deep_thinking',
      systemInstruction: `You are a careful Sorani Kurdish academic writer. Target level: ${params.level}. ${LEVEL_GUIDANCE[params.level]} Preserve factual uncertainty. Do not invent citations, DOI, quotations, statistics, datasets, or research findings. Clearly flag where source verification is needed. Write a coherent subsection, not a generic template.`,
      prompt: [
        `Research title: ${title}`,
        `Chapter: ${item.chapterTitle}`,
        `Section: ${item.sectionTitle}`,
        `Subsection: ${item.sub.title}`,
        `Purpose: ${item.sub.purpose}`,
        `Key questions: ${item.sub.keyQuestions.join('; ')}`,
        `Retrieved-not-verified context: ${retrieved}`,
        `Continuity from previous subsection (context only): ${previousClosing}`,
        `Next subsection for continuity: ${next?.sub.title || 'none'}`,
        'Use headings and critical analysis. Do not claim the search results are verified citations. End with a concise transition where appropriate.'
      ].join('\n\n'),
      temperature: 0.25,
      thinkingBudgetTokens: 8192
    });
    yield {
      stage: 'critic_refining',
      progressPercent: progress,
      sectionCode: item.sub.code,
      message: `پشکنینی زمان و گونجان بۆ ئاستی ${params.level}...`
    };
    const review = await academicLevelCriticService.verifyAndRefineSection(
      draft,
      params.level,
      item.sub.title
    );
    const refined = review.refinedMarkdown || draft;
    const paragraphs = refined.trim().split(/\n\s*\n/u);
    previousClosing = paragraphs.slice(-2).join('\n\n').slice(-1200);
    findings.push(...review.detectedIssues.slice(0, 10).map(issue => `${item.sub.code}: ${issue}`));
    yield {
      stage: 'writing_subsection',
      progressPercent: progress,
      sectionCode: item.sub.code,
      message: `لقی ${item.sub.code} نووسرا و پشکنرا.`,
      partialMarkdown: `## ${item.sub.code} ${item.sub.title}\n\n${refined}`
    };
  }

  yield { stage: 'conclusion', progressPercent: 92, message: 'نووسینی کۆتایی بە پشتبەستن بە ناوەڕۆکی ئامادەکراو...' };
  const conclusion = await generateGeminiContent<string>({
    mode: 'deep_thinking',
    systemInstruction: `Write a responsible Sorani Kurdish academic conclusion at ${params.level} level. ${LEVEL_GUIDANCE[params.level]} Do not invent results, sources, or recommendations unsupported by the supplied outline/findings.`,
    prompt: `Title: ${title}\nConclusion outline: ${blueprint.conclusionOutline.join('; ')}\nCritic findings to address where relevant: ${findings.join('\n')}\nWrite conclusions and recommendations only to the extent supported by the generated manuscript. State limitations and identify claims needing evidence verification. Do not generate a fake bibliography.`,
    temperature: 0.2
  });
  yield {
    stage: 'completed',
    progressPercent: 100,
    message: 'زنجیرەی نووسین تەواو بوو؛ پشتڕاستکردنەوەی سەرچاوەکان هێشتا پێویستی بە قۆناغی جیاواز هەیە.',
    partialMarkdown: `## ئەنجام و ڕاسپاردەکان\n\n${conclusion}\n\n## تێبینیی سەرچاوە و بەڵگە\n\nسەرچاوەکانی گەڕان لەم زنجیرەیەدا وەک `retrieved-not-verified` مامەڵەیان لەگەڵ کراوە. پێش بەکارهێنانی ئەکادیمی، پێویستە ناونیشان، نووسەر، ساڵ، DOI/URL و بەڵگەی پشتگیری بە سیستەمی پشتڕاستکردنەوەی سەرچاوەی پڕۆژەکە بپشکنرێن.`
  };
}
