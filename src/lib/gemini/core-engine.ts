import { GoogleGenAI, Schema } from "@google/genai";

export interface GenerationRequestConfig {
  mode: "deep_thinking" | "search_grounded" | "fast_critic";
  systemInstruction: string;
  prompt: string;
  responseSchema?: Schema;
  temperature?: number;
}

export class GeminiCoreEngine {
  private static instance: GeminiCoreEngine;
  private apiKeys: string[];
  private activeKeyIndex = 0;
  private discoveredProModel = "gemini-2.5-pro";
  private discoveredFlashModel = "gemini-2.5-flash";
  private lastDiscoveryTimestamp = 0;

  private constructor() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    this.apiKeys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
    if (this.apiKeys.length === 0) throw new Error("Missing GEMINI_API_KEY");
  }

  public static getInstance(): GeminiCoreEngine {
    if (!GeminiCoreEngine.instance) GeminiCoreEngine.instance = new GeminiCoreEngine();
    return GeminiCoreEngine.instance;
  }

  public getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: this.apiKeys[this.activeKeyIndex] });
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    }
  }

  public async getOptimalModels(): Promise<{ pro: string; flash: string }> {
    if (Date.now() - this.lastDiscoveryTimestamp < 1000 * 60 * 60 * 6) {
      return { pro: this.discoveredProModel, flash: this.discoveredFlashModel };
    }
    try {
      const pager = await this.getClient().models.list();
      const names: string[] = [];
      for await (const m of pager) {
        if (m.name) names.push(m.name.replace(/^models\//, ""));
      }
      const score = (n: string) => {
        const match = n.match(/gemini-(\d+(?:\.\d+)?)/);
        return (match ? parseFloat(match[1]) * 100 : 0) + (n.includes("preview") ? 2 : 10);
      };
      const pro = names.filter((n) => n.startsWith("gemini-") && n.includes("-pro")).sort((a, b) => score(b) - score(a));
      const flash = names.filter((n) => n.startsWith("gemini-") && n.includes("-flash")).sort((a, b) => score(b) - score(a));
      if (pro[0]) this.discoveredProModel = pro[0];
      if (flash[0]) this.discoveredFlashModel = flash[0];
      this.lastDiscoveryTimestamp = Date.now();
    } catch {}
    return { pro: this.discoveredProModel, flash: this.discoveredFlashModel };
  }

  public async generate<T = string>(req: GenerationRequestConfig): Promise<T> {
    const { pro, flash } = await this.getOptimalModels();
    const model = req.mode === "fast_critic" ? flash : pro;
    let useThinking = req.mode === "deep_thinking";
    const maxRetries = Math.max(3, this.apiKeys.length * 2);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const config: Record<string, any> = {
          systemInstruction: req.systemInstruction,
          temperature: req.temperature ?? 0.35
        };
        if (useThinking) config.thinkingConfig = { thinkingBudget: 8192 };
        if (req.mode === "search_grounded") {
          config.tools = [{ googleSearch: {} }];
        } else if (req.responseSchema) {
          config.responseMimeType = "application/json";
          config.responseSchema = req.responseSchema;
        }
        const res = await this.getClient().models.generateContent({
          model,
          contents: req.prompt,
          config
        });
        if (!res.text) throw new Error("Empty response");
        return req.responseSchema && req.mode !== "search_grounded" ? (JSON.parse(res.text) as T) : (res.text as unknown as T);
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes("thinking")) useThinking = false;
        this.rotateKey();
        if (attempt === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
    throw new Error("Generation failed");
  }
}
