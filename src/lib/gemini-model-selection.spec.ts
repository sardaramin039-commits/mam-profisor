import { describe, expect, it } from 'vitest';
import { discoverGeminiTextModels, discoverGeminiEmbeddingModel, modelSupportsExplicitCaching, modelSupportsThinkingBudget } from './gemini-model-selection';

describe('dynamic Gemini model discovery', () => {
  it('selects the newest available Pro and full Flash text models', () => {
    const result = discoverGeminiTextModels([
      { name: 'models/gemini-2.5-pro', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.1-pro-preview', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.6-flash-lite', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.8-flash', supportedActions: ['generateContent'] },
      { name: 'models/gemini-4-argon', supportedActions: ['generateContent'] },
      { name: 'models/gemini-embedding-2', supportedActions: ['embedContent'] },
      { name: 'models/gemini-3.8-flash-image-preview', supportedActions: ['generateContent'] }
    ]);

    expect(result.pro).toBe('gemini-3.1-pro-preview');
    expect(result.flash).toBe('gemini-3.8-flash');
    expect(result.all).not.toContain('gemini-embedding-2');
    expect(result.all.some(name => name.includes('image'))).toBe(false);
  });

  it('uses the strongest general text model when the account has no Pro tier model', () => {
    const result = discoverGeminiTextModels([
      { name: 'gemini-2.5-flash', supportedActions: ['generateContent'] },
      { name: 'gemini-4-argon', supportedActions: ['generateContent'] }
    ]);
    expect(result.pro).toBe('gemini-4-argon');
    expect(result.flash).toBe('gemini-2.5-flash');
  });

  it('rejects an empty or non-generation model inventory instead of using a fixed fallback', () => {
    expect(() => discoverGeminiTextModels([
      { name: 'gemini-embedding-2', supportedActions: ['embedContent'] }
    ])).toThrow(/did not return a supported Gemini text-generation model/i);
  });

  it('discovers the newest available embedding model using the model inventory', () => {
    const selected = discoverGeminiEmbeddingModel([
      { name: 'models/gemini-embedding-001', supportedActions: ['embedContent'] },
      { name: 'models/gemini-embedding-2', supportedActions: ['embedContent'] },
      { name: 'models/gemini-3.8-flash', supportedActions: ['generateContent'] }
    ]);
    expect(selected).toBe('gemini-embedding-2');
  });

  it('only enables explicit caching for model families documented to support it', () => {
    expect(modelSupportsExplicitCaching('gemini-3.8-flash')).toBe(true);
    expect(modelSupportsExplicitCaching('gemini-2.5-pro')).toBe(true);
    expect(modelSupportsExplicitCaching('gemini-4-argon')).toBe(false);
  });

  it('uses thinkingBudget only for Gemini 2.5, with thinking levels for newer generations', () => {
    expect(modelSupportsThinkingBudget('gemini-2.5-pro')).toBe(true);
    expect(modelSupportsThinkingBudget('gemini-3.8-flash')).toBe(false);
  });
});
