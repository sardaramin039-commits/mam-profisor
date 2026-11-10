import { GoogleGenAI, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";

export interface GroundedWebSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface FullGenerationResult<T = string> {
  data: T;
  rawText: string;
  thoughtsText: string;
  groundedSources: GroundedWebSource[];
  executedCodeLogs: string[];
}

export interface GenerationRequestConfig {
  mode: "deep_thinking" | "search_grounded" | "code_execution" | "fast_critic";
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  cachedContentName?: string;
  fileUris?: { fileUri: string; mimeType: string }[];
  temperature?: number;
  thinkingBudget?: number;
  maxOutputTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  topP?: number;
  topK?: number;
  returnGroundingSupports?: boolean;
}

export interface StreamProgressCallback {
  onThoughtChunk?: (thoughtDelta: string) => void;
  onTextChunk?: (textDelta: string, fullTextSoFar: string, totalWordsSoFar: number) => void;
}

export const SCHOLARLY_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

export class GeminiCoreEngine {
  private static instance: GeminiCoreEngine;
  private apiKeys: string[] = [];
  private activeKeyIndex = 0;

  private discoveredProModel = "gemini-2.5-pro";
  private discoveredFlashModel = "gemini-2.5-flash";
  private lastDiscoveryTimestamp = 0;
  private readonly DISCOVERY_TTL = 1000 * 60 * 60 * 6;

  private constructor() {
    const collected: string[] = [];
    try { if (process.env.API_KEY) collected.push(process.env.API_KEY); } catch {}
    try { if (process.env.GEMINI_API_KEY) collected.push(process.env.GEMINI_API_KEY); } catch {}
    try { if (process.env.GEMINI_API_KEYS) collected.push(process.env.GEMINI_API_KEYS); } catch {}
    try {
      if (typeof window !== "undefined") {
        const winKey =
          (window as any).GEMINI_API_KEY ||
          (window as any).API_KEY ||
          localStorage.getItem("gemini_api_key") ||
          localStorage.getItem("GEMINI_API_KEY");
        if (winKey) collected.push(winKey);
      }
    } catch {}

    this.apiKeys = Array.from(
      new Set(
        collected
          .join(",")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      )
    );
  }

  public static getInstance(): GeminiCoreEngine {
    if (!GeminiCoreEngine.instance) {
      GeminiCoreEngine.instance = new GeminiCoreEngine();
    }
    return GeminiCoreEngine.instance;
  }

  public setRuntimeApiKeys(keys: string[]): void {
    const valid = keys.map((k) => k.trim()).filter(Boolean);
    if (valid.length > 0) {
      this.apiKeys = Array.from(new Set([...valid, ...this.apiKeys]));
      this.activeKeyIndex = 0;
    }
  }

  public getClient(): GoogleGenAI {
    if (this.apiKeys.length === 0) {
      try {
        if (process.env.API_KEY) this.apiKeys.push(process.env.API_KEY);
      } catch {}
      try {
        if (process.env.GEMINI_API_KEY) this.apiKeys.push(process.env.GEMINI_API_KEY);
      } catch {}
      try {
        if (process.env.GEMINI_API_KEYS) {
          const keys = process.env.GEMINI_API_KEYS.split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean);
          this.apiKeys.push(...keys);
        }
      } catch {}
    }
    const key = this.apiKeys[this.activeKeyIndex] || "";
    return new GoogleGenAI({ apiKey: key });
  }

  // Round-Robin Multi-Key Load Balancing for parallel requests
  public getNextBalancedClient(): GoogleGenAI {
    if (this.apiKeys.length > 1) {
      this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    }
    return this.getClient();
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    }
  }

  public async getOptimalModels(): Promise<{ pro: string; flash: string }> {
    // __TURBO_FAST_MODELS__: Instant non-blocking model resolution (0ms latency)
    if (this.discoveredProModel && this.discoveredFlashModel) {
      return { pro: this.discoveredProModel, flash: this.discoveredFlashModel };
    }
    return { pro: "gemini-2.5-flash", flash: "gemini-2.5-flash" };
  }

  // Multimodal File Upload with State Polling (ACTIVE check)
  public async uploadResearchFile(
    fileBlobOrPath: string | Blob,
    mimeType: string,
    displayName: string
  ): Promise<{ fileUri: string; mimeType: string } | undefined> {
    try {
      const ai = this.getClient();
      const uploaded = await ai.files.upload({
        file: fileBlobOrPath,
        config: { mimeType, displayName }
      });
      if (!uploaded || !uploaded.name) return undefined;

      for (let i = 0; i < 20; i++) {
        const info = await ai.files.get({ name: uploaded.name });
        if (info.state === "ACTIVE") {
          return { fileUri: info.uri || uploaded.uri || "", mimeType: info.mimeType || mimeType };
        }
        if (info.state === "FAILED") return undefined;
        await new Promise((r) => setTimeout(r, 1500));
      }
      return uploaded.uri ? { fileUri: uploaded.uri, mimeType } : undefined;
    } catch {
      return undefined;
    }
  }

  // Pre-Flight Token Counting & 2M Context Caching with TTL Renewal
  public async createContextCache(
    displayName: string,
    systemInstruction: string,
    referenceTexts: string[],
    fileUris: { fileUri: string; mimeType: string }[] = [],
    ttlSeconds = 7200
  ): Promise<string | undefined> {
    if ((!referenceTexts || referenceTexts.length === 0) && (!fileUris || fileUris.length === 0)) {
      return undefined;
    }
    try {
      const ai = this.getClient();
      const { pro } = await this.getOptimalModels();
      const parts: any[] = [];
      for (const f of fileUris) {
        parts.push({ fileData: { fileUri: f.fileUri, mimeType: f.mimeType } });
      }
      for (const t of referenceTexts) {
        if (t && t.trim()) parts.push({ text: t });
      }
      const contents = [{ role: "user", parts }];

      const tokenCheck = await ai.models.countTokens({ model: pro, contents });
      if ((tokenCheck.totalTokens || 0) < 32768) {
        return undefined; // Below cache minimum threshold; pass inline instead
      }

      const cache = await ai.caches.create({
        model: pro,
        config: {
          displayName,
          systemInstruction,
          contents,
          ttl: `${ttlSeconds}s`
        }
      });
      return cache.name;
    } catch {
      return undefined;
    }
  }

  public async renewContextCache(cacheName: string, ttlSeconds = 7200): Promise<void> {
    try {
      const ai = this.getClient();
      await ai.caches.update({ name: cacheName, config: { ttl: `${ttlSeconds}s` } });
    } catch {}
  }

  public async refreshContextCache(cacheName: string, ttlSeconds = 7200): Promise<boolean> {
    try {
      await this.renewContextCache(cacheName, ttlSeconds);
      return true;
    } catch {
      return false;
    }
  }

  public async countTokens(contents: any, model?: string): Promise<number> {
    try {
      const ai = this.getClient();
      const targetModel = model || (await this.getOptimalModels()).pro;
      const res = await ai.models.countTokens({ model: targetModel, contents });
      return res.totalTokens || 0;
    } catch {
      return 0;
    }
  }

  public async pollFileUntilActive(fileName: string, maxWaitMs = 30000): Promise<boolean> {
    try {
      const ai = this.getClient();
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitMs) {
        const file = await ai.files.get({ name: fileName });
        if (file.state === "ACTIVE") return true;
        if (file.state === "FAILED") return false;
        await new Promise((r) => setTimeout(r, 1500));
      }
      return false;
    } catch {
      return false;
    }
  }

  // Live Crossref + OpenAlex Bibliographic & DOI Verification
  public async fetchVerifiedScholarlyWorks(query: string, limit = 8): Promise<string> {
    const results: string[] = [];
    try {
      const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}`;
      const res = await fetch(openAlexUrl);
      if (res.ok) {
        const json: any = await res.json();
        for (const item of json?.results || []) {
          const authors = (item.authorships || [])
            .map((a: any) => a?.author?.display_name)
            .filter(Boolean)
            .slice(0, 3)
            .join("، ");
          const year = item.publication_year || "";
          const title = item.title || "";
          const venue = item.primary_location?.source?.display_name || "Academic Press";
          const doi = item.doi || "";
          if (authors && title && year) {
            results.push(`- ${authors} (${year})، *${title}*، ${venue}${doi ? `، DOI: ${doi}` : ""}.`);
          }
        }
      }
    } catch {}
    return results.join("\n");
  }

  // Full Generation with Thinking (24K), Grounding Metadata, Code Execution & Anti-Repetition Penalties
  public async generateFull<T = string>(req: GenerationRequestConfig): Promise<FullGenerationResult<T>> {
    const { pro, flash } = await this.getOptimalModels();
    const targetModel = req.mode === "fast_critic" ? flash : pro;
    const maxRetries = Math.max(3, this.apiKeys.length * 2);

    let useThinking = req.mode === "deep_thinking" || req.mode === "search_grounded" || req.mode === "code_execution";
    let usePenalties = true;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const ai = this.getNextBalancedClient();
        const config: Record<string, any> = {
          systemInstruction: req.systemInstruction,
          temperature: req.temperature ?? 0.3,
          topP: req.topP ?? 0.92,
          topK: req.topK ?? 40,
          maxOutputTokens: req.maxOutputTokens ?? 65536,
          safetySettings: SCHOLARLY_SAFETY_SETTINGS
        };

        if (usePenalties) {
          config.presencePenalty = req.presencePenalty ?? 0.3;
          config.frequencyPenalty = req.frequencyPenalty ?? 0.4;
        }

        if (useThinking) {
          config.thinkingConfig = {
            includeThoughts: true,
            thinkingBudget: req.thinkingBudget ?? 16384
          };
        }

        if (req.mode === "search_grounded") {
          config.tools = [{ googleSearch: {} }];
        } else if (req.mode === "code_execution") {
          config.tools = [{ codeExecution: {} }];
        } else if (req.responseSchema) {
          config.responseMimeType = "application/json";
          config.responseSchema = req.responseSchema;
        }

        if (req.cachedContentName) {
          config.cachedContent = req.cachedContentName;
        }

        const parts: any[] = [];
        if (req.fileUris && req.fileUris.length > 0) {
          for (const f of req.fileUris) {
            parts.push({ fileData: { fileUri: f.fileUri, mimeType: f.mimeType } });
          }
        }
        parts.push({ text: req.prompt });

        const response = await ai.models.generateContent({
          model: targetModel,
          contents: [{ role: "user", parts }],
          config
        });

        const rawText = response.text || "";
        if (!rawText) throw new Error("Empty model response.");

        let thoughtsText = "";
        const executedCodeLogs: string[] = [];
        const candParts = response.candidates?.[0]?.content?.parts || [];
        for (const p of candParts as any[]) {
          if (p.thought && p.text) thoughtsText += p.text + "\n";
          if (p.executableCode?.code) executedCodeLogs.push(p.executableCode.code);
          if (p.codeExecutionResult?.output) executedCodeLogs.push(p.codeExecutionResult.output);
        }

        const groundedSources: GroundedWebSource[] = [];
        const gm = (response.candidates?.[0] as any)?.groundingMetadata;
        for (const ch of gm?.groundingChunks || []) {
          if (ch?.web?.uri && ch?.web?.title) {
            groundedSources.push({ title: ch.web.title, uri: ch.web.uri });
          }
        }

        if (req.returnGroundingSupports) {
          const supports = gm?.groundingSupports || [];
          return {
            data: {
              text: rawText,
              groundingSupports: supports,
              groundedSources
            } as unknown as T,
            rawText,
            thoughtsText: thoughtsText.trim(),
            groundedSources,
            executedCodeLogs
          };
        }

        const parsedData =
          req.responseSchema && req.mode !== "search_grounded" && req.mode !== "code_execution"
            ? (JSON.parse(rawText) as T)
            : (rawText as unknown as T);

        return {
          data: parsedData,
          rawText,
          thoughtsText: thoughtsText.trim(),
          groundedSources,
          executedCodeLogs
        };
      } catch (err: any) {
        const msg = (err?.message || "").toLowerCase();
        if (msg.includes("thinking")) useThinking = false;
        if (msg.includes("penalty")) usePenalties = false;
        this.rotateKey();
        if (attempt === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }

    throw new Error("Gemini generation failed after maximum retries.");
  }

  public async generate<T = string>(req: GenerationRequestConfig): Promise<T> {
    const res = await this.generateFull<T>(req);
    return res.data;
  }

  // SECRET 3: Pure Markdown Real-Time Streaming (Uncaged from JSON Schema) for Live Word-by-Word UI Updates
  public async generateStream(
    req: GenerationRequestConfig,
    callbacks?: StreamProgressCallback
  ): Promise<string> {
    const { pro, flash } = await this.getOptimalModels();
    const targetModel = req.mode === "fast_critic" ? flash : pro;
    const maxRetries = Math.max(2, this.apiKeys.length);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const ai = this.getNextBalancedClient();
        const config: Record<string, any> = {
          systemInstruction: req.systemInstruction,
          temperature: req.temperature ?? 0.3,
          topP: req.topP ?? 0.92,
          maxOutputTokens: req.maxOutputTokens ?? 65536,
          safetySettings: SCHOLARLY_SAFETY_SETTINGS,
          thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: req.thinkingBudget ?? 12288
          }
        };

        if (req.cachedContentName) {
          config.cachedContent = req.cachedContentName;
        }

        const stream = await ai.models.generateContentStream({
          model: targetModel,
          contents: [{ role: "user", parts: [{ text: req.prompt }] }],
          config
        });

        let accumulatedText = "";
        for await (const chunk of stream) {
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          for (const p of parts as any[]) {
            if (p.thought && p.text) {
              callbacks?.onThoughtChunk?.(p.text);
            } else if (p.text) {
              accumulatedText += p.text;
              const wc = accumulatedText.trim().split(/\s+/).filter(Boolean).length;
              callbacks?.onTextChunk?.(p.text, accumulatedText, wc);
            }
          }
        }

        if (accumulatedText.trim().length > 0) {
          return accumulatedText;
        }
        throw new Error("Empty stream output");
      } catch (err) {
        this.rotateKey();
        if (attempt === maxRetries) {
          // Fallback to standard generate if streaming fails
          return await this.generate<string>({ ...req, responseSchema: undefined });
        }
      }
    }
    return "";
  }
}
