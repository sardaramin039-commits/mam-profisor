export type TaskComplexity = 'fast' | 'reasoning' | 'long_context' | 'embedding';

export interface ModelRoutingConfig {
  taskType: TaskComplexity;
  selectedModelName: string;
  thinkingBudgetTokens?: number;
  temperature: number;
  kurdishReason: string;
}

export class AiModelRouterService {
  /**
   * Routes task to optimal model architecture according to prompt demands.
   */
  public selectModelForTask(taskType: TaskComplexity, textLength: number = 0): ModelRoutingConfig {
    if (taskType === 'reasoning') {
      return {
        taskType: 'reasoning',
        selectedModelName: 'gemini-3.8-flash',
        thinkingBudgetTokens: 2048,
        temperature: 0.2,
        kurdishReason: 'کەڵک وەرگرتن لە مۆدێلی فرەمۆدێلی پێشەنگی شیکاریی زانستی و لۆژیکی قووڵ (Gemini 3.8 Flash).'
      };
    }

    if (taskType === 'long_context' || textLength > 15000) {
      return {
        taskType: 'long_context',
        selectedModelName: 'gemini-3.8-flash',
        temperature: 0.1,
        kurdishReason: 'کەڵک وەرگرتن لە پەنجەرەی پێشکەوتووی ملیۆن تۆکێنی Gemini 3.8 Flash بۆ بەڵگەنامە گەورەکان.'
      };
    }

    if (taskType === 'embedding') {
      return {
        taskType: 'embedding',
        selectedModelName: 'gemini-embedding-2',
        temperature: 0.0,
        kurdishReason: 'بۆ دروستکردنی ڤێکتەری فەزایی و گەڕانی RAG لەناو کتێبخانەی ئەکادیمی.'
      };
    }

    return {
      taskType: 'fast',
      selectedModelName: 'gemini-3.8-flash',
      temperature: 0.3,
      kurdishReason: 'کەڵک وەرگرتن لە پێشەنگترین و خێراترین مۆدێلی وەڵامدانەوە (Gemini 3.8 Flash).'
    };
  }
}

export const aiModelRouterService = new AiModelRouterService();
