import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { discoverGeminiTextModels, discoverGeminiEmbeddingModel, modelSupportsExplicitCaching, modelSupportsThinkingBudget } from '../../lib/gemini-model-selection';

type GenerateParams = Parameters<GoogleGenAI['models']['generateContent']>[0];
type GenerateResponse = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;
type OriginalGenerate = (params: GenerateParams) => Promise<GenerateResponse>;
type EmbedParams = Parameters<GoogleGenAI['models']['embedContent']>[0];
type EmbedResponse = Awaited<ReturnType<GoogleGenAI['models']['embedContent']>>;
type OriginalEmbed = (params: EmbedParams) => Promise<EmbedResponse>;

export type AcademicGenerationTask = 'deep_academic_reasoning' | 'fast_formatting' | 'grounded_fact_checking';

export interface AdvancedGenerationOptions {
  taskType: AcademicGenerationTask;
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  enableThinking?: boolean;
  thinkingBudgetTokens?: number;
  enableGoogleSearchGrounding?: boolean;
  cachedContextName?: string;
  temperature?: number;
}

export const ACADEMIC_OUTLINE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    researchQuestion: { type: Type.STRING },
    thesisStatement: { type: Type.STRING },
    overallConclusion: { type: Type.STRING },
    arguments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          claim: { type: Type.STRING },
          subArguments: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidenceQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          counterArguments: { type: Type.ARRAY, items: { type: Type.STRING } },
          synthesisKurdish: { type: Type.STRING }
        },
        required: ['claim', 'subArguments', 'counterArguments', 'synthesisKurdish']
      }
    }
  },
  required: ['researchQuestion', 'thesisStatement', 'overallConclusion', 'arguments']
};

type CacheEntry = { fetchedAt: number; pro: string; flash: string; embedding?: string; all: string[] };
type ManagedClient = GoogleGenAI & { __mamManaged?: boolean };

function parseApiKeys(value: string | string[]): string[] {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.flatMap(item => item.split(/[\s,;]+/)).map(item => item.trim()).filter(Boolean))];
}

