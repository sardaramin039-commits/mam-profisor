import { GoogleGenAI, Schema } from "@google/genai";

export interface GenerationRequestConfig {
  mode: "deep_thinking" | "search_grounded" | "fast_critic";
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  cachedContentName?: string;
  fileUris?: { fileUri: string; mimeType: string }[];
  temperature?: number;
}

export class GeminiCoreEngine {
  private static instance: GeminiCoreEngine;
  private apiKeys: string[] = [];
  private activeKeyIndex = 0;

  private discoveredProModel = "gemini-2.5-pro";
  private discoveredFlashModel = "gemini-2.5-flash";
  private lastDiscoveryTimestamp = 0;
  private readonly DISCOVERY_TTL = 1000 * 60 * 60 * 6;

  private constructor() {
    const envKeys =
      (typeof process !== "undefined" && (process.env?.["GEMINI_API_KEYS"] || process.env?.["GEMINI_API_KEY"])) ||
      (typeof window !== "undefined" && (window as any)?.["GEMINI_API_KEY"]) ||
      "";
    this.apiKeys = String(envKeys)
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
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
      this.apiKeys = valid;
      this.activeKeyIndex = 0;
    }
  }

  public getClient(): GoogleGenAI {
    const key = this.apiKeys[this.activeKeyIndex] || "";
    return new GoogleGenAI({ apiKey: key });
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    }
  }

  public async getOptimalModels(): Promise<{ pro: string; flash: string }> {
    const now = Date.now();
    if (now - this.lastDiscoveryTimestamp < this.DISCOVERY_TTL) {
      return { pro: this.discoveredProModel, flash: this.discoveredFlashModel };
    }

    try {
      const ai = this.getClient();
      const pager = await ai.models.list();
      const names: string[] = [];

      for await (const m of pager) {
        if (m.name) names.push(m.name.replace(/^models\//, ""));
      }

      const scoreModel = (name: string): number => {
        const verMatch = name.match(/gemini-(\d+(?:\.\d+)?)/);
        const base = verMatch ? parseFloat(verMatch[1]) * 100 : 0;
        const stabilityBonus = name.includes("exp") || name.includes("preview") ? 2 : 10;
        return base + stabilityBonus;
      };

      const proList = names
        .filter((n) => n.startsWith("gemini-") && n.includes("-pro") && !n.includes("vision"))
        .sort((a, b) => scoreModel(b) - scoreModel(a));

      const flashList = names
        .filter((n) => n.startsWith("gemini-") && n.includes("-flash") && !n.includes("8b"))
        .sort((a, b) => scoreModel(b) - scoreModel(a));

      if (proList.length > 0) this.discoveredProModel = proList[0];
      if (flashList.length > 0) this.discoveredFlashModel = flashList[0];
      this.lastDiscoveryTimestamp = now;
    } catch {
      // Fallback safely to default models
    }

    return { pro: this.discoveredProModel, flash: this.discoveredFlashModel };
  }

  public async createContextCache(
    displayName: string,
    systemInstruction: string,
    referenceTexts: string[],
    ttlSeconds = 3600
  ): Promise<string | undefined> {
    if (!referenceTexts || referenceTexts.length === 0) return undefined;
    try {
      const ai = this.getClient();
      const { pro } = await this.getOptimalModels();
      const cache = await ai.caches.create({
        model: pro,
        config: {
          displayName,
          systemInstruction,
          contents: referenceTexts.map((t) => ({ role: "user", parts: [{ text: t }] })),
          ttl: `${ttlSeconds}s`
        }
      });
      return cache.name;
    } catch {
      return undefined;
    }
  }

  public async generate<T = string>(req: GenerationRequestConfig): Promise<T> {
    const { pro, flash } = await this.getOptimalModels();
    const targetModel = req.mode === "fast_critic" ? flash : pro;
    const maxRetries = Math.max(3, this.apiKeys.length * 2);

    let useThinking = req.mode === "deep_thinking";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const ai = this.getClient();
        const config: Record<string, any> = {
          systemInstruction: req.systemInstruction,
          temperature: req.temperature ?? 0.3
        };

        if (useThinking) {
          config.thinkingConfig = { thinkingBudget: 8192 };
        }

        if (req.mode === "search_grounded") {
          config.tools = [{ googleSearch: {} }];
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

        if (!response.text) throw new Error("Empty model response.");

        if (req.responseSchema && req.mode !== "search_grounded") {
          return JSON.parse(response.text) as T;
        }
        return response.text as unknown as T;
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes("thinking")) {
          useThinking = false;
        }
        this.rotateKey();
        if (attempt === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }

    throw new Error("Gemini generation failed after maximum retries.");
  }
}
