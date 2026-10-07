import { GoogleGenAI } from '@google/genai';
import { disciplineProfileService } from './discipline-profile.service';

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
    const profile = disciplineProfileService.getProfile(discipline);

    const prompt = `تۆ سەرنووسەرێکی ئەکادیمیی زانکۆیییت. بونیادێکی ڕێکخراوی ئارگومێنتی (Argument Architecture) بۆ ئەم بابەتە دابنێ:
بابەت: ${topic}
بوار: ${discipline}
پرۆفایلی بوار: ${JSON.stringify(profile)}

بونیادەکە بەپێی پێوەرە باوەڕپێکراوەکانی نووسینی ئەکادیمی دابنێ:
1. Research Question (پرسیاری سەرەکی توێژینەوە)
2. Thesis Statement (فرزیەی بنەڕەتی)
3. Arguments & Sub-arguments (ئارگومێنت و لاوەکییەکان)
4. Evidence & Quotes (بەڵگە و وتەکان؛ لەم سەروەرەدا هیچ quote ـێکی ڕاستەقینە دروست مەکە، تەنها خانەکە بەتاڵ بهێڵە)
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
      "evidenceQuotes": [],
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
        researchQuestion: parsed.researchQuestion || `پرسیاری توێژینەوەی پێشنیارکراو لەسەر «${topic}»؛ پێویستی بە پشکنینی ئەدەبیات هەیە.`,
        thesisStatement: parsed.thesisStatement || `فرزیەی پێشنیارکراو بۆ «${topic}»؛ پێویستە بە Evidence ـی ڕاستەقینە پشتڕاست بکرێتەوە.`,
        arguments: parsed.arguments || [],
        overallConclusion: parsed.overallConclusion || `کۆتایی و دەرئەنجامی توێژینەوەکە دوای کۆکردنەوە و هەڵسەنگاندنی Evidence دیاری دەکرێت.`
      };
    } catch (err: any) {
      console.error('Error in AcademicWritingEngineService:', err);
      return {
        researchQuestion: `پرسیاری پێشنیارکراو بۆ توێژینەوەی «${topic}»؛ پێویستی بە دیاریکردنی scope و پشکنینی ئەدەبیات هەیە.`,
        thesisStatement: `فرزیەی پێشنیارکراو بۆ «${topic}»؛ نابێت وەک دەرئەنجامی سەلمێنراو وەربگیرێت تا Evidence کۆنەکرێت و پشکنین نەکرێت.`,
        arguments: [
          {
            id: 'ARG-DRAFT-01',
            claim: `خاڵێکی شیکاری پێشنیارکراو بۆ «${topic}»؛ پێویستی بە بەڵگەی ڕەسەن هەیە.`,
            subArguments: ['ژێرپرسیاری یەکەم بۆ پشکنین', 'ژێرپرسیاری دووەم بۆ پشکنین'],
            evidenceQuotes: [],
            counterArguments: ['دژە-ئارگومێنتێکی ئەگەری دیاری بکە دوای خوێندنەوەی ئەدەبیات.'],
            synthesisKurdish: 'ئەم بونیادە تەنها scaffold ـە؛ پێویستە Claim و Evidence ـەکان لە سەرچاوەی ڕەسەنەوە پشتڕاست بکرێن.'
          }
        ],
        overallConclusion: 'دەرئەنجامی کۆتایی نابێت لە fallback ـدا دروست بکرێت؛ دوای کۆکردنەوەی Evidence و پشکنینی توێژەر پڕ دەکرێتەوە.'
      };
    }
  }
}

export const academicWritingEngineService = new AcademicWritingEngineService();
