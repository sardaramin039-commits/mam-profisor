import { GoogleGenAI } from '@google/genai';
import { GeminiAutoEvolutionEngine, getAutoEvolutionEngine } from './GeminiAutoEvolutionEngine';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();
  return (
    lowerMsg.includes('503') ||
    lowerMsg.includes('429') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('limit') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('demand') ||
    lowerMsg.includes('temporary')
  );
}

let geminiClientsPool: GoogleGenAI[] = [];
let nextClientIndex = 0;

export { getAutoEvolutionEngine };

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

  if (geminiClientsPool.length !== keys.length) {
    nextClientIndex = 0;
    const engine = getAutoEvolutionEngine();

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
        const typedParams = params as {
          model?: string;
          config?: { thinkingConfig?: { thinkingBudget?: number }; [key: string]: unknown };
          [key: string]: unknown;
        };

        // دۆزینەوەی خۆکاری نوێترین مۆدێلەکانی AI Studio بە شێوەی داینامیک
        const discovered = await engine.discoverLatestModels().catch(() => ({ pro: 'gemini-2.5-pro', flash: 'gemini-2.5-flash' }));
        const requestedModel = typedParams?.model;
        
        let targetModel = requestedModel;
        if (!targetModel || targetModel.includes('flash')) {
          targetModel = discovered.flash;
        } else if (targetModel.includes('pro')) {
          targetModel = discovered.pro;
        }

        const modelSequence = [targetModel, discovered.flash, discovered.pro].filter((v, i, a) => a.indexOf(v) === i);

        for (const currentTargetModel of modelSequence) {
          let currentParams = { ...typedParams, model: currentTargetModel };
          if (currentParams['config'] && typeof currentParams['config'] === 'object') {
            const cleanedConfig = { ...(currentParams['config'] as Record<string, unknown>) };
            if (!cleanedConfig['maxOutputTokens']) {
              cleanedConfig['maxOutputTokens'] = 8192;
            }
            // چالاککردنی Deep Thinking Budget (8192) بۆ مۆدێلە توانادارەکان
            if (
              !cleanedConfig['thinkingConfig'] &&
              (currentTargetModel.includes('pro') || currentTargetModel.includes('3.8') || currentTargetModel.includes('2.5'))
            ) {
              cleanedConfig['thinkingConfig'] = { thinkingBudget: 8192 };
            }
            const tools = cleanedConfig['tools'];
            if (tools && Array.isArray(tools) && tools.length > 0) {
              delete cleanedConfig['responseMimeType'];
            }
            currentParams = { ...currentParams, config: cleanedConfig };
          }

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

                console.warn(`[GEMINI ATTEMPT FAIL] SDK call failed for key index ${activeIndex} with model ${currentTargetModel} (Attempt ${retry + 1}/3). Error: ${errMsg}.`);

                // خۆچاککردنەوە لە کاتی کارنەکردنی thinkingBudget
                if (errMsg.toLowerCase().includes('thinking')) {
                  if (currentParams.config && typeof currentParams.config === 'object') {
                    delete (currentParams.config as Record<string, unknown>)['thinkingConfig'];
                  }
                }

                if (isTransient) {
                  const sleepTime = 1000 * Math.pow(2, retry);
                  console.warn(`[GEMINI RETRY] Transient/Quota error detected. Exponential backoff in ${sleepTime}ms...`);
                  await delay(sleepTime);
                } else {
                  break;
                }
              }
            }

            if (success) {
              return result;
            } else {
              lastError = lastKeyError;
              console.warn(`[GEMINI FAILOVER] Attempt exhausted for key index ${activeIndex} with model ${currentTargetModel}. Trying next key/model in pool...`);
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
