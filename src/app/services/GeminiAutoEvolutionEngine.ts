// GeminiAutoEvolutionEngine.ts
import { GoogleGenAI, Schema, Type } from '@google/genai';
import { Injectable } from '@angular/core';

export { Type };
export type { Schema };

export interface AdvancedGenerationOptions {
  taskType: 'deep_academic_reasoning' | 'fast_formatting' | 'grounded_fact_checking';
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  enableThinking?: boolean;
  thinkingBudgetTokens?: number;
  enableGoogleSearchGrounding?: boolean;
  cachedContextName?: string;
  temperature?: number;
}

interface EvolutionGenerationConfig {
  systemInstruction?: string;
  temperature?: number;
  thinkingConfig?: { thinkingBudget?: number };
  responseMimeType?: string;
  responseSchema?: Schema;
  tools?: Array<{ googleSearch: Record<string, never> }>;
  cachedContent?: string;
}

export class GeminiAutoEvolutionEngine {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  // هەڵگرتنی نوێترین مۆدێلە دۆزراوەکان بە شێوەی ئۆتۆماتیکی
  private latestProModel: string = 'gemini-2.5-pro';
  private latestFlashModel: string = 'gemini-2.5-flash';
  private lastModelCheckTime: number = 0;
  private readonly MODEL_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 6; // هەموو ٦ کاتژمێر جارێک خۆکارانە پشکنین دەکات

