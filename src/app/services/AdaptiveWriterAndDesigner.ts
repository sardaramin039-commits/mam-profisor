// AdaptiveWriterAndDesigner.ts
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AcademicLevel, LEVEL_PROFILES } from './LevelProfiles';
import { SubSectionPlan } from './BlueprintAndOutlineAgent';
import { AdaptiveCitationManager, SourceItem } from './AdaptiveCitationManager';

export interface PassOutput {
  proseMarkdown: string;
  coveredPoints: string[];
  closingParagraph: string;
  sources: SourceItem[];
}

export const passSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    proseMarkdown: {
      type: Type.STRING,
      description: 'دەقی نووسراوی ئەم بەشە بەپێی ئاستی دیاریکراو. بۆ دانانی سەرچاوە هێمای {{CITE:id}} بەکاربهێنە.'
    },
    coveredPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    closingParagraph: {
      type: Type.STRING,
      description: 'دوایین پەرەگرافی ئەم قۆناغە بۆ گرێدانی قۆناغی داهاتوو'
    },
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
          language: { type: Type.STRING, enum: ['ku', 'fa', 'ar', 'en'] },
          pageOrNote: { type: Type.STRING }
        },
        required: ['id', 'author', 'year', 'title', 'publisherOrLocation', 'language']
      }
    }
  },
  required: ['proseMarkdown', 'coveredPoints', 'closingParagraph', 'sources']
};

interface AdaptiveGenConfig {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: Schema;
  temperature?: number;
  thinkingConfig?: { thinkingBudget?: number };
}

