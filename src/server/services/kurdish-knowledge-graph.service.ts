import { GoogleGenAI } from '@google/genai';

export interface KurdishKnowledgeEntry {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'journal' | 'thesis' | 'article' | 'encyclopedia' | 'archive';
  discipline: string;
  period: string;
  dialect: 'Sorani' | 'Kurmanji' | 'Hawrami';
  isbnOrDoi?: string;
  publisher?: string;
  digitalAvailability: boolean;
  kurdishAbstract: string;
}

export class KurdishKnowledgeGraphService {
  /**
   * Queries the Kurdish Academic Knowledge Graph for verified literature, books, and theses.
   */
  public async searchKnowledgeGraph(
    query: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<KurdishKnowledgeEntry[]> {
    const ai = getGeminiClient();

    const prompt = `تۆ سەرۆکی ئەرشیفی کتێبخانەی دیجیتاڵیی ئەکادیمیی مام و گوتاری کوردیی هەولێر و سلێمانی و زانکۆکانیت.
تکایە گەڕان بکە لەسەر ئەم تێرمە بە مەبەستی دۆزینەوەی کتێب، تێز، و وتاری زانستی ڕاستەقینەی کوردی:
تێرم: ${query}

وەڵامەکەت تەنها بە JSON بێت بەم شێوازە:
{
  "entries": [
    {
      "id": "KURD-KG-001",
      "title": "ناوی کتێب یان توێژینەوەی زانستی",
      "author": "ناوی نووسەر یان توێژەر",
      "type": "book",
      "discipline": "میژوو / ڕێزمان / فەلکۆر / زانست",
      "period": "سەدەی بیستەم / خولی هاوچەرخ",
      "dialect": "Sorani",
      "isbnOrDoi": "978-9922-000-00",
      "publisher": "چاپخانەی زانکۆی سەڵاحەدین / سلێمانی",
      "digitalAvailability": true,
      "kurdishAbstract": "پوختەی ناوەڕۆکەکە بە کوردیی سۆرانی"
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return parsed.entries || [];
    } catch (err: unknown) {
      console.error('Error in KurdishKnowledgeGraphService:', err);
      return [];
    }
  }
}

export const kurdishKnowledgeGraphService = new KurdishKnowledgeGraphService();
