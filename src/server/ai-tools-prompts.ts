import { buildGroup1Prompt } from './prompts/ai-tools-group1';
import { buildGroup2Prompt } from './prompts/ai-tools-group2';
import { buildGroup3Prompt } from './prompts/ai-tools-group3';

export interface ToolExecuteOptions {
  style?: string;
  tone?: string;
  language?: string;
}

export function buildUserPromptForTool(toolId: string, inputText: string, options?: ToolExecuteOptions): string {
  const text = (inputText || '').trim();
  const styleOption = options?.style || 'APA';
  const targetLang = options?.language || 'Kurdish Sorani';
  const toneOption = options?.tone || 'Formal Academic';

  const g1 = buildGroup1Prompt(toolId, text, styleOption, targetLang, toneOption);
  if (g1) return g1;

  const g2 = buildGroup2Prompt(toolId, text, styleOption, targetLang, toneOption);
  if (g2) return g2;

  return buildGroup3Prompt(toolId, text, styleOption, targetLang, toneOption);
}

