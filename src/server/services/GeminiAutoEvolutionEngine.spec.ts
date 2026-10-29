import { describe, expect, it, vi } from 'vitest';
import { GeminiAutoEvolutionEngine } from './GeminiAutoEvolutionEngine';

describe('GeminiAutoEvolutionEngine', () => {
  it('throws an error if no API keys are provided', () => {
    expect(() => new GeminiAutoEvolutionEngine([])).toThrow(
      'پێویستە لانیکەم یەک کلیلی Gemini API دابین بکرێت.'
    );
  });

  it('initializes with valid API keys and rotates properly', () => {
    const engine = new GeminiAutoEvolutionEngine(['key-1', 'key-2', 'key-3']);
    const client1 = engine.getActiveClient();
    expect(client1).toBeDefined();

    engine.rotateApiKey();
    const client2 = engine.getActiveClient();
    expect(client2).toBeDefined();
  });

  it('ranks and discovers the latest pro and flash models dynamically from models.list', async () => {
    const engine = new GeminiAutoEvolutionEngine(['mock-key']);

    const mockModels = [
      { name: 'models/gemini-2.0-flash' },
      { name: 'models/gemini-2.5-pro' },
      { name: 'models/gemini-2.5-flash' },
      { name: 'models/gemini-3.1-pro-preview' },
      { name: 'models/gemini-3.8-flash' },
      { name: 'models/text-embedding-004' }
    ];

    // Mock getActiveClient models.list
    vi.spyOn(engine as any, 'getActiveClient').mockReturnValue({
      models: {
        list: vi.fn(async function* () {
          for (const m of mockModels) {
            yield m;
          }
        }),
        generateContent: vi.fn(async () => ({ text: 'response' }))
      }
    });

    const models = await engine.discoverLatestModels();
    expect(models.pro).toBe('gemini-3.1-pro-preview');
    expect(models.flash).toBe('gemini-3.8-flash');
  });

  it('executes smart generation with thinkingConfig enabled for deep reasoning', async () => {
    const engine = new GeminiAutoEvolutionEngine(['mock-key']);
    const generateContentMock = vi.fn(async (_params: any) => ({
      text: JSON.stringify({ result: 'academic depth' })
    }));

    vi.spyOn(engine as any, 'getActiveClient').mockReturnValue({
      models: {
        list: vi.fn(async function* () {
          yield { name: 'models/gemini-2.5-pro' };
          yield { name: 'models/gemini-2.5-flash' };
        }),
        generateContent: generateContentMock
      }
    });

    const result = await engine.executeSmartGeneration({
      taskType: 'deep_academic_reasoning',
      systemInstruction: 'You are an academic scholar',
      prompt: 'Analyze theoretical framework',
      enableThinking: true,
      thinkingBudgetTokens: 8192
    });

    expect(result).toBeDefined();
    expect(generateContentMock).toHaveBeenCalled();
    const callArgs = generateContentMock.mock.calls[0][0];
    expect(callArgs.config.thinkingConfig).toEqual({ thinkingBudget: 8192 });
  });

  it('rotates API key and retries on failure', async () => {
    const engine = new GeminiAutoEvolutionEngine(['key-1', 'key-2']);
    let callCount = 0;

    vi.spyOn(engine as any, 'getActiveClient').mockImplementation(() => {
      callCount++;
      return {
        models: {
          list: vi.fn(async function* () {
            yield { name: 'models/gemini-2.5-pro' };
            yield { name: 'models/gemini-2.5-flash' };
          }),
          generateContent: vi.fn(async () => {
            if (callCount === 1) {
              throw new Error('429 Quota Exceeded');
            }
            return { text: 'Success after key rotation' };
          })
        }
      };
    });

    const result = await engine.executeSmartGeneration({
      taskType: 'fast_formatting',
      systemInstruction: '',
      prompt: 'format this text'
    });

    expect(result).toBe('Success after key rotation');
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});
