export interface CitationNode {
  id: string;
  label: string;
  type: 'chapter' | 'theme' | 'source';
  subLabel?: string;
  details?: string;
  category?: string;
  year?: number;
  author?: string;
  publisher?: string;
  chapterId?: number;
  connectionsCount?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface CitationLink {
  source: string | CitationNode;
  target: string | CitationNode;
  relation: string;
  relationKurdish: string;
}
