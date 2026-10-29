import { GoogleGenAI } from '@google/genai';
import { GeminiAutoEvolutionEngine, isTransientGeminiError } from './gemini-auto-evolution-engine';

const engine = new GeminiAutoEvolutionEngine(() => process.env['GEMINI_API_KEY'] || '');

export { isTransientGeminiError as isTransientError };
export { GeminiAutoEvolutionEngine } from './gemini-auto-evolution-engine';

export function getGeminiClient(): GoogleGenAI {
  return engine.getClient();
}

export async function discoverLatestGeminiModels(): Promise<{ pro: string; flash: string }> {
  return engine.discoverLatestModels();
}

export async function createGeminiAcademicContextCache(
  title: string,
  systemInstruction: string,
  referenceTexts: string[],
  ttlSeconds = 3600
): Promise<string | undefined> {
  return engine.createAcademicContextCache(title, systemInstruction, referenceTexts, ttlSeconds);
}
