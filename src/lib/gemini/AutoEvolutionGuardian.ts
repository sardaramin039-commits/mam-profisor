import { GeminiCoreEngine } from "./CoreEngine";

export interface DynamicAgentCapability {
  id: string;
  name: string;
  systemPrompt: string;
  mode: "deep_thinking" | "search_grounded" | "code_execution" | "fast_critic";
  autoInjectIntoThesis: boolean;
  createdAt: number;
}

export class AutoEvolutionGuardian {
  private static instance: AutoEvolutionGuardian;
  private capabilities: Map<string, DynamicAgentCapability> = new Map();
  private readonly STORAGE_KEY = "mam_auto_evolution_registry_v1";

  private constructor() {
    this.loadPersistedCapabilities();
    this.installGlobalSelfHealingHooks();
    void this.runAutonomousModelAndFeatureSync();
  }

  public static getInstance(): AutoEvolutionGuardian {
    if (!AutoEvolutionGuardian.instance) {
      AutoEvolutionGuardian.instance = new AutoEvolutionGuardian();
    }
    return AutoEvolutionGuardian.instance;
  }

  // Auto-discovers latest Gemini models & syncs any new AI Studio runtime prompts/agents
  public async runAutonomousModelAndFeatureSync(): Promise<void> {
    try {
      const engine = GeminiCoreEngine.getInstance();
      await engine.getOptimalModels();

      if (typeof window !== "undefined") {
        const winAny = window as any;
        winAny.__MAM_AUTO_EVOLUTION__ = this;

        // Automatically ingest any new prompts/agents injected via window.AI_STUDIO_DYNAMIC_AGENTS
        if (Array.isArray(winAny.AI_STUDIO_DYNAMIC_AGENTS)) {
          for (const item of winAny.AI_STUDIO_DYNAMIC_AGENTS) {
            if (item && item.id && item.systemPrompt) {
              this.registerCapability(item);
            }
          }
        }
      }
    } catch (err) {
      this.selfHealError("ModelAndFeatureSync", err);
    }
  }

  // Instantly registers any new prompt, agent, or rule into the live application
  public registerCapability(cap: Omit<DynamicAgentCapability, "createdAt">): void {
    const entry: DynamicAgentCapability = {
      ...cap,
      createdAt: Date.now()
    };
    this.capabilities.set(entry.id, entry);
    this.persistCapabilities();
  }

  public getActiveSystemAugmentations(): string {
    const active = Array.from(this.capabilities.values()).filter((c) => c.autoInjectIntoThesis);
    if (active.length === 0) return "";
    return (
      "\n\n[ڕێنمایی و تایبەتمەندییە خۆکارە نوێیەکانی جیمینی]:\n" +
      active.map((c) => `- (${c.name}): ${c.systemPrompt}`).join("\n")
    );
  }

  // Automatic self-healing wrapper for any async operation in the app
  public async executeWithSelfHealing<T>(
    operationName: string,
    task: () => Promise<T>,
    fallbackValue: T
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await task();
      } catch (err: any) {
        this.selfHealError(operationName, err);
        if (attempt === 3) return fallbackValue;
        await new Promise((r) => setTimeout(r, 900 * attempt));
      }
    }
    return fallbackValue;
  }

  private selfHealError(source: string, error: any): void {
    const msg = String(error?.message || error || "");
    if (msg.includes("Quota") || msg.includes("429") || msg.includes("API_KEY")) {
      try {
        const engine = GeminiCoreEngine.getInstance();
        (engine as any).rotateKey?.();
      } catch {}
    }
    console.warn(`[AutoEvolutionGuardian] Self-healed error in ${source}:`, msg);
  }

  private installGlobalSelfHealingHooks(): void {
    if (typeof window === "undefined") return;
    window.addEventListener("unhandledrejection", (event) => {
      const reason = String(event?.reason?.message || event?.reason || "");
      if (reason.includes("ChunkLoadError") || reason.includes("Failed to fetch dynamically imported module")) {
        event.preventDefault();
        window.location.reload();
      }
    });
  }

  private loadPersistedCapabilities(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed: DynamicAgentCapability[] = JSON.parse(raw);
          for (const item of parsed) {
            if (item?.id) this.capabilities.set(item.id, item);
          }
        }
      }
    } catch {}
  }

  private persistCapabilities(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(Array.from(this.capabilities.values()))
        );
      }
    } catch {}
  }
}

export const autoEvolutionGuardian = AutoEvolutionGuardian.getInstance();
