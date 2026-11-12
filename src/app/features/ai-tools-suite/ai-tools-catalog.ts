import { CATALOG_PART1 } from './catalog/catalog-part1';
import { CATALOG_PART2 } from './catalog/catalog-part2';
import { CATALOG_PART3 } from './catalog/catalog-part3';

export interface AiToolItem {
  num: number;
  id: string;
  titleKurdish: string;
  titleEnglish: string;
  category: 'apis_integrations' | 'creation_planning' | 'editing_writing' | 'analytics_review' | 'system_workspace';
  section: '1-30' | '31-60' | '61-90' | '91-120' | '121-130' | '131-160';
  icon: string;
  description: string;
  placeholder: string;
  hasStyleOption?: boolean;
  hasToneOption?: boolean;
  hasLanguageOption?: boolean;
}

export const AI_TOOLS_CATALOG: AiToolItem[] = [
  ...CATALOG_PART1,
  ...CATALOG_PART2,
  ...CATALOG_PART3
];
