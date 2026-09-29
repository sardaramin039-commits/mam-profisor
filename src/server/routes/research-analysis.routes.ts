import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT_ANALYZE_RIGOR } from '../../prompts/system-prompts';
import { robustParseJson } from '../utils/json-repair';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';
import { researchMethodsLabService } from '../services/research-methods-lab.service';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  academicRigorSchema,
  academicConsultationSchema,
  methodologySchema,
  multiAgentPipelineSchema,
  researchIntegrityAuditSchema,
  researchMethodsLabSchema
} from '../utils/academic-analysis.schemas';

export function createResearchAnalysisRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * Academic Rigor & Four-Module Analysis Endpoint
   */
  router.post('/analyze_academic_rigor', validateRequest(academicRigorSchema), async (req, res) => {
    try {
      const { title, content, discipline, theoreticalFramework, academicStyle } = req.body;
      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'ناوەڕۆکی بەش پێویستە بۆ هەڵسەنگاندن' });
        return;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_ANALYZE_RIGOR;
      const userPrompt = `پێشکەشکردنی هەڵسەنگاندنێکی ئەکادیمی زۆر قووڵ، ڕاستگۆ و بێ لایەن بۆ ئەم دەقە:
ناونیشانی کار: "${title || 'تێزی گشتی'}"
کایەی زانستی: "${discipline || 'گشتی'}"
چوارچێوەی تیۆری دیاریکراو: "${theoreticalFramework || 'critical_theory'}"
شێوازی سەرچاوەهێنانەوەی زانستی: "${academicStyle || 'harvard'}"

دەق بۆ شیکردنەوە:
"${content}"

تکایە داتاکان بخەرە سەر تەواوترین پێکهاتەی JSON بە زمانی کوردیی نووسراوی فەرمی (سۆرانی پێوەر).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (error) {
      console.error('Analyze academic rigor error:', error);
      const reqTitle = req.body.title || 'کارێکی ئەکادیمی';
      const reqContent = req.body.content || '';
      
      const fallbackResponse = {
        academicScore: null,
        toneEvaluation: 'هەڵسەنگاندنی خۆکار بەهۆی نەبوونی خزمەتگوزاریی ژیریی دەستکرد بەردەست نییە.',
        citationSuggestions: 'هیچ citation ی نوێ بە شێوەی ئۆفلاین دروست نەکراوە؛ سەرچاوەکان دەبێت بە شێوەی دەرەکی پشتڕاست بکرێنەوە.',
        plagiarismSimilarity: null,
        vocabularyComplexity: 'نەپشکنراو',
        sentencesReform: [],
        honestyCapExplanation: 'سیستەم نمرە، ڕێژەی هاوشێوەیی یان پەیوەندییە تیۆرییەکان لە کاتی نەبوونی AI خەملاندن ناکات.',
        requiredHumanActions: [
          'پێداچوونەوەی دەقی سەرەکی و دیاریکردنی خاڵە پێویستەکان بە شێوەی مرۆیی',
          'پشتڕاستکردنەوەی citation و بەڵگەکان لە سەرچاوە دەرەکییەکان'
        ],
        fallacies: [],
        hedgingChecks: [],
        theoreticalConsistency: {
          frameworkUsed: reqContent ? (req.body.theoreticalFramework || 'critical_theory') : 'critical_theory',
          status: 'not_verified',
          notes: 'هیچ پشتڕاستکردنەوەی تیۆری لە offline fallback ـدا نەکراوە.'
        },
        crossReferenceStatus: {
          citationCount: null,
          matchedCount: null,
          mismatches: []
        }
      };
      res.json(fallbackResponse);
    }
  });

  /**
   * Academic Consultation Assistant Endpoint
   */
  router.post('/academic_consultation', validateRequest(academicConsultationSchema), async (req, res) => {
    try {
      const { userQuestion, discipline, academicLevel, currentThesisContext } = req.body;
      if (!userQuestion) {
        res.status(400).json({ error: 'پرسیاری توێژەر پێویستە' });
        return;
      }

      const ai = getGeminiClient();
      const userPrompt = `وەک ڕاوێژکارێکی ئەکادیمی و بێلایەن، ڕێننمایی زانستی زۆر قووڵ بۆ ئەم پرسیارەی توێژەر بنووسە:
پرسیاری توێژەر: "${userQuestion}"
کایەی زانستی: "${discipline || 'گشتی'}"
ئاستی زانستی: "${academicLevel || 'ماستەر'}"
پاشخانی کارەکە: "${(currentThesisContext || '').slice(0, 500)}"

تکایە بە شێوازی JSON وەڵام بدەرەوە:
{
  "advisorResponse": "پێشنیار و وەڵامی زانستی زۆر قووڵ بە کوردیی سۆرانی",
  "methodologicalSteps": ["هەنگاوی یەکەم", "هەنگاوی دووەم"],
  "recommendedReadings": [],
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (err) {
      console.error('Academic consultation error:', err);
      res.status(500).json({ error: 'کێشەیەک لە ڕاوێژکاریی ئەکادیمی ڕوویدا' });
    }
  });

  /**
   * Methodology Construction Endpoint
   */
  router.post('/construct_methodology', validateRequest(methodologySchema), async (req, res) => {
    try {
      const { title, discipline, researchType, sampleSize } = req.body;
      const ai = getGeminiClient();
      const userPrompt = `مێتۆدۆلۆژیای زانستیی بونیاد بنێ بۆ ئەم توێژینەوەیە:
ناونیشان: "${title}"
کایە: "${discipline}"
جۆری توێژینەوە: "${researchType || 'چۆنایەتی و چەندایەتی'}"
قەبارەی نموونە: "${sampleSize || 'دیارینەکراو'}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "methodologyText": "دەقی چڕی مێتۆدۆلۆژیا بە کوردیی سۆرانی",
  "dataCollectionTools": ["کەرەستەی کۆکردنەوەی داتای ١", "کەرەستەی ٢"],
  "validityReliabilitySteps": ["هەنگاوی سەلماندنی دروستی و بەها"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (err) {
      console.error('Construct methodology error:', err);
      res.status(500).json({ error: 'کێشەیەک لە بونیادنانی مێتۆدۆلۆژی ڕوویدا' });
    }
  });

  /**
   * Research Integrity Audit: one professor-grade gate for study design and evidence hygiene.
   */
  router.post('/research_integrity_audit', validateRequest(researchIntegrityAuditSchema), async (req, res) => {
    try {
      const {
        title, discipline, academicLevel, researchQuestion, objectives, hypotheses,
        methodology, populationSample, variables, dataCollection, analysisPlan, ethics,
        draftText, bibliography
      } = req.body;

      const ai = getGeminiClient();
      const draft = typeof draftText === 'string' ? draftText.slice(0, 120000) : '';
      const refs = typeof bibliography === 'string' ? bibliography : '';
      const citationMarkers = (draft.match(/\([^)]+\)|\[[0-9,;\s-]+\]/g) || []).length;
      const bibliographyEntryCount = refs.split(/\n+/).map((item: string) => item.trim()).filter(Boolean).length;

      const prompt = [
        'وەک پڕۆفیسۆرێکی توێژینەوە و داوەری ئەکادیمی، Research Integrity Audit ئەنجام بدە.',
        'هیچ سەرچاوە، داتا، statistic، citation یان دەرئەنجامی نوێ لە خۆتەوە دروست مەکە.',
        'ئەگەر زانیارییەک نەدابینکراوە، بە ڕوونی نیشانی بدە کە کەمە یان پێویستی بە پشتڕاستکردنەوەی مرۆیی هەیە.',
        '',
        'ناونیشان: ' + title,
        'کایە: ' + (discipline || 'گشتی'),
        'ئاست: ' + (academicLevel || 'دیارینەکراو'),
        'پرسیاری توێژینەوە: ' + (researchQuestion || 'نەدابینکراو'),
        'ئامانجەکان: ' + (objectives || 'نەدابینکراو'),
        'فرضیەکان: ' + (hypotheses || 'نەدابینکراو'),
        'مێتۆدۆلۆژیا: ' + (methodology || 'نەدابینکراو'),
        'کۆمەڵگە/نموونە: ' + (populationSample || 'نەدابینکراو'),
        'گۆڕاوەکان: ' + (variables || 'نەدابینکراو'),
        'کۆکردنەوەی داتا: ' + (dataCollection || 'نەدابینکراو'),
        'پلانی شیکردنەوە: ' + (analysisPlan || 'نەدابینکراو'),
        'ئەخلاقی توێژینەوە: ' + (ethics || 'نەدابینکراو'),
        'ژمارەی citation-marker: ' + citationMarkers,
        'ژمارەی bibliography entry: ' + bibliographyEntryCount,
        'دەقی draft: ' + draft,
        '',
        'تەنها JSON بدەرەوە:',
        JSON.stringify({
          status: 'sound|needs_revision|insufficient_information',
          executiveAssessment: 'پوختەی پشکنین',
          alignment: [{ area: '...', status: 'aligned|partial|missing', finding: '...' }],
          criticalGaps: [{ area: 'methodology|sampling|measurement|analysis|ethics|evidence|citation|theory', severity: 'critical|major|minor', problem: '...', requiredAction: '...' }],
          claimsNeedingEvidence: [{ claim: '...', evidenceStatus: 'source_required|empirical_data_required|supported_by_provided_text|not_a_factual_claim', note: '...' }],
          reproducibilityChecklist: [{ item: '...', status: 'complete|partial|missing' }],
          citationAudit: {
            markerCount: citationMarkers,
            bibliographyEntryCount,
            interpretation: 'ئەم ژمارانە تەنها preflight ـن؛ بوونی citation بە مانای پشتڕاستبوونەوەی سەرچاوە نییە.'
          },
          nextActions: ['هەنگاوی یەکەم', 'هەنگاوی دووەم', 'هەنگاوی سێیەم']
        }, null, 2)
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      });

      const parsed = robustParseJson(response.text || '{}') as Record<string, unknown>;
      res.json({
        ...parsed,
        auditMeta: {
          model: 'gemini-3.8-flash',
          citationMarkerCount: citationMarkers,
          bibliographyEntryCount,
          evidencePolicy: 'no-invented-sources-or-data',
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Research integrity audit error:', err);
      res.status(500).json({ error: 'کێشەیەک لە Research Integrity Audit ـدا ڕوویدا.' });
    }
  });


  router.post('/research_methods_lab', validateRequest(researchMethodsLabSchema), async (req, res) => {
    try {
      const mode = req.body.mode;
      const result = researchMethodsLabService.run(mode, req.body.payload || {});
      res.json({ mode, result, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Research methods lab error:', error);
      res.status(400).json({ error: 'نەتوانرا شیکردنەوەی methodology تەواو بکرێت.' });
    }
  });
  /**
   * Real Sequential Multi-Agent Pipeline Execution Endpoint
   */
  router.post('/multi_agent_pipeline', validateRequest(multiAgentPipelineSchema), async (req, res) => {
    try {
      const { topic, discipline = 'گشتی', draftText = '', rawSources = [] } = req.body || {};

      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        res.status(400).json({ error: 'بابەتی توێژینەوە پێویستە.' });
        return;
      }

      const result = await multiAgentOrchestratorService.executePipeline(
        {
          topic: topic.trim().slice(0, 500),
          discipline: typeof discipline === 'string' ? discipline.trim().slice(0, 200) : 'گشتی',
          draftText: typeof draftText === 'string' ? draftText.slice(0, 250000) : '',
          rawSources: Array.isArray(rawSources) ? rawSources.slice(0, 100) : []
        },
        getGeminiClient
      );

      res.json({
        success: true,
        pipeline: result,
        integrityPolicy: {
          citations: 'verified-only',
          unverifiedClaims: 'blocked',
          exportGate: result.qaGateResult?.exportBlocked === true ? 'blocked' : 'review-required'
        }
      });
    } catch (err: unknown) {
      console.error('Multi-agent pipeline error:', err);
      res.status(500).json({ error: 'کێشەیەک لە ڕاکێشانی پڕۆسەی Multi-Agent دا ڕوویدا.' });
    }
  });

  return router;
}
