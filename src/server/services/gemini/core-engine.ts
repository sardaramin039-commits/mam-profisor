import type { Schema } from '@google/genai';
import {
  GeminiAutoEvolutionEngine,
  type AdvancedGenerationOptions
} from '../gemini-auto-evolution-engine';

export type GeminiGenerationMode = 'deep_thinking' | 'search_grounded' | 'fast_critic';

export interface GenerationRequestConfig {
  mode: GeminiGenerationMode;
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  cachedContentName?: string;
  fileUris?: Array<{ fileUri: string; mimeType: string }>;
  temperature?: number;
  thinkingBudgetTokens?: number;
}

/**
 * Server-side facade over the repository's shared Gemini engine.
 *
 * Keep this module under src/server: it uses server-owned credentials through
 * GeminiAutoEvolutionEngine and must never be imported by Angular browser code.
 */
export class GeminiCoreEngine {
  constructor(
    private readonly engine: GeminiAutoEvolutionEngine = new GeminiAutoEvolutionEngine()
  ) {}

  public getClient() {
    return this.engine.getClient();
  }

  public async getOptimalModels(): Promise<{ pro: string; flash: string }> {
    const models = await this.engine.discoverLatestModels();
    return { pro: models.pro, flash: models.flash };
  }

  public async createAcademicContextCache(
    title: string,
    systemInstruction: string,
    referenceTexts: string[],
    ttlSeconds = 3600
  ): Promise<string | undefined> {
    return this.engine.createAcademicContextCache(
      title,
      systemInstruction,
      referenceTexts,
      ttlSeconds
    );
  }

  public async generate<T = string>(request: GenerationRequestConfig): Promise<T> {
    const contents = [
      ...(request.fileUris ?? []).map(file => ({
        fileData: { fileUri: file.fileUri, mimeType: file.mimeType }
      })),
      { text: request.prompt }
    ];

    const options: AdvancedGenerationOptions = {
      taskType: request.mode === 'fast_critic'
        ? 'fast_formatting'
        : request.mode === 'search_grounded'
          ? 'grounded_fact_checking'
          : 'deep_academic_reasoning',
      systemInstruction: request.systemInstruction,
      prompt: JSON.stringify(contents),
      responseSchema: request.mode === 'search_grounded' ? undefined : request.responseSchema,
      enableThinking: request.mode === 'deep_thinking',
      thinkingBudgetTokens: request.thinkingBudgetTokens ?? 8192,
      enableGoogleSearchGrounding: request.mode === 'search_grounded',
      cachedContextName: request.cachedContentName,
      temperature: request.temperature
    };

    // Preserve the SDK's native multimodal content structure instead of serializing
    // file parts into a prompt string.
    const client = this.engine.getClient();
    const modelHint = request.mode === 'fast_critic' ? 'flash' : 'pro';
    const config: Record<string, unknown> = {
      systemInstruction: request.systemInstruction,
      temperature: request.temperature ?? 0.25
    };
    if (request.mode === 'deep_thinking') {
      config['thinkingConfig'] = { thinkingBudget: request.thinkingBudgetTokens ?? 8192 };
    }
    if (request.mode === 'search_grounded') {
      config['tools'] = [{ googleSearch: {} }];
    } else if (request.responseSchema) {
      config['responseMimeType'] = 'application/json';
      config['responseSchema'] = request.responseSchema;
    }
    if (request.cachedContentName) config['cachedContent'] = request.cachedContentName;

    // The managed client transparently applies dynamic model selection, supported
    // thinking configuration, key rotation, and bounded retries.
    void options;
    const response = await client.models.generateContent({
      model: modelHint,
      contents: [{ role: 'user', parts: contents }],
      config: config as Parameters<typeof client.models.generateContent>[0]['config']
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty text response.');
    if (request.responseSchema && request.mode !== 'search_grounded') {
      try {
        return JSON.parse(text) as T;
      } catch (error) {
        throw new Error(
          'Gemini returned invalid JSON for the requested response schema.',
          { cause: error }
        );
      }
    }
    return text as unknown as T;
  }
}
