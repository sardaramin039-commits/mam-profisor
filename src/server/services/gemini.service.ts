import { GoogleGenAI } from '@google/genai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function lowerErrorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error || '')).toLowerCase();
}

const SUPPORTED_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

function normalizeModelName(model: string): string {
  return model === 'gemini-2.0-flash' ? 'gemini-3.8-flash' : model;
}

function normalizeGeminiParams(params: Record<string, unknown>, model: string): Record<string, unknown> {
  const normalized = { ...params, model: normalizeModelName(model) };
  if (!normalized.config || typeof normalized.config !== 'object') return normalized;

  const config = { ...(normalized.config as Record<string, unknown>) };
  if (model === 'gemini-3.8-flash') {
    delete config['temperature'];
    delete config['topP'];
    delete config['topK'];
    delete config['candidateCount'];

    delete config['thinkingConfig'];
  }

  if (Array.isArray(config['tools']) && (config['tools'] as unknown[]).length > 0) {
    delete config['responseMimeType'];
  }

  return { ...normalized, config };
}

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();
  return (
    lowerMsg.includes('503') ||
    lowerMsg.includes('429') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('temporarily unavailable')
  );
}

let geminiClientsPool: GoogleGenAI[] = [];
let geminiKeySignature = '';
let nextClientIndex = 0;

export function getGeminiClient(): GoogleGenAI {
  const keysEnv = process.env['GEMINI_API_KEY'];
  if (!keysEnv || keysEnv.trim() === '') {
    return {
      models: {
        generateContent: async () => {
          throw new Error('GEMINI_API_KEY environment variable is missing.');
        }
      }
    } as unknown as GoogleGenAI;
  }

  const rawKeys = keysEnv.split(/[\s,;]+/).map(k => k.trim()).filter(k => k.length > 0);
  const keys = Array.from(new Set(rawKeys));
  if (keys.length === 0) {
    return {
      models: {
        generateContent: async () => {
          throw new Error('No valid keys found in GEMINI_API_KEY environment variable.');
        }
      }
    } as unknown as GoogleGenAI;
  }

  const keySignature = keys.join('|');
  if (geminiKeySignature !== keySignature) {
    geminiKeySignature = keySignature;
    nextClientIndex = 0;
    geminiClientsPool = keys.map((key, index) => {
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const originalGenerateContent = client.models.generateContent.bind(client.models);
      
      interface RobustGoogleGenAI {
        models: {
          generateContent: (params: unknown) => Promise<unknown>;
        };
        _originalGenerateContent?: (params: unknown) => Promise<unknown>;
      }

      const robustClient = client as unknown as RobustGoogleGenAI;
      
      robustClient.models.generateContent = async (params: unknown) => {
        let lastError: unknown = null;
        const typedParams = params as { model?: string; config?: Record<string, unknown>; [key: string]: unknown };
        const originalModel = normalizeModelName(typedParams?.model || 'gemini-3.8-flash');

        const modelSequence = [originalModel];
        for (const model of SUPPORTED_FALLBACK_MODELS) {
          if (!modelSequence.includes(model)) modelSequence.push(model);
        }

        for (const targetModel of modelSequence) {
          const currentParams = normalizeGeminiParams(typedParams, targetModel);

          for (let attempt = 0; attempt < keys.length; attempt++) {
            const activeIndex = (index + attempt) % keys.length;
            const activeClient = geminiClientsPool[activeIndex] as unknown as RobustGoogleGenAI;
            
            let lastKeyError: unknown = null;
            let success = false;
            let result: unknown = null;

            for (let retry = 0; retry < 3; retry++) {
              try {
                if (activeIndex === index) {
                  result = await originalGenerateContent(currentParams as unknown as Parameters<typeof client.models.generateContent>[0]);
                } else {
                  const fallbackMethod = activeClient._originalGenerateContent;
                  if (fallbackMethod) {
                    result = await fallbackMethod(currentParams as unknown as Parameters<typeof client.models.generateContent>[0]);
                  } else {
                    throw new Error('Fallback generateContent method is missing.');
                  }
                }
                success = true;
                break;
              } catch (error: unknown) {
                lastKeyError = error;
                const errMsg = error instanceof Error ? error.message : String(error);
                const isTransient = isTransientError(error);
                const message = lowerErrorMessage(error);
                
                console.warn(`[GEMINI ATTEMPT FAIL] SDK call failed for key index ${activeIndex} with model ${targetModel} (Attempt ${retry + 1}/3). Error: ${errMsg}.`);
                
                if (isTransient && retry < 2) {
                  const sleepTime = 1000 * (retry + 1) + Math.round(Math.random() * 1000);
                  console.warn(`[GEMINI RETRY] Transient error detected (e.g., high demand 503). Sleeping for ${sleepTime}ms before retry...`);
                  await delay(sleepTime);
                } else {
                  break;
                }
              }
            }

            if (success) {
              return result;
            }

            lastError = lastKeyError;
            const message = lowerErrorMessage(lastKeyError);
            const shouldTryNextModel =
              isTransientError(lastKeyError) ||
              message.includes('not found') ||
              (message.includes('model') && message.includes('unsupported'));

            if (!shouldTryNextModel) {
              throw lastKeyError;
            }
          }
        }
        const finalMsg = lastError instanceof Error ? lastError.message : String(lastError);
        throw new Error(`All ${keys.length} API keys and fallback models in the pool failed. Last error: ${finalMsg}`);
      };

      robustClient._originalGenerateContent = originalGenerateContent as (params: unknown) => Promise<unknown>;

      return client;
    });
  }

  const client = geminiClientsPool[nextClientIndex];
  nextClientIndex = (nextClientIndex + 1) % geminiClientsPool.length;
  return client;
}
