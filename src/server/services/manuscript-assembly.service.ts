import { sha256 } from './text-sha256.service';

export interface ManuscriptChapterInput {
  id: string;
  title: string;
  order: number;
  content: string;
  citationIds?: string[];
}

export interface ManuscriptCitationInput {
  citationId: string;
  sourceId: string;
  inText: string;
  bibliography: string;
  verified: boolean;
  evidenceId?: string;
}

export interface ManuscriptAssemblyInput {
  projectId: string;
  title: string;
  abstract?: string;
  researchQuestion?: string;
  methodology?: string;
  chapters: ManuscriptChapterInput[];
  conclusion?: string;
  citations?: ManuscriptCitationInput[];
}

export interface ManuscriptIntegrity {
  structuralStatus: 'PASS' | 'REJECT';
  errors: string[];
  warnings: string[];
  chapterCount: number;
  citationCount: number;
  verifiedCitationCount: number;
  referencedCitationCount: number;
  bibliographyCount: number;
  fingerprint: string;
}

export interface ManuscriptDocument {
  projectId: string;
  title: string;
  sections: Array<{
    type: 'abstract' | 'research-question' | 'methodology' | 'chapter' | 'conclusion';
    title: string;
    content: string;
    order: number;
  }>;
  citations: ManuscriptCitationInput[];
  bibliography: string[];
  integrity: ManuscriptIntegrity;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function assembleManuscript(input: ManuscriptAssemblyInput): ManuscriptDocument {
  const errors: string[] = [];
  const warnings: string[] = [];
  const title = clean(input.title);
  const projectId = clean(input.projectId);
  const chapters = Array.isArray(input.chapters) ? input.chapters : [];
  const rawCitations = Array.isArray(input.citations) ? input.citations : [];

  if (!projectId) errors.push('projectId is required.');
  if (!title) errors.push('title is required.');
  if (!chapters.length) errors.push('At least one chapter is required.');

  const seenChapterIds = new Set<string>();
  const seenOrders = new Set<number>();
  for (const chapter of chapters) {
    const id = clean(chapter.id);
    const content = clean(chapter.content);
    if (!id) errors.push('Every chapter must have an id.');
    if (seenChapterIds.has(id)) errors.push(`Duplicate chapter id: ${id}`);
    seenChapterIds.add(id);
    if (!Number.isInteger(chapter.order) || chapter.order < 1) {
      errors.push(`Invalid chapter order for ${id || 'unknown chapter'}.`);
    } else if (seenOrders.has(chapter.order)) {
      errors.push(`Duplicate chapter order: ${chapter.order}`);
    }
    seenOrders.add(chapter.order);
    if (!clean(chapter.title)) errors.push(`Chapter ${id || 'unknown'} has no title.`);
    if (!content) errors.push(`Chapter ${id || 'unknown'} has no content.`);
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  sortedChapters.forEach((chapter, index) => {
    if (chapter.order !== index + 1) {
      errors.push('Chapter order must be contiguous starting at 1.');
    }
  });

  const citations = rawCitations
    .filter(citation => clean(citation.citationId) && clean(citation.sourceId))
    .map(citation => ({
      ...citation,
      citationId: clean(citation.citationId),
      sourceId: clean(citation.sourceId),
      inText: clean(citation.inText),
      bibliography: clean(citation.bibliography),
      evidenceId: clean(citation.evidenceId) || undefined,
      verified: citation.verified === true
    }));

  const citationById = new Map<string, ManuscriptCitationInput>();
  for (const citation of citations) {
    if (citationById.has(citation.citationId)) {
      errors.push(`Duplicate citation id: ${citation.citationId}`);
      continue;
    }
    citationById.set(citation.citationId, citation);
  }

  const referencedCitationIds = unique(
    sortedChapters.flatMap(chapter => (Array.isArray(chapter.citationIds) ? chapter.citationIds : []).map(clean))
  );
  const referencedCitationSet = new Set(referencedCitationIds);

  for (const citationId of referencedCitationIds) {
    const citation = citationById.get(citationId);
    if (!citation) {
      errors.push(`Referenced citation is missing from the citation set: ${citationId}`);
    } else if (!citation.verified) {
      errors.push(`Referenced citation is not verified: ${citationId}`);
    }
  }

  for (const citation of citations) {
    if (!citation.verified) {
      warnings.push(`Unverified citation excluded: ${citation.citationId}`);
    }
    if (!citation.bibliography) {
      warnings.push(`Citation has no bibliography entry: ${citation.citationId}`);
    }
  }

  const includedCitations = citations.filter(citation => citation.verified && referencedCitationSet.has(citation.citationId));
  const bibliography = unique(includedCitations.map(citation => citation.bibliography));
  if (includedCitations.length > 0 && bibliography.length === 0) {
    errors.push('Referenced verified citations must have bibliography entries.');
  }

  const sections: ManuscriptDocument['sections'] = [];
  if (clean(input.abstract)) sections.push({ type: 'abstract', title: 'پوختە', content: clean(input.abstract), order: 1 });
  if (clean(input.researchQuestion)) sections.push({ type: 'research-question', title: 'پرسیاری توێژینەوە', content: clean(input.researchQuestion), order: 2 });
  if (clean(input.methodology)) sections.push({ type: 'methodology', title: 'میتۆدۆلۆجیا', content: clean(input.methodology), order: 3 });

  const sectionOffset = sections.length;
  sortedChapters.forEach((chapter, index) => {
    sections.push({
      type: 'chapter',
      title: clean(chapter.title),
      content: clean(chapter.content),
      order: sectionOffset + index + 1
    });
  });

  if (clean(input.conclusion)) {
    sections.push({
      type: 'conclusion',
      title: 'ئەنجام',
      content: clean(input.conclusion),
      order: sections.length + 1
    });
  }

  if (!clean(input.methodology)) {
    warnings.push('Methodology section is missing from the manuscript payload; export policy may block publication.');
  }

  const structuralStatus = errors.length === 0 ? 'PASS' : 'REJECT';
  const fingerprintPayload = JSON.stringify({
    projectId,
    title,
    sections,
    includedCitations,
    bibliography,
    structuralStatus
  });

  return {
    projectId,
    title,
    sections,
    citations: includedCitations,
    bibliography,
    integrity: {
      structuralStatus,
      errors: unique(errors),
      warnings: unique(warnings),
      chapterCount: sortedChapters.length,
      citationCount: citations.length,
      verifiedCitationCount: citations.filter(citation => citation.verified).length,
      referencedCitationCount: referencedCitationIds.length,
      bibliographyCount: bibliography.length,
      fingerprint: sha256(fingerprintPayload)
    }
  };
}