function resolveApiKeys(): string[] {
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

// ١. ئەجێنتی نووسینی لقەکان بە شێوەی داینامیک و قووڵبیرکردنەوە
export async function writeCalibratedSubSection(params: {
  thesisTitle: string;
  level: AcademicLevel;
  chapterTitle: string;
  sectionTitle: string;
  subSection: SubSectionPlan;
  previousClosingParagraph: string;
  nextSubSectionTitle?: string;
  citationManager: AdaptiveCitationManager;
}): Promise<{ fullSubSectionMarkdown: string; lastParagraph: string; keyFindings: string[] }> {
  const profile = LEVEL_PROFILES[params.level];
  const keys = resolveApiKeys();
  if (keys.length === 0) {
    throw new Error('تکایە کلیلی API دابین بکە بۆ نووسینی ناوەڕۆکی لقەکان بە جیمینی.');
  }

  const totalPasses = Math.max(
    1,
    Math.min(3, Math.ceil(params.subSection.targetWords / profile.structure.maxWordsPerSinglePass))
  );
  const wordsPerPass = Math.round(params.subSection.targetWords / totalPasses);

  const passParagraphs: string[] = [];
  const passFootnotes: string[] = [];
  const cumulativeCovered: string[] = [];
  let rollingBridgeParagraph = params.previousClosingParagraph;

  const isDeepLevel = params.level === 'master' || params.level === 'phd';

  for (let pass = 1; pass <= totalPasses; pass++) {
    const microTopics = params.subSection.microTopicsToCover || [];
    const passFocus =
      totalPasses === 1
        ? `تەواوی خاڵەکانی (${microTopics.join('، ')}) بە ڕوونی و تێروتەسەلی بنووسە.`
        : pass === 1
        ? `قۆناغی یەکەم: چوارچێوەی چەمکی و سەرەتای شیکردنەوەی (${microTopics[0] || params.subSection.title}) بنووسە.`
        : pass === 2 && totalPasses === 3
        ? `قۆناغی دووەم: ڕاستەوخۆ لە دوای پەرەگرافی پێشووەوە بچۆرە سەر نموونە و شیکردنەوەی (${microTopics[1] || microTopics[0] || params.subSection.title}).`
        : `قۆناغی کۆتایی ئەم لقە: ڕاستەوخۆ لە دوای پەرەگرافی پێشووەوە بچۆرە سەر هەڵسەنگاندن و کۆبەندی لقەکە.`;

    const systemInstruction = `
${profile.personaPrompt}

یاسای زمان و شێوازی تایبەت بە [${profile.kurdishTitle}]:
${profile.vocabularyAndStyleRules}

قەدەغەکراوەکانی ئەم ئاستە:
${profile.strictlyForbiddenRules}

یاسای پێکەوەلکاندنی زنجیرەیی:
- تەنها پەرەگرافی یەکبەدواییەک بنووسە و سەردێڕی لقەکە دووبارە مەنووسەرەوە.
- لە ناو دەقەکەدا بۆ سەرچاوە ڕاستەقینەکان هێمای {{CITE:source_id}} دابنێ و زانیاریی وردی سەرچاوەکە بخەرە ناو لیستی sources.
- هەرگیز سەرچاوە یان ساڵی خەیاڵی دروست مەکە.
`;

    const prompt = `
- ناونیشانی گشتی: "${params.thesisTitle}" (${profile.kurdishTitle})
- بەش: ${params.chapterTitle} | تەوەر: ${params.sectionTitle}
- لقی ئێستا: ${params.subSection.code} - ${params.subSection.title}
- قۆناغی نووسین: ${pass} لە کۆی ${totalPasses} (ئامانج: نزیکەی ${wordsPerPass} وشە)
- ئەرکی تایبەتی ئەم قۆناغە: ${passFocus}
${cumulativeCovered.length > 0 ? `- خاڵە باسکراوەکانی پێشوو: ${cumulativeCovered.join(' | ')}` : ''}
${rollingBridgeParagraph ? `- دوایین پەرەگرافی پێش ئێستا: "${rollingBridgeParagraph}"` : ''}
${pass === totalPasses && params.nextSubSectionTitle ? `- گرێدانی کۆتایی بۆ لقی داهاتوو: (${params.nextSubSectionTitle}).` : ''}
`;

    let data: PassOutput | null = null;
    let lastError: unknown = null;

    for (let k = 0; k < keys.length; k++) {
      try {
        const ai = new GoogleGenAI({ apiKey: keys[k] });
        const config: AdaptiveGenConfig = {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: passSchema,
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
          data = JSON.parse(response.text) as PassOutput;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`هەڵە لە قۆناغی ${pass} بە کلیلی ${k + 1}. خولانەوە بۆ کلیلی دواتر...`, err);
      }
    }

    if (!data) {
      throw new Error(`شکست لە نووسینی لقەکە لە قۆناغی ${pass}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }

    const { cleanMarkdown, footnotesBlock } = params.citationManager.registerAndFormatCitations(
      data.proseMarkdown,
      data.sources
    );

    passParagraphs.push(cleanMarkdown.trim());
    if (footnotesBlock) passFootnotes.push(footnotesBlock);
    cumulativeCovered.push(...data.coveredPoints);
    rollingBridgeParagraph = data.closingParagraph;
  }

  const fullSubSectionMarkdown =
    `### ${params.subSection.code} ${params.subSection.title}\n\n` +
    passParagraphs.join('\n\n') +
    (passFootnotes.length > 0 ? `\n${passFootnotes.join('\n')}` : '');

  return {
    fullSubSectionMarkdown,
    lastParagraph: rollingBridgeParagraph,
    keyFindings: cumulativeCovered
  };
}

// ٢. ئەجێنتی نووسینی ئەنجام و ڕاسپاردەکان بەپێی ئاستەکە
export async function generateCalibratedConclusion(
  title: string,
  level: AcademicLevel,
  allFindings: string[]
): Promise<string> {
  const profile = LEVEL_PROFILES[level];
  const keys = resolveApiKeys();
  if (keys.length === 0) {
    throw new Error('تکایە کلیلی API دابین بکە بۆ داڕشتنی ئەنجامەکان.');
  }

  const prompt = `
ناونیشان: "${title}"
ئاست: ${profile.kurdishTitle}
پوختەی خاڵە شیکراوەکانی ناو بەشەکان:
${allFindings.slice(0, 35).join('\n- ')}

تکایە بەشی (ئەنجامەکان و پێشنیارەکان) بەپێی یاسای ئەم ئاستە (${profile.introAndConclusionRules}) و بە قەبارەی نزیکەی ${profile.structure.conclusionWords} وشە بە شێوەیەکی داینامیکی و بەبێ هیچ دەقێکی قاڵبی بنووسە.
`;

  let lastError: unknown = null;
  const isDeepLevel = level === 'master' || level === 'phd';

  for (let k = 0; k < keys.length; k++) {
    try {
      const ai = new GoogleGenAI({ apiKey: keys[k] });
      const config: AdaptiveGenConfig = {
        systemInstruction: `${profile.personaPrompt}\n${profile.strictlyForbiddenRules}`,
        temperature: 0.3
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
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`هەڵە لە بەرهەمهێنانی ئەنجام بە کلیلی ${k + 1}:`, err);
    }
  }

  throw new Error(`نەتوانرا ئەنجامەکان بە شێوەی داینامیک بەرهەم بهێنرێت: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

// ٣. ستایلی تایپۆگرافی و چاپی ئەکادیمی (RTL Print Stylesheet)
export function generateLevelDesignStylesheet(level: AcademicLevel): string {
  const d = LEVEL_PROFILES[level].designSpec;
  return `
/* ستایلی تایپۆگرافی و چاپی تایبەت بە: ${LEVEL_PROFILES[level].kurdishTitle} */
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
  border-bottom: ${d.visualStyle === 'modern_school_card' ? '2px solid #2563eb' : '1px solid #444'};
  padding-bottom: 4pt;
}
.academic-document-container h3 {
  font-size: ${d.h3SizePt}pt;
  font-weight: bold;
  margin-top: 14pt;
  margin-bottom: 8pt;
}
.academic-document-container p {
  text-indent: ${level === 'school' ? '0.5cm' : '1cm'};
  margin-bottom: 10pt;
}
.academic-document-container sup {
  font-size: ${d.footnoteSizePt - 2}pt;
  color: #1e3a8a;
}
`;
}
