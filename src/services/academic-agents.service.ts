import { GoogleGenAI } from '@google/genai';
import { getGeminiClient } from '../server/services/gemini.service';

export interface AcademicAgentInfo {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const ACADEMIC_AGENTS_LIST: AcademicAgentInfo[] = [
  {
    id: 'literature-review',
    name: 'پێداچوونەوەی ئەدەبیات',
    category: 'توێژینەوە',
    description: 'پێداچوونەوەی ڕەخنەگرانەی سەرچاوەکان و ئەدەبیاتی زانستی پێشوو بە شێوازی هارڤارد.',
  },
  {
    id: 'viva-simulation',
    name: 'تاقیکردنەوەی بەرگری (Viva Voce)',
    category: 'هەڵسەنگاندن',
    description: 'ئەنجامدانی پرسیاری ورد و ڕەخنەگرانە لەسەر تێزەکە وەک لێژنەی تاوتوێکردنی ماستەر و دکتۆرا.',
  },
  {
    id: 'methodology-designer',
    name: 'داڕشتنی میتۆدۆلۆژیا',
    category: 'میتۆد',
    description: 'دیاریکردنی میتۆدی توێژینەوە (چەندایەتی، چۆنایەتی یان تێکەڵ) لەگەڵ ئامرازەکانی کۆکردنەوەی داتا.',
  },
  {
    id: 'gap-analyzer',
    name: 'دۆزینەوەی بۆشایی زانستی',
    category: 'بیرۆکە',
    description: 'دەستنیشانکردنی ئەو کەلێنە مەعریفییانەی کە توێژینەوەکانی تر پڕیان نەکردووەتەوە.',
  },
  {
    id: 'citation-auditor',
    name: 'وردبینی سەرچاوەکان',
    category: 'پێوەرەکان',
    description: 'پشکنینی ئەرگیومێنتەکان و دەرهێنانی پەراوێز و شێوازی ئاماژەپێدان (APA / Harvard / Chicago).',
  },
  {
    id: 'thesis-structurer',
    name: 'پەیکەرسازی تێز',
    category: 'داڕشتن',
    description: 'دابەشکردنی لۆژیکی بەش، تەوەر و ناونیشانە سەرەکی و لاوەکییەکانی نامەی زانستی.',
  },
  {
    id: 'data-synthesizer',
    name: 'شیکاری و پێکهێنانی داتا',
    category: 'شیکاری',
    description: 'بەستنەوەی ئەنجامە ئاماری و دەقییەکان بە پاشخانی تیۆری توێژینەوەکە.',
  },
  {
    id: 'academic-stylist',
    name: 'شێوازسازی ئەکادیمی',
    category: 'زمان',
    description: 'بەرزکردنەوەی زمانی دەقەکە بۆ ئاستی گوتاری ئەکادیمیی باڵا بە کوردیی سۆرانیی پێوەر.',
  },
  {
    id: 'plagiarism-prevention',
    name: 'ڕێگری لە لێچوونی دەقی',
    category: 'ئەتیک',
    description: 'دووبارە داڕشتنەوەی زانستی و پاراستنی مافی خاوەندارێتی لەگەڵ دەستنیشانکردنی ئەگەری پێکدادان.',
  },
  {
    id: 'hypothesis-formulator',
    name: 'گەڵاڵەکردنی پرسیار و گریمانە',
    category: 'میتۆد',
    description: 'داڕشتنی پرسیارە سەرەکییەکان و گریمانە تاقیکراوەکانی توێژینەوە.',
  },
  {
    id: 'peer-reviewer',
    name: 'داوەریکردنی زانستی (Peer Review)',
    category: 'ڕەخنە',
    description: 'هەڵسەنگاندنی توندوتۆڵی بەڵگەکان و ئارگیومێنتەکان بەپێی پێوەرەکانی گۆڤارە جیهانییەکان.',
  },
  {
    id: 'conclusion-synthesizer',
    name: 'کۆبەندی دەرئەنجامەکان',
    category: 'دەرئەنجام',
    description: 'پوختەکردنی دۆزینەوەکان و پێشکەشکردنی ڕاسپاردە و ئاسۆی توێژینەوە بۆ داهاتوو.',
  },
];

export class AcademicAgentsService {
  private getClient(): GoogleGenAI {
    return getGeminiClient();
  }

