// AdaptiveWriterAndDesigner.ts
import { AcademicLevel, LEVEL_PROFILES } from './LevelProfiles';
import { SubSectionPlan } from './BlueprintAndOutlineAgent';
import { AdaptiveCitationManager, SourceItem } from './AdaptiveCitationManager';

export type Schema = Record<string, any>;
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

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
  try {
    const resp = await fetch('/api/gemini/write-subsection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thesisTitle: params.thesisTitle,
        level: params.level,
        chapterTitle: params.chapterTitle,
        sectionTitle: params.sectionTitle,
        subSection: params.subSection,
        previousClosingParagraph: params.previousClosingParagraph,
        nextSubSectionTitle: params.nextSubSectionTitle
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.result) {
        return data.result;
      }
    }
  } catch (err) {
    console.warn('Server write-subsection proxy call failed, falling back:', err);
  }

  // Fallback
  return {
    fullSubSectionMarkdown: `### ${params.subSection.code} ${params.subSection.title}\n\nلەم بەشە زانستییەدا، تاوتوێی لایەنە سەرەکییەکان و پەیوەندییەکانی «${params.subSection.title}» دەکرێت لە چوارچێوەی بەشی «${params.chapterTitle}» و ناونیشانی سەرەکیی توێژینەوەکە.`,
    lastParagraph: `بە لێکدانەوەی ئەم خاڵانە دەگەینە دەرئەنجامی سەرەتایی بۆ بەستنەوە بە لقی دواتر.`,
    keyFindings: [params.subSection.title]
  };
}

// ٢. ئەجێنتی نووسینی ئەنجام و ڕاسپاردەکان بەپێی ئاستەکە
export async function generateCalibratedConclusion(
  title: string,
  level: AcademicLevel,
  allFindings: string[]
): Promise<string> {
  try {
    const resp = await fetch('/api/gemini/conclusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        level,
        allFindings
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn('Server conclusion proxy call failed:', err);
  }

  return `## دەرەنجام و ڕاسپاردە کۆتایییەکان\n\nئەم توێژینەوەیە بە ناونیشانی «${title}» بە شێوەیەکی زانستی گەیشتە کۆمەڵێک دەرەنجامی بەرچاو لە ئاستی (${level}).`;
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
