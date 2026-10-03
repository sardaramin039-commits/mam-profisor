export type AiProvider = 'gemini' | 'openai' | 'claude' | 'perplexity';

export interface ProviderConfig {
  provider: AiProvider;
  name: string;
  isConfigured: boolean;
  hasKey: boolean;
  maskedKey: string;
  baseUrl: string;
  defaultModel: string;
  supportedModels: string[];
}

class ApiConfigService {
  private maskKey(key?: string): string {
    if (!key || key.trim() === '') return 'موجود نییە (Not set)';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '****' + trimmed.slice(-2);
    return trimmed.slice(0, 4) + '...' + trimmed.slice(-4);
  }

  private getConfiguredModels(provider: AiProvider): string[] {
    const raw = process.env[`${provider.toUpperCase()}_MODELS`]?.trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map(model => model.trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  private getDefaultModel(provider: AiProvider): string {
    return process.env[`${provider.toUpperCase()}_MODEL`]?.trim()
      || 'لە ڕێکخستنی deployment ـەوە دیاری نەکراوە';
  }

  public getProviderConfig(provider: AiProvider): ProviderConfig {
    const models = this.getConfiguredModels(provider);

    switch (provider) {
      case 'gemini': {
        const key = process.env['GEMINI_API_KEY'];
        return {
          provider,
          name: 'Google Gemini AI',
          isConfigured: Boolean(key?.trim()),
          hasKey: Boolean(key?.trim()),
          maskedKey: this.maskKey(key),
          baseUrl: process.env['GEMINI_BASE_URL'] || 'https://generativelanguage.googleapis.com',
          defaultModel: this.getDefaultModel(provider),
          supportedModels: models
        };
      }
      case 'openai': {
        const key = process.env['OPENAI_API_KEY'];
        return {
          provider,
          name: 'OpenAI API',
          isConfigured: Boolean(key?.trim()),
          hasKey: Boolean(key?.trim()),
          maskedKey: this.maskKey(key),
          baseUrl: process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1',
          defaultModel: this.getDefaultModel(provider),
          supportedModels: models
        };
      }
      case 'claude': {
        const key = process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY'];
        return {
          provider,
          name: 'Anthropic Claude API',
          isConfigured: Boolean(key?.trim()),
          hasKey: Boolean(key?.trim()),
          maskedKey: this.maskKey(key),
          baseUrl: process.env['ANTHROPIC_BASE_URL'] || 'https://api.anthropic.com/v1',
          defaultModel: this.getDefaultModel(provider),
          supportedModels: models
        };
      }
      case 'perplexity': {
        const key = process.env['PERPLEXITY_API_KEY'];
        return {
          provider,
          name: 'Perplexity API',
          isConfigured: Boolean(key?.trim()),
          hasKey: Boolean(key?.trim()),
          maskedKey: this.maskKey(key),
          baseUrl: process.env['PERPLEXITY_BASE_URL'] || 'https://api.perplexity.ai',
          defaultModel: this.getDefaultModel(provider),
          supportedModels: models
        };
      }
    }
  }

  public getAllProvidersConfig(): Record<AiProvider, ProviderConfig> {
    return {
      gemini: this.getProviderConfig('gemini'),
      openai: this.getProviderConfig('openai'),
      claude: this.getProviderConfig('claude'),
      perplexity: this.getProviderConfig('perplexity')
    };
  }

  public getApiKey(provider: AiProvider): string | undefined {
    switch (provider) {
      case 'gemini':
        return process.env['GEMINI_API_KEY'];
      case 'openai':
        return process.env['OPENAI_API_KEY'];
      case 'claude':
        return process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY'];
      case 'perplexity':
        return process.env['PERPLEXITY_API_KEY'];
    }
  }

  public validateProvider(provider: AiProvider): void {
    const key = this.getApiKey(provider);
    if (!key?.trim()) {
      throw new Error(
        `کلیلـی ئەی پی ئایی ${provider.toUpperCase()} لە ژینگەی سێرڤەردا دابین نەکراوە.`
      );
    }
  }
}

export const apiConfigService = new ApiConfigService();
