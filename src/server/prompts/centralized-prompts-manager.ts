import {
  SYSTEM_PROMPT_REFINE,
  SYSTEM_PROMPT_REVIEW_STRUCTURE,
  SYSTEM_PROMPT_GENERATE_CHAPTER,
  SYSTEM_PROMPT_ANALYZE_RIGOR,
  SYSTEM_PROMPT_EXPAND_GLOSSARY,
  SYSTEM_PROMPT_SUGGEST_SOURCES,
  SYSTEM_PROMPT_HARVARD_FEATURES,
  SYSTEM_PROMPT_AI_INTEGRITY_AUDIT,
  SYSTEM_PROMPT_SUMMARIZE_THESIS_CONTEXT
} from '../../prompts/system-prompts';

export type AcademicToneVariant = 'formal_academic' | 'literary_sorani' | 'simplified_pedagogical' | 'harvard_standard';

export interface PromptVariantConfig {
  variantId: AcademicToneVariant;
  nameKurdish: string;
  nameEnglish: string;
  description: string;
  toneInstruction: string;
  weight: number; // For A/B test sampling distribution
}

export const ACADEMIC_TONE_VARIANTS: Record<AcademicToneVariant, PromptVariantConfig> = {
  formal_academic: {
    variantId: 'formal_academic',
    nameKurdish: 'شێوازی فەرمی و زانستیی چڕ',
    nameEnglish: 'Formal Academic Standard',
    description: 'داڕشتنی ڕەوان، فەرمی، زاراوەی توندوتۆڵی زانستی و ڕەچاوکردنی تەواوی پێوەرە ئەکادیمییەکان.',
    toneInstruction: `[A/B TONE: FORMAL ACADEMIC STANDARD]
داڕشتنەکە دەبێت بە کوردییەکی سۆرانیی فەرمیی زۆر بەرز، بێلایەن، زانستی، و دوور لە دەربڕینی سۆزداری یان زمانی کۆڵان بێت. زاراوە زانستییەکان بە هاوتا ئینگلیزییەکان لەناو کەوانە دابنێ.`,
    weight: 0.35
  },
  literary_sorani: {
    variantId: 'literary_sorani',
    nameKurdish: 'شێوازی سۆرانیی ئەدەبی و فەلسەفیی ڕەسەن',
    nameEnglish: 'Literary & Philosophical Sorani',
    description: 'کەڵک وەرگرتن لە وشەسازیی دەوڵەمەندی سۆرانی، نەرمیی ڕستەسازی و چەمکسازیی قووڵی فەلسەفی.',
    toneInstruction: `[A/B TONE: LITERARY & PHILOSOPHICAL SORANI]
داڕشتنەکە دەبێت خاوەن ڕیتمێکی ڕەسەنی زمانەوانی، نەرمی لە گواستنەوەی چەمکەکان و قووڵایی فەلسەفی و مێژوویی بێت، بە ڕەچاوکردنی ڕێزمانی بێخەوشی زمانی کوردی.`,
    weight: 0.25
  },
  simplified_pedagogical: {
    variantId: 'simplified_pedagogical',
    nameKurdish: 'شێوازی شیکاریی پۆلێنکراو و ڕوونکەرەوە',
    nameEnglish: 'Simplified Pedagogical Analysis',
    description: 'پۆلێنکردنی بیرۆکە ئاڵۆزەکان بە خاڵبەندی ڕوون، نموونەی کرداری و ڕوونکردنەوەی فێرکاری.',
    toneInstruction: `[A/B TONE: SIMPLIFIED PEDAGOGICAL]
بیرۆکەکان بەشێوەی هەنگاو بە هەنگاو، پۆلێنکراو لەناو خشتە یان لیستی خاڵبەند، بە ڕوونکردنەوەی گونجاو بێ تێکدانی چڕیی ئەکادیمی پێشکەش بکە.`,
    weight: 0.20
  },
  harvard_standard: {
    variantId: 'harvard_standard',
    nameKurdish: 'پێوەری توندی زانکۆی هارفارد بۆ توێژینەوەی باڵا',
    nameEnglish: 'Harvard High-Rigor Standard',
    description: 'توندترین ئاستی ڕێباز، بەڵگەسازیی مێتۆدی، شیکاریی تاقیکاری و ستیشنی بێخەوشی APA-7/Harvard.',
    toneInstruction: `[A/B TONE: HARVARD HIGH-RIGOR STANDARD]
توندترین ستیشنی APA-7، بەڵگەسازیی بەهێز، شیکاریی لۆژیکی بێ کەێنۆک و پشتبەستنی تەواو بە داتاکان جێبەجێ بکە.`,
    weight: 0.20
  }
};

