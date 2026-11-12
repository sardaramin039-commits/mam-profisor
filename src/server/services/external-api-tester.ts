import { apiConfigService, AiProvider } from './api-config.service';

export interface ApiTestResult {
  provider: AiProvider;
  name: string;
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  message: string;
  isRateLimited: boolean;
  sampleOutput?: string;
  errorDetails?: string;
  timestamp: string;
}

export class ExternalApiTester {
  /**
   * Run connection & health test for a specific provider
   */
  public async testProvider(provider: AiProvider, testPrompt = 'پرسیاری تاقیکاری زانستی: پوختەیەک بنووسە.'): Promise<ApiTestResult> {
    const startTime = Date.now();
    const config = apiConfigService.getProviderConfig(provider);
    const timestamp = new Date().toISOString();

    if (!config.hasKey) {
      return {
        provider,
        name: config.name,
        success: false,
        latencyMs: 0,
        message: `کلیلـی ئەی پی ئایی ${provider.toUpperCase()} لە .env دابین نەکراوە.`,
        isRateLimited: false,
        timestamp
      };
    }

    try {
      if (provider === 'gemini') {
        const apiKey = apiConfigService.getApiKey('gemini')!;
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }]
          })
        });

        const latencyMs = Date.now() - startTime;
        if (res.status === 429) {
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: 429,
            latencyMs,
            message: 'کێشەی خێرایی (Rate limit 429): داواکارییەکان زۆرن. تکایە دوای کەمێکی تر هەوڵ بدەرەوە.',
            isRateLimited: true,
            timestamp
          };
        }

        if (!res.ok) {
          const errText = await res.text();
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: res.status,
            latencyMs,
            message: `وەڵامی هەڵە لە Gemini API (${res.status})`,
            errorDetails: errText,
            isRateLimited: false,
            timestamp
          };
        }

        const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'وەڵامی دروست گەڕایەوە.';

        return {
          provider,
          name: config.name,
          success: true,
          statusCode: 200,
          latencyMs,
          message: 'پەیوەندی بە Google Gemini سەرکەوتوو بوو.',
          sampleOutput: text.slice(0, 150) + '...',
          isRateLimited: false,
          timestamp
        };

      } else if (provider === 'openai') {
        const apiKey = apiConfigService.getApiKey('openai')!;
        const url = `${config.baseUrl}/responses`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: config.defaultModel,
            input: testPrompt,
            max_output_tokens: 50
          })
        });

        const latencyMs = Date.now() - startTime;
        if (res.status === 429) {
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: 429,
            latencyMs,
            message: 'کێشەی خێرایی OpenAI (Rate limit 429): بوودجە یان ڕێژەی داواکارییەکان گەیشتووەتە ئاستی بەرز.',
            isRateLimited: true,
            timestamp
          };
        }

        if (!res.ok) {
          const errText = await res.text();
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: res.status,
            latencyMs,
            message: `وەڵامی هەڵە لە OpenAI (${res.status})`,
            errorDetails: errText,
            isRateLimited: false,
            timestamp
          };
        }

        const data = await res.json() as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
        const text = data.output_text
          || data.output?.flatMap(item => item.content || [])
            .filter(item => item.type === 'output_text' && typeof item.text === 'string')
            .map(item => item.text || '').join('')
          || 'وەڵامی دروست گەڕایەوە.';

        return {
          provider,
          name: config.name,
          success: true,
          statusCode: 200,
          latencyMs,
          message: 'پەیوەندی بە OpenAI سەرکەوتوو بوو.',
          sampleOutput: text.slice(0, 150) + '...',
          isRateLimited: false,
          timestamp
        };

      } else if (provider === 'claude') {
        const apiKey = apiConfigService.getApiKey('claude')!;
        const url = `${config.baseUrl}/messages`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: config.defaultModel,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          })
        });

        const latencyMs = Date.now() - startTime;
        if (res.status === 429) {
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: 429,
            latencyMs,
            message: 'کێشەی خێرایی Claude (Rate limit 429): تێپەڕبوون لە سنووری داواکارییەکان.',
            isRateLimited: true,
            timestamp
          };
        }

        if (!res.ok) {
          const errText = await res.text();
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: res.status,
            latencyMs,
            message: `وەڵامی هەڵە لە Anthropic Claude (${res.status})`,
            errorDetails: errText,
            isRateLimited: false,
            timestamp
          };
        }

        const data = await res.json() as { content?: { text?: string }[] };
        const text = data.content?.[0]?.text || 'وەڵامی دروست گەڕایەوە.';

        return {
          provider,
          name: config.name,
          success: true,
          statusCode: 200,
          latencyMs,
          message: 'پەیوەندی بە Anthropic Claude سەرکەوتوو بوو.',
          sampleOutput: text.slice(0, 150) + '...',
          isRateLimited: false,
          timestamp
        };

      } else if (provider === 'perplexity') {
        const apiKey = apiConfigService.getApiKey('perplexity')!;
        const url = `${config.baseUrl}/chat/completions`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'user', content: testPrompt }]
          })
        });

        const latencyMs = Date.now() - startTime;
        if (res.status === 429) {
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: 429,
            latencyMs,
            message: 'کێشەی خێرایی Perplexity AI (Rate limit 429).',
            isRateLimited: true,
            timestamp
          };
        }

        if (!res.ok) {
          const errText = await res.text();
          return {
            provider,
            name: config.name,
            success: false,
            statusCode: res.status,
            latencyMs,
            message: `وەڵامی هەڵە لە Perplexity AI (${res.status})`,
            errorDetails: errText,
            isRateLimited: false,
            timestamp
          };
        }

        const data = await res.json() as { choices?: { message?: { content?: string } }[] };
        const text = data.choices?.[0]?.message?.content || 'وەڵامی دروست گەڕایەوە.';

        return {
          provider,
          name: config.name,
          success: true,
          statusCode: 200,
          latencyMs,
          message: 'پەیوەندی بە Perplexity AI سەرکەوتوو بوو.',
          sampleOutput: text.slice(0, 150) + '...',
          isRateLimited: false,
          timestamp
        };
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        provider,
        name: config.name,
        success: false,
        latencyMs,
        message: `کێشەی پچڕانی نەوتۆرک یان سێرڤەر: ${errorMsg}`,
        errorDetails: errorMsg,
        isRateLimited: false,
        timestamp
      };
    }

    return {
      provider,
      name: config.name,
      success: false,
      latencyMs: Date.now() - startTime,
      message: 'پڕۆڤایدەری نەناسراو.',
      isRateLimited: false,
      timestamp
    };
  }

  /**
   * Test all 4 AI providers in parallel
   */
  public async testAllProviders(): Promise<Record<AiProvider, ApiTestResult>> {
    const [gemini, openai, claude, perplexity] = await Promise.all([
      this.testProvider('gemini'),
      this.testProvider('openai'),
      this.testProvider('claude'),
      this.testProvider('perplexity')
    ]);

    return { gemini, openai, claude, perplexity };
  }
}

export const externalApiTester = new ExternalApiTester();
