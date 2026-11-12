// GeminiAutoEvolutionEngine.ts (Client-side proxy to server endpoints)
import { Injectable } from '@angular/core';

export type Schema = Record<string, any>;
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

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

export class GeminiAutoEvolutionEngine {
  private latestProModel: string = 'gemini-3.8-flash';
  private latestFlashModel: string = 'gemini-3.8-flash';

  constructor(_apiKeys: string[] = []) {
    // API keys are now securely managed on the server
  }

  // ١. دۆزینەوەی مۆدێلەکان لە ڕێگەی سێرڤەرەوە
  public async discoverLatestModels(): Promise<{ pro: string; flash: string }> {
    try {
      const resp = await fetch('/api/gemini/models');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.models) {
          this.latestProModel = data.models.pro || 'gemini-3.8-flash';
          this.latestFlashModel = data.models.flash || 'gemini-3.8-flash';
          return { pro: this.latestProModel, flash: this.latestFlashModel };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch models from server, using defaults:', err);
    }
    return { pro: this.latestProModel, flash: this.latestFlashModel };
  }

  // ٢. دروستکردنی Context Cache لەسەر سێرڤەر
  public async createAcademicContextCache(
    cacheTitle: string,
    systemInstruction: string,
    largeReferenceTexts: string[],
    ttlSeconds: number = 3600
  ): Promise<string | undefined> {
    try {
      const resp = await fetch('/api/gemini/context-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cacheTitle,
          systemInstruction,
          largeReferenceTexts,
          ttlSeconds
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.cacheName;
      }
    } catch (err) {
      console.warn('Server context cache error:', err);
    }
    return undefined;
  }

  // ٣. بەڕێوەبردنی ژیریی دەستکرد لە ڕێگەی /api/gemini/smart-generate لەسەر سێرڤەر
  public async executeSmartGeneration<T = string>(options: AdvancedGenerationOptions): Promise<T> {
    try {
      const resp = await fetch('/api/gemini/smart-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: options.taskType,
          systemInstruction: options.systemInstruction,
          prompt: options.prompt,
          responseSchema: options.responseSchema,
          enableThinking: options.enableThinking !== false,
          thinkingBudgetTokens: options.thinkingBudgetTokens ?? 8192,
          enableGoogleSearchGrounding: options.enableGoogleSearchGrounding,
          cachedContextName: options.cachedContextName,
          temperature: options.temperature ?? 0.35
        })
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Server returned HTTP ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Smart generation failed');
      }

      if (options.responseSchema && !options.enableGoogleSearchGrounding) {
        if (typeof data.result === 'object') {
          return data.result as T;
        }
        if (typeof data.result === 'string') {
          return JSON.parse(data.result) as T;
        }
      }

      return (data.result ?? '') as unknown as T;
    } catch (error: any) {
      console.error('ExecuteSmartGeneration client error:', error);
      throw error;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAutoEvolutionService {
  private engineInstance: GeminiAutoEvolutionEngine | null = null;

  public getEngine(): GeminiAutoEvolutionEngine {
    if (!this.engineInstance) {
      this.engineInstance = new GeminiAutoEvolutionEngine([]);
    }
    return this.engineInstance;
  }
}