class CentralizedPromptsManager {
  private activeOverrideVariant?: AcademicToneVariant;
  private abTestStats: Record<AcademicToneVariant, { count: number; totalLatencyMs: number; errors: number }> = {
    formal_academic: { count: 0, totalLatencyMs: 0, errors: 0 },
    literary_sorani: { count: 0, totalLatencyMs: 0, errors: 0 },
    simplified_pedagogical: { count: 0, totalLatencyMs: 0, errors: 0 },
    harvard_standard: { count: 0, totalLatencyMs: 0, errors: 0 }
  };

  /**
   * Sample an A/B testing tone variant based on weight distribution or explicit variant setting
   */
  public selectToneVariant(preferredVariant?: AcademicToneVariant): AcademicToneVariant {
    if (this.activeOverrideVariant) return this.activeOverrideVariant;
    if (preferredVariant && ACADEMIC_TONE_VARIANTS[preferredVariant]) {
      return preferredVariant;
    }

    // Weighted random selection for A/B testing
    const rand = Math.random();
    let cumulative = 0;
    const variants = Object.values(ACADEMIC_TONE_VARIANTS);

    for (const v of variants) {
      cumulative += v.weight;
      if (rand <= cumulative) {
        return v.variantId;
      }
    }

    return 'formal_academic';
  }

  /**
   * Set global manual override variant for testing or experiments
   */
  public setOverrideVariant(variant?: AcademicToneVariant): void {
    this.activeOverrideVariant = variant;
  }

  /**
   * Get system prompt injected with A/B testing tone instructions
   */
  public getSystemPrompt(baseKey: string, requestedVariant?: AcademicToneVariant): { systemPrompt: string; variantUsed: AcademicToneVariant } {
    const variantId = this.selectToneVariant(requestedVariant);
    const variantConfig = ACADEMIC_TONE_VARIANTS[variantId];

    let basePrompt = SYSTEM_PROMPT_REFINE;
    switch (baseKey) {
      case 'review_structure':
        basePrompt = SYSTEM_PROMPT_REVIEW_STRUCTURE;
        break;
      case 'generate_chapter':
        basePrompt = SYSTEM_PROMPT_GENERATE_CHAPTER;
        break;
      case 'analyze_rigor':
        basePrompt = SYSTEM_PROMPT_ANALYZE_RIGOR;
        break;
      case 'expand_glossary':
        basePrompt = SYSTEM_PROMPT_EXPAND_GLOSSARY;
        break;
      case 'suggest_sources':
        basePrompt = SYSTEM_PROMPT_SUGGEST_SOURCES;
        break;
      case 'harvard_features':
        basePrompt = SYSTEM_PROMPT_HARVARD_FEATURES;
        break;
      case 'ai_integrity_audit':
        basePrompt = SYSTEM_PROMPT_AI_INTEGRITY_AUDIT;
        break;
      case 'summarize_thesis_context':
        basePrompt = SYSTEM_PROMPT_SUMMARIZE_THESIS_CONTEXT;
        break;
      default:
        basePrompt = SYSTEM_PROMPT_REFINE;
        break;
    }

    const fullPrompt = `${basePrompt}\n\n${variantConfig.toneInstruction}`;
    return { systemPrompt: fullPrompt, variantUsed: variantId };
  }

  /**
   * Log execution metric for A/B testing analytics
   */
  public recordABMetric(variant: AcademicToneVariant, latencyMs: number, success: boolean): void {
    if (!this.abTestStats[variant]) return;
    this.abTestStats[variant].count += 1;
    this.abTestStats[variant].totalLatencyMs += latencyMs;
    if (!success) {
      this.abTestStats[variant].errors += 1;
    }
  }

  /**
   * Get summary report for A/B testing experiments
   */
  public getABTestReport() {
    return {
      activeOverride: this.activeOverrideVariant || 'None (Weighted Auto A/B)',
      variantsConfig: ACADEMIC_TONE_VARIANTS,
      performanceStats: Object.entries(this.abTestStats).map(([key, stat]) => ({
        variant: key,
        totalRequests: stat.count,
        avgLatencyMs: stat.count > 0 ? Math.round(stat.totalLatencyMs / stat.count) : 0,
        errorRate: stat.count > 0 ? ((stat.errors / stat.count) * 100).toFixed(1) + '%' : '0%'
      }))
    };
  }
}

export const centralizedPromptsManager = new CentralizedPromptsManager();
