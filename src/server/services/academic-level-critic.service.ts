import { Type, type Schema, type GoogleGenAI } from '@google/genai';

export type AcademicLevel = 'school' | 'bachelor' | 'master' | 'phd' | 'professor';

export interface CriticEvaluation {
  isSuitableForLevel: boolean;
  detectedIssues: string[];
  refinedMarkdown: string;
}

const criticSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isSuitableForLevel: { type: Type.BOOLEAN },
    detectedIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
    refinedMarkdown: { type: Type.STRING }
  },
  required: ['isSuitableForLevel', 'detectedIssues', 'refinedMarkdown']
};

const LEVEL_GUIDANCE: Record<AcademicLevel, string> = {
  school: 'Use clear, age-appropriate language. Explain necessary technical terms simply; avoid needless jargon.',
  bachelor: 'Use clear undergraduate academic language, define specialized terms, and support claims with appropriate reasoning.',
  master: 'Use advanced academic language, critical synthesis, explicit conceptual framing, and methodological precision.',
  phd: 'Use doctoral-level critical depth, original synthesis, methodological awareness, nuanced argumentation, and precise terminology.',
  professor: 'Use expert scholarly precision, field-aware conceptual distinctions, critical synthesis, and careful qualification of claims.'
};

const MAX_INPUT_LENGTH = 80_000;

function normalizeEvaluation(value: unknown, original: string): CriticEvaluation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Gemini returned an invalid academic-critic response.');
  }
  const item = value as Record<string, unknown>;
  const refined = typeof item['refinedMarkdown'] === 'string' ? item['refinedMarkdown'].trim() : '';
  const issues = Array.isArray(item['detectedIssues'])
    ? item['detectedIssues'].filter((entry): entry is string => typeof entry === 'string').slice(0, 100)
    : [];
  if (!refined) return { isSuitableForLevel: false, detectedIssues: ['The critic returned no refined text.'], refinedMarkdown: original };
  // Preserve key academic artifacts. If the model drops them, reject the rewrite rather than silently damaging citations/data.
  const protectedFragments = [
    ...(original.match(/\b10\.\d{4,9}\/[^\s<>"']+/gu) || []),
    ...(original.match(/https?:\/\/[^\s<>"']+/gu) || []),
    ...(original.match(/\bISBN(?:-1[03])?:?\s*[0-9X-]{10,20}\b/giu) || []),
    ...(original.match(/\bISSN:?\s*[0-9X-]{8,10}\b/giu) || []),
    ...(original.match(/\[[0-9٠-٩۰-۹]+(?:\s*[,;]\s*[0-9٠-٩۰-۹]+)*\]/gu) || [])
  ];
  if (protectedFragments.some(fragment => !refined.includes(fragment))) {
    return {
      isSuitableForLevel: false,
      detectedIssues: [...issues, 'Rewrite rejected because one or more citation identifiers, URLs, or numeric citations were not preserved.'],
      refinedMarkdown: original
    };
  }
  return {
    isSuitableForLevel: item['isSuitableForLevel'] === true,
    detectedIssues: issues,
    refinedMarkdown: refined
  };
}

export class AcademicLevelCriticService {
  public async verifyAndRefineSection(
    draftMarkdown: string,
    level: AcademicLevel,
    subSectionTitle: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<CriticEvaluation> {
    const original = typeof draftMarkdown === 'string' ? draftMarkdown.trim() : '';
    const title = typeof subSectionTitle === 'string' ? subSectionTitle.trim().slice(0, 500) : '';
    if (!original) throw new Error('A non-empty draft section is required.');
    if (original.length > MAX_INPUT_LENGTH) throw new Error(`Draft exceeds the ${MAX_INPUT_LENGTH}-character limit.`);
    if (!title) throw new Error('A subsection title is required.');

    const prompt = [
      'تۆ سەرنووسەر و پشکنەری ئەکادیمیی زمانی کوردیی سۆرانییت.',
      `ئاستی داواکراو: ${level}`,
      `ڕێنمایی ئاست: ${LEVEL_GUIDANCE[level]}`,
      `ناونیشانی لق: ${title}`,
      'دەقی خوارەوە بپشکنە و ئەگەر پێویست بوو چاکی بکەوە.',
      'هیچ بەڵگە، citation، DOI، URL، ژمارە، داتا، quote، ناوی نووسەر، ساڵ، یان زانیارییەکی ناو دەق مەسڕەوە و دروستی مەکە.',
      'ناونیشان، ڕیزبەندی، مانا و هەموو خاڵە زانستییە گرنگەکان بپارێزە. ئەگەر دڵنیانیت، گۆڕانکاریی گومانلێکراو مەکە.',
      'تەنها JSON بگەڕێنەوە بە شێوەی schema ـی داواکراو.',
      'دەقی ڕەشنووس:',
      original
    ].join('\n\n');

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Perform conservative academic language editing. Never invent or remove evidence. Return valid JSON only.',
        responseMimeType: 'application/json',
        responseSchema: criticSchema,
        temperature: 0.2
      }
    });
    const responseText = response.text?.trim();
    if (!responseText) throw new Error('Gemini returned an empty academic-critic response.');
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      throw new Error('Gemini returned invalid JSON for academic critique.', { cause: error });
    }
    return normalizeEvaluation(parsed, original);
  }
}

export const academicLevelCriticService = new AcademicLevelCriticService();
