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

  public getProviderConfig(provider: AiProvider): ProviderConfig {
    switch (provider) {
      case 'gemini': {
        const key = process.env['GEMINI_API_KEY'];
        return {
          provider: 'gemini',
          name: 'Google Gemini AI',
          isConfigured: Boolean(key && key.trim() !== ''),
          hasKey: Boolean(key && key.trim() !== ''),
          maskedKey: this.maskKey(key),
          baseUrl: 'https://generativelanguage.googleapis.com',
          defaultModel: 'gemini-3.8-flash',
          supportedModels: ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash']
        };
      }
      case 'openai': {
        const key = process.env['OPENAI_API_KEY'];
        const baseUrl = process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1';
        return {
          provider: 'openai',
          name: 'OpenAI GPT Architecture (ChatGPT)',
          isConfigured: Boolean(key && key.trim() !== ''),
          hasKey: Boolean(key && key.trim() !== ''),
          maskedKey: this.maskKey(key),
          baseUrl,
          defaultModel: 'gpt-5.6-terra',
          supportedModels: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.6']
        };
      }
      case 'claude': {
        const key = process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY'];
        const baseUrl = process.env['ANTHROPIC_BASE_URL'] || 'https://api.anthropic.com/v1';
        return {
          provider: 'claude',
          name: 'Anthropic Claude AI',
          isConfigured: Boolean(key && key.trim() !== ''),
          hasKey: Boolean(key && key.trim() !== ''),
          maskedKey: this.maskKey(key),
          baseUrl,
          defaultModel: 'claude-sonnet-5',
          supportedModels: ['claude-fable-5', 'claude-mythos-5', 'claude-opus-5', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']
        };
      }
      case 'perplexity': {
        const key = process.env['PERPLEXITY_API_KEY'];
        const baseUrl = process.env['PERPLEXITY_BASE_URL'] || 'https://api.perplexity.ai';
        return {
          provider: 'perplexity',
          name: 'Perplexity AI Deep Research',
          isConfigured: Boolean(key && key.trim() !== ''),
          hasKey: Boolean(key && key.trim() !== ''),
          maskedKey: this.maskKey(key),
          baseUrl,
          defaultModel: 'sonar',
          supportedModels: ['sonar', 'sonar-reasoning', 'sonar-pro']
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
    if (!key || key.trim() === '') {
      throw new Error(`کلیلـی ئەی پی ئایی ${provider.toUpperCase()} لە ژینگەی سێرڤەردا دابین نەکراوە (.env)`);
    }
  }
}

export const apiConfigService = new ApiConfigService();
