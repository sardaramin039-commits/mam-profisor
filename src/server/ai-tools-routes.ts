import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildUserPromptForTool } from './ai-tools-prompts';
import { centralizedPromptsManager, AcademicToneVariant } from './prompts/centralized-prompts-manager';
import { apiConfigService } from './services/api-config.service';
import { generateDynamicAcademicFallback } from './services/dynamic-academic-fallback.service';
import { z } from 'zod';

interface OpenAiOrPerplexityResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

interface OpenAiResponsesResponse {
  output_text?: string;
  output?: {
    type?: string;
    content?: {
      type?: string;
      text?: string;
    }[];
  }[];
}

interface ClaudeResponse {
  content?: {
    text?: string;
  }[];
}

const executeSchema = z.object({
  toolId: z.string().trim().min(1).max(120),
  inputText: z.string().trim().min(1).max(250_000),
  options: z.object({
    toneVariant: z.enum(['formal_academic', 'critical', 'analytical', 'persuasive']).optional(),
    provider: z.enum(['auto', 'gemini', 'openai', 'claude', 'anthropic', 'perplexity', 'pplx']).optional(),
    model: z.string().trim().min(1).max(120).optional(),
    discipline: z.string().trim().max(120).optional(),
    academicLevel: z.string().trim().max(120).optional(),
    style: z.string().trim().max(40).optional(),
    tone: z.string().trim().max(80).optional(),
    language: z.string().trim().max(80).optional(),
  }).optional(),
}).strict();

function resolveProviderModel(
  provider: 'gemini' | 'openai' | 'claude' | 'perplexity',
  requestedModel: string | undefined
): string {
  const config = apiConfigService.getProviderConfig(provider);
  const model = requestedModel?.trim() || config.defaultModel;
  if (!config.supportedModels.includes(model)) {
    throw new Error(`مۆدێلی ${model} بۆ ${provider} لەم پڕۆژەیەدا ڕێگەپێدراو نییە.`);
  }
  return model;
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 45_000): Promise<globalThis.Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export function createAiToolsRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  router.post('/execute', async (req: Request, res: Response) => {
    const startTime = Date.now();
    let selectedVariant: AcademicToneVariant = 'formal_academic';

    try {
      const parsed = executeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'داتای ناردراو بۆ ئامرازەکە دروست نییە.',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      const { toolId, inputText, options } = parsed.data;
      const requestedVariant = options?.toneVariant as AcademicToneVariant | undefined;
      const { systemPrompt, variantUsed } = centralizedPromptsManager.getSystemPrompt(toolId, requestedVariant);
      selectedVariant = variantUsed;

      const userPrompt = buildUserPromptForTool(toolId, inputText, options);
      const provider = (options?.provider || 'auto').toLowerCase();

      let outputText = '';

      // Perplexity AI provider execution
      if (provider === 'perplexity' || provider === 'pplx' || (provider === 'auto' && process.env['PERPLEXITY_API_KEY'])) {
        apiConfigService.validateProvider('perplexity');
        const apiKey = apiConfigService.getApiKey('perplexity')!;
        const config = apiConfigService.getProviderConfig('perplexity');
        const modelName = resolveProviderModel('perplexity', options?.model);

        const pRes = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
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
        const modelName = resolveProviderModel('openai', options?.model);

        const openAiRes = await fetchWithTimeout(`${config.baseUrl}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            instructions: systemPrompt,
            input: userPrompt,
            max_output_tokens: 4096
          })
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          throw new Error(`پەیوەندی بە OpenAI Responses API سەرکەوتوو نەبوو (${openAiRes.status}): ${errText}`);
        }

        const openAiData = (await openAiRes.json()) as OpenAiResponsesResponse;
        outputText = openAiData.output_text
          || openAiData.output
            ?.flatMap(item => item.content || [])
            .filter(item => item.type === 'output_text' && typeof item.text === 'string')
            .map(item => item.text || '')
            .join('')
          || 'هیچ وەڵامێک لە OpenAI وەرنەگیرا.';

      // Anthropic / Claude provider execution
      } else if (provider === 'claude' || provider === 'anthropic' || (provider === 'auto' && (process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY']) && !process.env['GEMINI_API_KEY'])) {
        apiConfigService.validateProvider('claude');
        const apiKey = apiConfigService.getApiKey('claude')!;
        const config = apiConfigService.getProviderConfig('claude');
        const modelName = resolveProviderModel('claude', options?.model);

        const claudeRes = await fetchWithTimeout(`${config.baseUrl}/messages`, {
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
            max_tokens: 4096
          })
        });

        if (!claudeRes.ok) {
          const errText = await claudeRes.text();
          throw new Error(`پەیوەندی بە Claude/Anthropic سەرکەوتوو نەبوو (${claudeRes.status}): ${errText}`);
        }

        const claudeData = (await claudeRes.json()) as ClaudeResponse;
        outputText = claudeData.content?.[0]?.text || 'هیچ وەڵامێک لە Claude سەرچاوە نەگرت.';

      // Gemini provider execution (default)
      } else if (provider === 'auto' || provider === 'gemini') {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: resolveProviderModel('gemini', options?.model),
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
        isFallback: true,
        degraded: true
      });
    }
  });

  return router;
}
