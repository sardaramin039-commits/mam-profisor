import { GoogleGenAI } from '@google/genai';
import { discoverGeminiTextModels, modelSupportsThinkingBudget } from './gemini-model-selection';

interface CachedSelection {
  key: string;
  checkedAt: number;
  pro: string;
  flash: string;
}
const cacheByPosition = new Map<number, CachedSelection>();

function shouldRetry(error: unknown): boolean {
  const value = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  return /\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|quota|resource_exhausted|rate.?limit|overloaded|temporarily unavailable|fetch failed|networkerror|econnreset|etimedout|unauthorized|api key not valid|\b401\b|\b403\b/.test(value);
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function discover(key: string, position: number, ai: GoogleGenAI): Promise<CachedSelection> {
  const cached = cacheByPosition.get(position);
  if (cached?.key === key && Date.now() - cached.checkedAt < 6 * 60 * 60 * 1000) return cached;
  const pager = await ai.models.list();
  const models: Array<{ name?: string; supportedActions?: string[]; supportedGenerationMethods?: string[] }> = [];
  for await (const item of pager) models.push(item);
  const selected = discoverGeminiTextModels(models);
  const result: CachedSelection = { key, checkedAt: Date.now(), pro: selected.pro, flash: selected.flash };
  cacheByPosition.set(position, result);
  return result;
}

export async function generateGeminiTextWithRotation(
  keysInput: string[],
  startingIndex: number,
  contents: unknown,
  systemInstruction?: string,
  preferredRole?: 'pro' | 'flash'
): Promise<{ text: string; nextKeyIndex: number }> {
  const keys = [...new Set(keysInput.map(key => key.trim()).filter(Boolean))];
  if (!keys.length) throw new Error('No Gemini API key is configured in the browser session.');
  const prompt = typeof contents === 'string' ? contents : JSON.stringify(contents);
  const academicPrompt = /(?:proposal|outline|thesis|dissertation|doctoral|master|chapter|research plan|deep reasoning|پڕۆپۆزەڵ|پێڕست|ماستەر|دکتۆرا|توێژینەوە|تێزی|نامەی زانستی|بابەتی زانستی)/i.test(
    `${prompt} ${systemInstruction || ''}`
  );
  const role = academicPrompt ? 'pro' : preferredRole || 'flash';
  const maxAttempts = Math.min(8, Math.max(3, keys.length * 2));
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const index = (startingIndex + attempt) % keys.length;
    const ai = new GoogleGenAI({ apiKey: keys[index] });
    try {
      const models = await discover(keys[index], index, ai);
      const model = role === 'pro' ? models.pro : models.flash;
      const major = Number(model.match(/^gemini-(\d+)/i)?.[1] || 0);
      const config: Record<string, unknown> = { temperature: 0.3, maxOutputTokens: 8192 };
      if (role === 'pro') {
        config['thinkingConfig'] = modelSupportsThinkingBudget(model)
          ? { thinkingBudget: 8192 }
          : major >= 3 ? { thinkingLevel: 'HIGH' } : undefined;
        if (config['thinkingConfig'] === undefined) delete config['thinkingConfig'];
      }
      if (systemInstruction) config['systemInstruction'] = systemInstruction;
      const response = await ai.models.generateContent({ model, contents: prompt, config: config as Parameters<GoogleGenAI['models']['generateContent']>[0]['config'] });
      const text = response.text?.trim();
      if (!text) throw new Error('Gemini returned an empty text response.');
      return { text, nextKeyIndex: (index + 1) % keys.length };
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error)) throw error;
      if (attempt + 1 < maxAttempts) {
        await sleep(Math.min(8000, 500 * 2 ** Math.min(4, Math.floor(attempt / Math.max(1, keys.length)))));
      }
    }
  }
  throw new Error('Gemini failed after API-key rotation and exponential backoff. ' +
    (lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error')));
}
