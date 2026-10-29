export type TaskComplexity = 'fast' | 'reasoning' | 'long_context' | 'embedding';

export interface ModelRoutingConfig {
  taskType: TaskComplexity;
  selectedModelName: string;
  thinkingBudgetTokens?: number;
  temperature: number;
  kurdishReason: string;
}

export class AiModelRouterService {
  public selectModelForTask(taskType: TaskComplexity, textLength = 0): ModelRoutingConfig {
    if (taskType === 'embedding') {
      return {
        taskType,
        selectedModelName: 'embedding',
        temperature: 0,
        kurdishReason: 'مۆدێلی embedding بە پێی توانای بەردەست لە API ـەکەدا دیاری دەکرێت.'
      };
    }
    if (taskType === 'reasoning') {
      return {
        taskType,
        selectedModelName: 'pro',
        thinkingBudgetTokens: 8192,
        temperature: 0.2,
        kurdishReason: 'هەڵبژاردنی داینامیکی مۆدێلی توانای بیرکردنەوەی قووڵ بۆ شیکاری و پلاندانانی زانستی.'
      };
    }
    if (taskType === 'long_context' || textLength > 15000) {
      return {
        taskType: 'long_context',
        selectedModelName: 'pro',
        thinkingBudgetTokens: 8192,
        temperature: 0.1,
        kurdishReason: 'هەڵبژاردنی داینامیکی مۆدێلی گونجاو بۆ دەقی زۆر و بەڵگەنامەی درێژ.'
      };
    }
    return {
      taskType: 'fast',
      selectedModelName: 'flash',
      temperature: 0.3,
      kurdishReason: 'هەڵبژاردنی داینامیکی مۆدێلی خێرا بەپێی لیستی نوێی API.'
    };
  }
}

export const aiModelRouterService = new AiModelRouterService();
