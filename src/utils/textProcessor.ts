import { TextProcessor } from './academicUtils';

/**
 * Cleans Kurdish text by normalizing unicode characters, combining duplicate vowels,
 * and formatting whitespaces.
 */
export function cleanKurdishText(text: string): string {
  return TextProcessor.cleanKurdishText(text);
}
