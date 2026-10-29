import { GoogleGenAI } from '@google/genai';
import { GeminiCoreEngine } from './gemini/core-engine';
import { isTransientGeminiError } from './gemini-auto-evolution-engine';

const engine = new GeminiCoreEngine();

export { isTransientGeminiError as isTransientError };
export { GeminiAutoEvolutionEngine } from './gemini-auto-evolution-engine';
export { GeminiCoreEngine } from './gemini/core-engine';
export type { GenerationRequestConfig, GeminiGenerationMode } from './gemini/core-engine';

export function getGeminiClient(): GoogleGenAI {
  return engine.getClient();
}

export async function discoverLatestGeminiModels(): Promise<{ pro: string; flash: string }> {
  return engine.getOptimalModels();
}

export async function generateGeminiContent<T = string>(
  request: import('./gemini/core-engine').GenerationRequestConfig
): Promise<T> {
  return engine.generate<T>(request);
}

export async function createGeminiAcademicContextCache(
  title: string,
  systemInstruction: string,
  referenceTexts: string[],
  ttlSeconds = 3600
): Promise<string | undefined> {
  return engine.createAcademicContextCache(title, systemInstruction, referenceTexts, ttlSeconds);
}
