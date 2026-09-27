import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildUserPromptForTool } from './ai-tools-prompts';
import { centralizedPromptsManager, AcademicToneVariant } from './prompts/centralized-prompts-manager';
import { apiConfigService } from './services/api-config.service';
import { generateDynamicAcademicFallback } from './services/dynamic-academic-fallback.service';

interface OpenAiOrPerplexityResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

interface ClaudeResponse {
  content?: {
    text?: string;
  }[];
}

export function createAiToolsRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  router.post('/execute', async (req: Request, res: Response) => {
    const startTime = Date.now();
    let selectedVariant: AcademicToneVariant = 'formal_academic';

    try {
      const { toolId, inputText, options } = req.body || {};
      if (!toolId || typeof toolId !== 'string') {
        res.status(400).json({ error: 'toolId is required' });
        return;
      }

      const requestedVariant = options?.toneVariant as AcademicToneVariant | undefined;
      const { systemPrompt, variantUsed } = centralizedPromptsManager.getSystemPrompt(toolId, requestedVariant);
      selectedVariant = variantUsed;

      const userPrompt = buildUserPromptForTool(toolId, inputText, options);
      const provider = (options?.provider || 'auto').toLowerCase();

      let outputText = '';

      // Perplexity AI provider execution
      if (provider === 'perplexity' || provider === 'pplx' || (provider === 'auto' && (process.env['PERPLEXITY_API_KEY'] || req.body?.perplexityApiKey))) {
        apiConfigService.validateProvider('perplexity');
        const apiKey = req.body?.perplexityApiKey || apiConfigService.getApiKey('perplexity')!;
        const config = apiConfigService.getProviderConfig('perplexity');
        const modelName = options?.model || config.defaultModel;

        const pRes = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (!pRes.ok) {
          const errText = await pRes.text();
          throw new Error(`پەیوەندی بە Perplexity AI سەرکەوتوو نەبوو (${pRes.status}): ${errText}`);
        }

        const pData = (await pRes.json()) as OpenAiOrPerplexityResponse;
        outputText = pData.choices?.[0]?.message?.content || 'هیچ وەڵامێک لە Perplexity AI سەرچاوە نەگرت.';

      // OpenAI provider execution
      } else if (provider === 'openai' || (provider === 'auto' && process.env['OPENAI_API_KEY'] && !process.env['GEMINI_API_KEY'])) {
        apiConfigService.validateProvider('openai');
        const apiKey = apiConfigService.getApiKey('openai')!;
        const config = apiConfigService.getProviderConfig('openai');
        const modelName = options?.model || config.defaultModel;

        const openAiRes = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
          })
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          throw new Error(`پەیوەندی بە OpenAI سەرکەوتوو نەبوو (${openAiRes.status}): ${errText}`);
        }

        const openAiData = (await openAiRes.json()) as OpenAiOrPerplexityResponse;
        outputText = openAiData.choices?.[0]?.message?.content || 'هیچ وەڵامێک لە OpenAI سەرچاوە نەگرت.';

      // Anthropic / Claude provider execution
      } else if (provider === 'claude' || provider === 'anthropic' || (provider === 'auto' && (process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY']) && !process.env['GEMINI_API_KEY'])) {
        apiConfigService.validateProvider('claude');
        const apiKey = apiConfigService.getApiKey('claude')!;
        const config = apiConfigService.getProviderConfig('claude');
        const modelName = options?.model || config.defaultModel;

        const claudeRes = await fetch(`${config.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: modelName,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 4096,
            temperature: 0.3
          })
        });

        if (!claudeRes.ok) {
          const errText = await claudeRes.text();
          throw new Error(`پەیوەندی بە Claude/Anthropic سەرکەوتوو نەبوو (${claudeRes.status}): ${errText}`);
        }

        const claudeData = (await claudeRes.json()) as ClaudeResponse;
        outputText = claudeData.content?.[0]?.text || 'هیچ وەڵامێک لە Claude سەرچاوە نەگرت.';

      // Gemini provider execution (default)
      } else {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: options?.model || 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          }
        });
        outputText = response.text || 'هیچ وەڵامێک بەرهەم نەهات.';
      }

      centralizedPromptsManager.recordABMetric(selectedVariant, Date.now() - startTime, true);

      res.json({
        success: true,
        toolId,
        variantUsed: selectedVariant,
        output: outputText
      });

    } catch (err: unknown) {
      centralizedPromptsManager.recordABMetric(selectedVariant, Date.now() - startTime, false);
      console.warn('AI Tools execution error (triggering dynamic academic fallback):', err);
      
      const { toolId, inputText, options } = req.body || {};
      const fallbackOutput = generateDynamicAcademicFallback({
        toolId,
        inputText,
        discipline: options?.discipline,
        academicLevel: options?.academicLevel
      });

      res.json({
        success: true,
        toolId,
        variantUsed: selectedVariant,
        output: fallbackOutput,
        isFallback: true
      });
    }
  });

  return router;
}