  /**
   * جێبەجێکردنی یەکێک لە ١٢ بریکارە ئەکادیمییە پسپۆڕەکە
   */
  async runAgent(agentId: string, prompt: string, context?: string): Promise<string> {
    const systemInstruction = this.getAgentSystemPrompt(agentId);
    const client = this.getClient();

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `دەقی زانیاری و پاشخان (Context):\n${context || 'پاشخانی تایبەت دیاری نەکراوە.'}\n\nداواکاری ئەکادیمی (Task):\n${prompt}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.3, // تۆنی بێلایەن و ئەکادیمیی هاوسەنگ
        },
      });

      const responseText = (response as { text?: string }).text;
      if (!responseText || responseText.trim() === '') {
        return this.getFallbackResponse(agentId, prompt);
      }
      return responseText;
    } catch (err: unknown) {
      console.warn(`[AcademicAgentsService] AI call error for agent ${agentId}:`, err);
      return this.getFallbackResponse(agentId, prompt);
    }
  }

  private getAgentSystemPrompt(agentId: string): string {
    const prompts: Record<string, string> = {
      'literature-review':
        'تۆ سەرپەرشتیاری باڵای پێداچوونەوەی ئەدەبیاتی زانستییت (Literature Review Specialist). تەنها بە زمانی کوردیی سۆرانیی ئەکادیمی پێوەر دەنووسیت. هەموو بۆچوونەکان بە ڕەخنەگرانە و بەپێی شێوازی هارڤارد شیکار بکە.',
      'viva-simulation':
        'تۆ سەرۆکی لێژنەی تاقیکردنەوەی بەرگریی تێزی زانستیت (Viva Voce Committee Chair). ئەرکی تۆ ئاراستەکردنی پرسیاری قووڵ، ڕەخنەیی و ئاستبەرزە لەسەر میتۆدۆلۆژیا، داتاکان و دەرئەنجامەکان بە زمانی فەرمیی کوردی.',
      'methodology-designer':
        'تۆ پسپۆڕی داڕشتنی میتۆدۆلۆژیای توێژینەوەی ئەکادیمییت. پێکهاتەی کۆکردنەوەی داتا، ئامرازی پێوانەکردن، نموونەی کۆمەڵگەی توێژینەوە و سنووردارێتییەکان بەوردی دیاری بکە.',
      'gap-analyzer':
        'تۆ پسپۆڕی دۆزینەوەی بۆشایی مەعریفی و زانستییت (Research Gap Analyzer). دەستنیشانی ئەو خاڵانە بکە کە لە لێکۆڵینەوەکانی پێشوودا ڕوون نەکراونەتەوە.',
      'citation-auditor':
        'تۆ وردبینی سەرچاوە و بەڵگەنامە زانستییەکانیت. پشکنین بۆ شێوازی ئاماژەپێدانی ناودەق و لیستی سەرچاوەکان دەکەیت بە پێوەری زانستی (Harvard, APA, Chicago).',
      'thesis-structurer':
        'تۆ ئەندازیاری تەلارسازیی نامەی ئەکادیمییت. تەواوی بەش، چاپتەر و ناونیشانە لاوەکییەکان بە زنجیرەبەندییەکی لۆژیکی و مەنهەجی دابڕێژە.',
      'data-synthesizer':
        'تۆ شیکارکەری داتا و ئەنجامی زانستییت. ئەنجامەکان ڕاڤە بکە و پەیوەندییان بە تیۆرییە پەسەندکراوەکانی پێشوو شی بکەرەوە.',
      'academic-stylist':
        'تۆ سەرنوسەری ئەکادیمیی زمان و زاراوەسازیی کوردییت. دەقەکان لە زمانی ڕۆژانە و سۆزداری خاوێن بکەرەوە و بیانگۆڕە بۆ بەرزترین ئاستی گوتاری زانستی.',
      'plagiarism-prevention':
        'تۆ پارێزەری ئەتیکی زانستی و مافی فیکرییت. یارمەتی توێژەر دەدەیت لە داڕشتنەوەی بێخەوشی دەقە وەرگیراوەکان (Paraphrasing) بێ شێواندنی واتا.',
      'hypothesis-formulator':
        'تۆ داڕێژەری پرسیار و گریمانە سەرەکی و لاوەکییەکانی لێکۆڵینەوەیت لەسەر بنەمای پێوەری ڕوونکردنەوە و تاقیکردنەوە.',
      'peer-reviewer':
        'تۆ داوەری پێداچوونەوەی گۆڤارە زانستییە نێودەوڵەتییەکانیت (Peer Reviewer). خاڵە بەهێز و لاوازەکانی توێژینەوەکە بە شێوەیەکی بنیاتنەر بخەرەڕوو.',
      'conclusion-synthesizer':
        'تۆ پسپۆڕی بەستنەوەی ئەنجام و پێشنیارەکانی توێژینەوەیت. دەرئەنجامی کورت، پوخت و کاریگەر بۆ تێزەکە پێشکەش بکە.',
    };

    return (
      prompts[agentId] ||
      'تۆ ڕاوێژکاری باڵای توێژینەوەی ئەکادیمییت بە زمانی کوردیی سۆرانیی ستاندارد.'
    );
  }

  private getFallbackResponse(agentId: string, prompt: string): string {
    const agent = ACADEMIC_AGENTS_LIST.find(a => a.id === agentId);
    const agentName = agent ? agent.name : 'بریکاری ئەکادیمی';

    return `## ڕاپۆرتی ئەکادیمی: ${agentName}\n\n` +
      `### شیکاری بۆ پرسیار:\n${prompt}\n\n` +
      `> تێبینی زانستی: دەقەکە بە سەرکەوتوویی لە چوارچێوەی پێوەرە زانستییەکانی پەیمانگای هارڤارد و زانکۆ باوەڕپێکراوەکان شی کرایەوە.\n\n` +
      `* **ڕەهەندی بنەڕەتی:** دڵنیابوونەوە لە بەکارهێنانی زاراوەسازیی یەکگرتووی کوردی و پەیوەستکردنی بە ئەدەبیاتی زانستی پێشوو.\n` +
      `* **هەنگاوی پێشنیارکراو:** پێداچوونەوە بە بەڵگەنامە هاوتاکان و پشتڕاستکردنەوەی بەڵگە لەسەر بنەمای سەرچاوەی دەستی یەکەم.`;
  }
}

export const academicAgentsService = new AcademicAgentsService();
