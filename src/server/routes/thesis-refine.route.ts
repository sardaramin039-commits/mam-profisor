import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT_REFINE } from '../../prompts/system-prompts';
import { robustParseJson } from '../utils/json-repair';
import { disciplineProfileService } from '../services/discipline-profile.service';
import { humanScholarlyProseService } from '../services/human-scholarly-prose.service';
import { validateRequest } from '../../middleware/validate.middleware';
import { thesisRefineSchema } from '../utils/thesis-writing.schemas';

export function registerThesisRefineRoute(router: Router, getGeminiClient: () => GoogleGenAI): void {
  /**
   * Academic Kurdish Text Refinement and Enrichment Endpoint
   */
  router.post('/refine', validateRequest(thesisRefineSchema), async (req, res) => {
    const { text, discipline, tone, goal } = req.body;
    try {
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'مەتنی دەقەکە پێویستە بۆ ئەنجامدانی پاڵفتەکردن' });
        return;
      }
      
      if (text.length > 15000) {
        res.status(400).json({ 
          error: 'دەقەکەت زۆر درێژە (تکایە دەقێکی کەمتر لە ١٥,٠٠٠ کارەکتەر بنێرە بۆ پاراستنی خێرایی).' 
        });
        return;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_REFINE;

      const userPrompt = `شیکردنەوە و پاکنووسی ئەکادیمی بکە بۆ ئەم دەقە لای خوارەوە:
------------------------
دەق: "${text}"
بواری زانستی مەکینەیی: ${discipline || 'گشتی'}
شێوازی زمانەوانی دڵخواز: ${tone || 'فەرمی'}
ئامانجی چاکسازی: ${goal || 'بەرزکردنەوەی ئاستی گوتار'}
------------------------

تکایە بە شێوازی JSON وەڵام بدەرەوە بە تەواوی بەم پێکهاتەیە:
{
  "refinedText": "تەنها دەقی پاکنووسکراو؛ هیچ citation یان ناوی سەرچاوە زیاد مەکە ئەگەر لە دەقی سەرەتایی یان سەرچاوەی دابینکراو پشتگیری نەکراوە.",
  "diffs": [
    {
      "original": "بەشە کۆن یان ناڕێکەکەی ناو دەقەکە",
      "replacedWith": "بەشە چاککراو و بەرزکراوە نوێیەکە",
      "reason": "ڕوونکردنەوەی زمانەوانی بۆ هۆکاری گۆڕانکارییەکە"
    }
  ],
  "metrics": {
    "scholarlyScore": null,
    "vocabularyRichness": null,
    "readability": null,
    "status": "requires-grounded-evaluation"
  },
  "terminology": [
    {
      "foreignTerm": "زاراوە یان وشە بیانییە دۆزراوەکە",
      "kurdishTerm": "پیشنیاری هاوتای ئەکادیمیی کوردیی پاراو",
      "explanation": "شیکاری مانا و پێگەی بەکارهێنانی لە زانستدا"
    }
  ],
  "academicNotes": [
    "تێبینی و ئامۆژگاری زانستی پێویست بۆ توێژەرەکە سەبارەت بە لۆژیکی بابەتەکە"
  ],
  "citations": [] ,
  "visualizations": [
    {
      "type": "bar یان line یان pie یان comparison",
      "title": "ناونیشانی گرافی پێشنیارکراو بۆ پشتگیری داتا",
      "reason": "هۆکاری پێویستی ئەم گرافەیە بۆ خوێنەر",
      "labels": ["داتا ١", "داتا ٢"],
      "values": [75, 90]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: (req.body.model || req.body.ragModel || 'gemini-3.8-flash'),
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = robustParseJson(responseText) as Record<string, unknown>;
        const rawRefinedText = typeof parsed['refinedText'] === 'string'
          ? parsed['refinedText'].trim()
          : text;
        const profile = disciplineProfileService.getProfile(String(discipline || 'گشتی'));
        const prose = await humanScholarlyProseService.refine(
          rawRefinedText,
          profile,
          getGeminiClient
        );
        res.json({
          ...parsed,
          refinedText: prose.refinedText || rawRefinedText,
          prosePolicy: prose.stylePolicy,
          prosePreservationPassed: prose.preservationPassed !== false
        });
      } catch (parseErr) {
        console.error('Failed to parse response as JSON. Raw text:', responseText, parseErr);
        res.status(500).json({
          error: 'سەرکەوتوو نەبوو لە وەرگرتنی پێکهاتەی وەڵام لەسەر شێوازی فەرمی JSON',
          rawText: responseText
        });
      }

    } catch (error) {
      console.error('Refine endpoint error:', error);
      const fallbackResponse = {
        success: false,
        status: 'degraded',
        isFallback: true,
        refinedText: text,
        diffs: [],
        metrics: {
          scholarlyScore: null,
          vocabularyRichness: null,
          readability: null,
          status: 'unavailable'
        },
        terminology: [],
        academicNotes: [
          'AI نەبوو بەردەست؛ دەقی سەرەتایی بەبێ زیادکردنی بانگەشە یان citation ـی نوێ پارێزرا.'
        ],
        citations: [],
        bibliography: [],
        visualizations: []
      };
      res.status(503).json(fallbackResponse);
    }
  });

}
