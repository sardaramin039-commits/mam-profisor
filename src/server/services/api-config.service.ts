import fs from 'node:fs';
import path from 'node:path';
import { parse as parseDotenv } from 'dotenv';

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

const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{26,}$/;

export function parseKeyPool(raw?: string | string[]): string[] {
  if (!raw) return [];
  const joined = Array.isArray(raw) ? raw.join(',') : String(raw);
  return Array.from(new Set(
    joined
      .split(/[\s,،٫;|\r\n]+/)
      .map(key => key.trim().replace(/^["']|["']$/g, ''))
      .filter(key => GEMINI_KEY_PATTERN.test(key))
  )).slice(0, 60);
}

export function refreshGeminiEnvironment(): string[] {
  const fileValues: string[] = [];
  const envPaths = Array.from(new Set([
    path.join(process.cwd(), '.env'),
    path.join(path.dirname(process.cwd()), '.env')
  ]));

  for (const envPath of envPaths) {
    try {
      const parsed = parseDotenv(fs.readFileSync(envPath));
      fileValues.push(parsed['GEMINI_API_KEY'] || '', parsed['MAM_GEMINI_API_KEYS'] || '');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  const envKeys = parseKeyPool([
    process.env['GEMINI_API_KEY'],
    process.env['MAM_GEMINI_API_KEYS'],
    ...fileValues
  ]);
  if (envKeys.length > 0) {
    process.env['GEMINI_API_KEY'] = envKeys.join(',');
  }
  return envKeys;
}

class ApiConfigService {
  private geminiApiKeys: string[] = [];
  private runtimeGeminiApiKeys: string[] = [];

  private parseGeminiKeys(...values: Array<string | undefined>): string[] {
    return parseKeyPool(values);
  }

  public getApiKeys(environmentKeys = refreshGeminiEnvironment()): string[] {
    this.geminiApiKeys = this.runtimeGeminiApiKeys.length > 0
      ? [...this.runtimeGeminiApiKeys]
      : environmentKeys;
    return [...this.geminiApiKeys];
  }

  public setApiKeys(rawKeys: string | string[]): string[] {
    const keys = parseKeyPool(rawKeys);
    if (keys.length === 0) {
      throw new Error('No valid Gemini API keys were provided.');
    }
    this.runtimeGeminiApiKeys = keys;
    this.geminiApiKeys = [...keys];
    return [...keys];
  }

  private maskKey(key?: string): string {
    if (!key || key.trim() === '') return 'موجود نییە (Not set)';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '****' + trimmed.slice(-2);
    return trimmed.slice(0, 4) + '...' + trimmed.slice(-4);
  }

  private readonly DEFAULT_MODELS: Record<AiProvider, string> = {
    gemini: 'gemini-3.8-flash',
    openai: 'gpt-4o',
    claude: 'claude-3-7-sonnet-20250219',
    perplexity: 'sonar'
  };

  private readonly DEFAULT_SUPPORTED_MODELS: Record<AiProvider, string[]> = {
    gemini: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'o1-mini', 'gpt-4.5-preview'],
    claude: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    perplexity: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-deep-research']
  };

  private getConfiguredModels(provider: AiProvider): string[] {
    const raw = process.env[`${provider.toUpperCase()}_MODELS`]?.trim();
    if (!raw) return this.DEFAULT_SUPPORTED_MODELS[provider] || [];
    return raw
      .split(',')
      .map(model => model.trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  private getDefaultModel(provider: AiProvider): string {
    return process.env[`${provider.toUpperCase()}_MODEL`]?.trim()
      || this.DEFAULT_MODELS[provider]
      || 'gemini-3.8-flash';
  }

  public getProviderConfig(provider: AiProvider): ProviderConfig {
    const models = this.getConfiguredModels(provider);

    switch (provider) {
      case 'gemini': {
        const key = this.getApiKeys()[0];
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
        return this.getApiKeys()[0];
      case 'openai':
        return process.env['OPENAI_API_KEY'];
      case 'claude':
        return process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_API_KEY'];
      case 'perplexity':
        return process.env['PERPLEXITY_API_KEY'];
    }
  }

  public validateProvider(provider: AiProvider): void {
    const configured = provider === 'gemini'
      ? this.getApiKeys().length > 0
      : Boolean(this.getApiKey(provider)?.trim());
    if (!configured) {
      throw new Error(
        `کلیلـی ئەی پی ئایی ${provider.toUpperCase()} لە ژینگەی سێرڤەردا دابین نەکراوە.`
      );
    }
  }
}

export const apiConfigService = new ApiConfigService();