  constructor(apiKeys: string[]) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('پێویستە لانیکەم یەک کلیلی Gemini API دابین بکرێت.');
    }
    this.apiKeys = apiKeys.filter((k) => k && k.trim().length > 0);
    if (this.apiKeys.length === 0) {
      throw new Error('هیچ کلیلێکی باوەڕپێکراو لەناو لیستەکەدا نەدۆزرایەوە.');
    }
  }

  // ١. وەرگرتنی کڵاینتی چالاک و گۆڕینی خۆکاری کلیل لە کاتی دروستبوونی کێشەدا
  private getActiveClient(): GoogleGenAI {
    const key = this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
    return new GoogleGenAI({ apiKey: key });
  }

  private rotateApiKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.info(`گۆڕینی خۆکاری کلیلی API بۆ کلیلی ژمارە: ${this.currentKeyIndex + 1}`);
    }
  }

  // ٢. دۆزینەوەی خۆکاری نوێترین مۆدێلەکانی ناو Google AI Studio بێ دەستکاریکردنی کۆد
  public async discoverLatestModels(): Promise<{ pro: string; flash: string }> {
    const now = Date.now();
    if (now - this.lastModelCheckTime < this.MODEL_CHECK_INTERVAL_MS) {
      return { pro: this.latestProModel, flash: this.latestFlashModel };
    }

    try {
      const ai = this.getActiveClient();
      const modelsPager = await ai.models.list();
      const availableModelNames: string[] = [];

      for await (const model of modelsPager) {
        if (model.name) {
          // پاککردنەوەی پێشگری "models/"
          const cleanName = model.name.replace(/^models\//, '');
          availableModelNames.push(cleanName);
        }
      }

      // فلتەرکردن و ڕیزکردنی مۆدێلەکان بەپێی نوێترین ژمارەی وەشان (بۆ نموونە 3.0 پێش 2.5 پێش 2.0)
      const rankModelVersion = (name: string): number => {
        const match = name.match(/gemini-(\d+(?:\.\d+)?)/);
        const versionScore = match ? parseFloat(match[1]) * 100 : 0;
        const previewBonus = name.includes('exp') || name.includes('preview') ? 5 : 10; // پێشینە بۆ وەشانی جێگیر
        return versionScore + previewBonus;
      };

      const proCandidates = availableModelNames
        .filter((n) => n.startsWith('gemini-') && n.includes('-pro') && !n.includes('vision'))
        .sort((a, b) => rankModelVersion(b) - rankModelVersion(a));

      const flashCandidates = availableModelNames
        .filter((n) => n.startsWith('gemini-') && n.includes('-flash') && !n.includes('8b'))
        .sort((a, b) => rankModelVersion(b) - rankModelVersion(a));

      if (proCandidates.length > 0) this.latestProModel = proCandidates[0];
      if (flashCandidates.length > 0) this.latestFlashModel = flashCandidates[0];

      this.lastModelCheckTime = now;
      console.info(
        `[Auto-Evolution] نوێترین مۆدێلە دۆزراوەکان چالاک کران -> Pro: ${this.latestProModel} | Flash: ${this.latestFlashModel}`
      );
    } catch (error) {
      console.warn('پشکنینی مۆدێلە نوێیەکان سەرکەوتوو نەبوو، کار بە دوایین مۆدێلی ناسراو دەکرێت.', error);
    }

    return { pro: this.latestProModel, flash: this.latestFlashModel };
  }

  // ٣. دروستکردنی Context Cache بۆ هەڵگرتنی کتێب، سەرچاوە و پێڕستی تێزەکە لە بیرگەی جیمینیدا
  public async createAcademicContextCache(
    cacheTitle: string,
    systemInstruction: string,
    largeReferenceTexts: string[],
    ttlSeconds: number = 3600
  ): Promise<string | undefined> {
    try {
      const ai = this.getActiveClient();
      const { pro } = await this.discoverLatestModels();

      const cache = await ai.caches.create({
        model: pro,
        config: {
          displayName: cacheTitle,
          systemInstruction,
          contents: largeReferenceTexts.map((txt) => ({
            role: 'user',
            parts: [{ text: txt }]
          })),
          ttl: `${ttlSeconds}s`
        }
      });

      return cache.name;
    } catch (err) {
      console.warn('Context Caching بەردەست نەبوو یان قەبارەی دەقەکە کەمترە لە سنووری کاش:', err);
      return undefined;
    }
  }

  // ٤. فەنکشنی ناوەندیی زیرەک کە هەموو تایبەتمەندییەکانی AI Studio پێکەوە بەکاردەهێنێت
  public async executeSmartGeneration<T = string>(options: AdvancedGenerationOptions): Promise<T> {
    const { pro, flash } = await this.discoverLatestModels();
    const selectedModel = options.taskType === 'fast_formatting' ? flash : pro;

    let lastError: unknown;
    const maxAttempts = Math.max(3, this.apiKeys.length * 2);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const ai = this.getActiveClient();

        // ئامادەکردنی کۆنفیگی پێشکەوتووی جیمینی
        const config: EvolutionGenerationConfig = {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.35
        };

        // ا. چالاککردنی قووڵبیرکردنەوە (Thinking Mode) بۆ کارە ئەکادیمییە قورسەکان
        if (options.enableThinking !== false && options.taskType === 'deep_academic_reasoning') {
          config.thinkingConfig = {
            thinkingBudget: options.thinkingBudgetTokens ?? 8192
          };
        }

        // ب. چالاککردنی JSON Schema ئەگەر داواکرابێت (بێ تێکگیران لەگەڵ Search Grounding)
        if (options.responseSchema && !options.enableGoogleSearchGrounding) {
          config.responseMimeType = 'application/json';
          config.responseSchema = options.responseSchema;
        }

        // ج. چالاککردنی گەڕانی زیندووی گووگڵ (Google Search Grounding) بۆ پشتڕاستکردنەوەی سەرچاوەکان
        if (options.enableGoogleSearchGrounding) {
          config.tools = [{ googleSearch: {} }];
        }

        // د. بەستنەوەی بیرگەی کاشکراو (Context Cache) ئەگەر هەبێت
        if (options.cachedContextName) {
          config.cachedContent = options.cachedContextName;
        }

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: options.prompt,
          config
        });

        if (!response.text) {
          throw new Error('وەڵامی مۆدێلەکە بەتاڵ بوو.');
        }

        if (options.responseSchema && !options.enableGoogleSearchGrounding) {
          return JSON.parse(response.text) as T;
        }

        return response.text as unknown as T;
      } catch (error: any) {
        lastError = error;
        console.warn(`هەوڵی ژمارە ${attempt} تووشی کێشە بوو (${error?.message || error}). گۆڕینی کلیل و هەوڵدانەوە...`);

        // ئەگەر مۆدێلەکە پاڵپشتیی thinkingConfigـی نەکرد، بیکوژێنەرەوە و دووبارە هەوڵ بدەرەوە
        if (error?.message?.includes('thinking')) {
          options.enableThinking = false;
        }

        this.rotateApiKey();
        await new Promise((res) => setTimeout(res, 1500 * attempt));
      }
    }

    throw new Error(`شکست لە جێبەجێکردنی داواکارییەکە دوای ${maxAttempts} هەوڵ: ${lastError}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAutoEvolutionService {
  private engineInstance: GeminiAutoEvolutionEngine | null = null;

  public getEngine(): GeminiAutoEvolutionEngine {
    if (!this.engineInstance) {
      const keys: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('MAM_GEMINI_API_KEYS') || '';
          keys.push(...stored.split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean));
        } catch {}
      }
      if (keys.length === 0) {
        keys.push('default_client_key');
      }
      this.engineInstance = new GeminiAutoEvolutionEngine(keys);
    }
    return this.engineInstance;
  }
}