export function isTransientGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const value = message.toLowerCase();
  return /\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|resource_exhausted|quota|rate.?limit|overloaded|temporarily unavailable|econnreset|econnrefused|etimedout|enotfound|fetch failed|networkerror|api key not valid|permission_denied|unauthorized|\b401\b|\b403\b/.test(value);
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export class GeminiAutoEvolutionEngine {
  private readonly originals = new WeakMap<GoogleGenAI, OriginalGenerate>();
  private readonly modelCache = new WeakMap<GoogleGenAI, CacheEntry>();
  private readonly originalEmbeds = new WeakMap<GoogleGenAI, OriginalEmbed>();
  private clients: GoogleGenAI[] = [];
  private keyFingerprint = '';
  private nextKeyIndex = 0;

  constructor(private readonly readApiKeys: () => string[] | string = () => process.env['GEMINI_API_KEY'] || '') {}

  private refreshClients(): void {
    const keys = parseApiKeys(this.readApiKeys());
    const fingerprint = keys.join('\u0000');
    if (!keys.length) {
      this.clients = [];
      this.keyFingerprint = fingerprint;
      return;
    }
    if (fingerprint === this.keyFingerprint && this.clients.length === keys.length) return;

    this.keyFingerprint = fingerprint;
    this.nextKeyIndex = 0;
    this.clients = keys.map(apiKey => {
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'mam-profisor-academic-platform' } }
      }) as ManagedClient;
      const original = client.models.generateContent.bind(client.models) as OriginalGenerate;
      this.originals.set(client, original);
      (client.models as unknown as { generateContent: OriginalGenerate }).generateContent =
        async (params: GenerateParams) => this.generateWithRecovery(params);
      const originalEmbed = client.models.embedContent.bind(client.models) as OriginalEmbed;
      this.originalEmbeds.set(client, originalEmbed);
      (client.models as unknown as { embedContent: OriginalEmbed }).embedContent =
        async (params: EmbedParams) => this.embedWithRecovery(params);
      client.__mamManaged = true;
      return client;
    });
  }

  public getClient(): GoogleGenAI {
    this.refreshClients();
    if (!this.clients.length) {
      throw new Error('GEMINI_API_KEY is not configured. Configure one or more server-side keys.');
    }
    const client = this.clients[this.nextKeyIndex % this.clients.length];
    this.nextKeyIndex = (this.nextKeyIndex + 1) % this.clients.length;
    return client;
  }

  public async discoverLatestModels(client?: GoogleGenAI, forceRefresh = false): Promise<{ pro: string; flash: string; embedding?: string }> {
    this.refreshClients();
    const candidates = client && this.originals.has(client) ? [client, ...this.clients.filter(item => item !== client)] : this.clients;
    if (!candidates.length) throw new Error('No Gemini API key is configured for model discovery.');

    let lastError: unknown;
    for (const candidate of candidates) {
      const cached = this.modelCache.get(candidate);
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < 6 * 60 * 60 * 1000) {
        return { pro: cached.pro, flash: cached.flash, embedding: cached.embedding };
      }
      try {
        const pager = await candidate.models.list();
        const available: Array<{ name?: string; supportedActions?: string[]; supportedGenerationMethods?: string[] }> = [];
        for await (const model of pager) available.push(model);
        const selected = discoverGeminiTextModels(available);
        let embedding: string | undefined;
        try { embedding = discoverGeminiEmbeddingModel(available); } catch { /* Embeddings are optional for text-only tasks. */ }
        this.modelCache.set(candidate, { ...selected, embedding, fetchedAt: Date.now() });
        return { pro: selected.pro, flash: selected.flash, embedding };
      } catch (error) {
        lastError = error;
        if (!isTransientGeminiError(error)) continue;
      }
    }
    throw new Error('Gemini model discovery failed for every configured key. No hardcoded model fallback was used. ' + (lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error')));
  }

  private async chooseModel(client: GoogleGenAI, hint: string): Promise<{ model: string; deep: boolean }> {
    const role = /^(?:pro|deep|reasoning|deep_academic_reasoning)$/i.test(hint) || /(?:pro|reasoning|deep)/i.test(hint) ? 'pro' : 'flash';
    const selected = await this.discoverLatestModels(client);
    return { model: role === 'pro' ? selected.pro : selected.flash, deep: role === 'pro' };
  }

  private async generateWithRecovery(params: GenerateParams): Promise<GenerateResponse> {
    this.refreshClients();
    if (!this.clients.length) throw new Error('GEMINI_API_KEY is not configured.');
    const hint = String((params as unknown as { model?: string }).model || 'flash');
    const startIndex = (this.nextKeyIndex + this.clients.length - 1) % this.clients.length;
    const maxAttempts = Math.min(8, Math.max(3, this.clients.length * 2));
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const client = this.clients[(startIndex + attempt) % this.clients.length];
      const original = this.originals.get(client);
      if (!original) continue;

      try {
        const selected = await this.chooseModel(client, hint);
        const requested = params as unknown as { config?: Record<string, unknown>; [key: string]: unknown };
        const config: Record<string, unknown> = { ...(requested.config || {}) };
        if (selected.deep && config['thinkingConfig'] === undefined && config['thinkingConfig'] !== null) {
          if (modelSupportsThinkingBudget(selected.model)) {
            config['thinkingConfig'] = { thinkingBudget: 8192 };
          } else {
            config['thinkingConfig'] = { thinkingLevel: 'HIGH' };
          }
        } else if (config['thinkingConfig'] && !modelSupportsThinkingBudget(selected.model)) {
          const thinking = config['thinkingConfig'] as Record<string, unknown>;
          if ('thinkingBudget' in thinking) config['thinkingConfig'] = { thinkingLevel: 'HIGH' };
        }
        if (Array.isArray(config['tools']) && config['tools'].length > 0) {
          // Google Search grounding returns citation metadata; structured JSON mode is not mixed with it.
          delete config['responseSchema'];
          delete config['responseMimeType'];
        }
        const contents = params as unknown as Record<string, unknown>;
        const finalParams = {
          ...contents,
          model: selected.model,
          config
        } as unknown as GenerateParams;
        return await original(finalParams);
      } catch (error) {
        lastError = error;
        if (!isTransientGeminiError(error)) throw error;
        if (attempt + 1 < maxAttempts) {
          const delayMs = Math.min(8000, 500 * 2 ** Math.min(4, Math.floor(attempt / Math.max(1, this.clients.length))));
          await wait(delayMs);
        }
      }
    }
    throw new Error('Gemini generation failed after bounded key rotation and exponential backoff. ' + (lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error')));
  }

  private async embedWithRecovery(params: EmbedParams): Promise<EmbedResponse> {
    this.refreshClients();
    if (!this.clients.length) throw new Error('GEMINI_API_KEY is not configured.');
    const startIndex = (this.nextKeyIndex + this.clients.length - 1) % this.clients.length;
    const maxAttempts = Math.min(8, Math.max(3, this.clients.length * 2));
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const client = this.clients[(startIndex + attempt) % this.clients.length];
      const original = this.originalEmbeds.get(client);
      if (!original) continue;
      try {
        const selected = await this.discoverLatestModels(client);
        if (!selected.embedding) throw new Error('No dynamically discovered embedding model is available.');
        return await original({ ...(params as unknown as Record<string, unknown>), model: selected.embedding } as unknown as EmbedParams);
      } catch (error) {
        lastError = error;
        if (!isTransientGeminiError(error)) throw error;
        if (attempt + 1 < maxAttempts) {
          const delayMs = Math.min(8000, 500 * 2 ** Math.min(4, Math.floor(attempt / Math.max(1, this.clients.length))));
          await wait(delayMs);
        }
      }
    }
    throw new Error('Gemini embedding failed after bounded key rotation and exponential backoff. ' +
      (lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error')));
  }

  public async createAcademicContextCache(
    cacheTitle: string,
    systemInstruction: string,
    referenceTexts: string[],
    ttlSeconds = 3600
  ): Promise<string | undefined> {
    if (process.env['GEMINI_ENABLE_EXPLICIT_CACHE'] !== 'true') return undefined;
    const safeTexts = referenceTexts.filter(text => typeof text === 'string' && text.trim()).map(text => text.trim());
    if (!safeTexts.length) return undefined;

    this.refreshClients();
    for (const client of this.clients) {
      try {
        const selected = await this.discoverLatestModels(client);
        const cacheModel = selected.pro;
        if (!modelSupportsExplicitCaching(cacheModel)) {
          throw new Error('The selected model family does not support explicit caching; implicit caching remains available.');
        }
        const cache = await client.caches.create({
          model: cacheModel,
          config: {
            displayName: cacheTitle.slice(0, 128),
            systemInstruction,
            contents: safeTexts.map(text => ({ role: 'user', parts: [{ text }] })),
            ttl: `${Math.max(60, Math.min(86400, Math.floor(ttlSeconds)))}s`
          }
        });
        return cache.name;
      } catch (error) {
        if (isTransientGeminiError(error)) continue;
        console.warn('[Gemini context cache] Explicit cache unavailable; the request can use normal/implicit context caching.');
        return undefined;
      }
    }
    return undefined;
  }

  public async executeSmartGeneration<T = string>(options: AdvancedGenerationOptions): Promise<T> {
    const client = this.getClient();
    const modelHint = options.taskType === 'fast_formatting' ? 'flash' : 'pro';
    const config: Record<string, unknown> = {
      systemInstruction: options.systemInstruction,
      temperature: options.temperature ?? 0.25
    };
    if (options.enableThinking !== false && options.taskType === 'deep_academic_reasoning') {
      config['thinkingConfig'] = { thinkingBudget: options.thinkingBudgetTokens ?? 8192 };
    }
    if (options.enableGoogleSearchGrounding) {
      config['tools'] = [{ googleSearch: {} }];
    } else if (options.responseSchema) {
      config['responseMimeType'] = 'application/json';
      config['responseSchema'] = options.responseSchema;
    }
    if (options.cachedContextName) config['cachedContent'] = options.cachedContextName;

    const response = await client.models.generateContent({
      model: modelHint,
      contents: options.prompt,
      config: config as GenerateParams['config']
    });
    if (!response.text?.trim()) throw new Error('Gemini returned no text content.');
    if (options.responseSchema && !options.enableGoogleSearchGrounding) return JSON.parse(response.text) as T;
    return response.text as unknown as T;
  }
}
