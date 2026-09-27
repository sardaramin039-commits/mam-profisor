import { ChapterItemModel, AcademicSourceModel, GlossaryEntry } from '../domain/models';

export interface ConceptNodeModel {
  id: string;
  name: string;
  kurdishTranslation: string;
  category: 'methodology' | 'hypothesis' | 'evidence' | 'theory' | 'gap' | 'finding' | 'general';
  definition: string;
  sourceLang?: string;
  importance?: 'critical' | 'high' | 'medium';
}

export interface ConceptLinkModel {
  source: string;
  target: string;
  relation: string;
  relationKurdish?: string;
}

export interface ThesisContextMapModel {
  version: string;
  exportTimestamp: string;
  projectMetadata: {
    title: string;
    discipline: string;
    academicLevel: string;
    targetPages: number;
    targetWords: number;
    language: string;
    authorEmail?: string;
  };
  chapters: ChapterItemModel[];
  methodology: {
    approach: string;
    tools: string[];
    dataSources: string[];
    kurdishNotes?: string;
  };
  gapAnalysis: {
    identifiedGaps: string[];
    proposedNovelties: string[];
  };
  conceptMap: {
    nodes: ConceptNodeModel[];
    links: ConceptLinkModel[];
  };
  bibliography: AcademicSourceModel[];
  glossary: GlossaryEntry[];
}

/**
 * Downloads the given thesis context map as a formatted JSON file.
 */
export function exportThesisContextMap(mapData: ThesisContextMapModel, customFileName?: string): void {
  const jsonStr = JSON.stringify(mapData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedTitle = (mapData.projectMetadata.title || 'thesis')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
    
  const fileName = customFileName || `${sanitizedTitle}_context_map.json`;
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses a thesis context map JSON file.
 */
export function parseThesisContextMapFile(file: File): Promise<ThesisContextMapModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('فایلی نەخشەی تێزەکە نەگونجاوە (Invalid JSON structure)');
        }
        if (!parsed.projectMetadata || !parsed.chapters) {
          throw new Error('پێکهاتەی فایلی نەخشەی تێزەکە تەواو نییە (Missing required metadata or chapters)');
        }
        
        resolve(parsed as ThesisContextMapModel);
      } catch (err: any) {
        reject(new Error(err.message || 'هەڵە لە خوێندنەوەی فایلی JSON'));
      }
    };
    reader.onerror = () => reject(new Error('شکست لە خوێندنەوەی فایلی ئامادەکراو'));
    reader.readAsText(file);
  });
}
