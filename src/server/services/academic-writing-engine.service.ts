import { GoogleGenAI } from '@google/genai';

export interface ArgumentNode {
  id: string;
  claim: string;
  subArguments: string[];
  evidenceQuotes: string[];
  counterArguments: string[];
  synthesisKurdish: string;
}

export interface ThesisStructurePlan {
  researchQuestion: string;
  thesisStatement: string;
  arguments: ArgumentNode[];
  overallConclusion: string;
}

export class AcademicWritingEngineService {
  /**
   * Generates a complete Argument Architecture for an academic paper or thesis chapter.
   */
  public async generateArgumentArchitecture(
    topic: string,
    discipline: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<ThesisStructurePlan> {
    const ai = getGeminiClient();

    const prompt = `تۆ سەرنووسەری ئەکادیمی باڵای زانکۆی هارفەردیت. بونیادێکی بەهێزی بەڵگەداری ئارگومێنتی (Argument Architecture) بۆ ئەم بابەتە بنووسە:
بابەت: ${topic}
بوار: ${discipline}

بونیادەکە بە پێوەرەکانی هارفەرد:
1. Research Question (پرسیاری سەرەکی توێژینەوە)
2. Thesis Statement (فرزیەی بنەڕەتی)
3. Arguments & Sub-arguments (ئارگومێنت و لاوەکییەکان)
4. Evidence & Quotes (بەڵگە و وتەکان)
5. Counterarguments & Synthesis (وەڵامی دژە-ئارگومێنت و تێکەڵکردن)
6. Conclusion (ئەنجامگیری)

وەڵامەکەت تەنها بە JSON بێت بەم شێوازە:
{
  "researchQuestion": "پرسیاری سەرەکی",
  "thesisStatement": "فرزیەی بنەڕەتی تێزەکە",
  "arguments": [
    {
      "id": "ARG-01",
      "claim": "ئارگومێنتی سەرەکی یەکەم",
      "subArguments": ["خاڵی لاوەکی A", "خاڵی لاوەکی B"],
      "evidenceQuotes": ["بەڵگەی بەهێزی زانستی"],
      "counterArguments": ["دژە-ئارگومێنتی ئەگەری"],
      "synthesisKurdish": "شیکاری تێکەڵکردن و بەرگری زانستی"
    }
  ],
  "overallConclusion": "ئەنجامگیری سەرانسەری تێزەکە"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        researchQuestion: parsed.researchQuestion || `چۆن ${topic} کاریگەری لەسەر ئاڕاستە ئەکادیمییەکان دەکات؟`,
        thesisStatement: parsed.thesisStatement || `ئەم توێژینەوەیە دەسەلمێنێت کە ${topic} پایەیەکی گرنگی زانستییە.`,
        arguments: parsed.arguments || [],
        overallConclusion: parsed.overallConclusion || `ئەم توێژینەوەیە دەروازەیەکی نوێ بۆ بوارەکە دەکاتەوە.`
      };
    } catch (err: any) {
      console.error('Error in AcademicWritingEngineService:', err);
      return {
        researchQuestion: `پرسیاری سەرەکی توێژینەوە لەسەر ${topic}`,
        thesisStatement: `فرزیەی زانستی دەربارەی ${topic}`,
        arguments: [
          {
            id: 'ARG-01',
            claim: 'پایەی سەرەکی توێژینەوەکە پشتیوانکراوە بە بەڵگەی ئەکادیمی.',
            subArguments: ['خاڵی شیکاری یەکەم'],
            evidenceQuotes: [],
            counterArguments: ['تێبینی پێداچوونەوەکار'],
            synthesisKurdish: 'وەڵامدانەوەی ئەکادیمیانە و بەهێزکردنی تێزەکە.'
          }
        ],
        overallConclusion: 'دەرئەنجامی زانستی تێزەکە.'
      };
    }
  }
}

export const academicWritingEngineService = new AcademicWritingEngineService();
