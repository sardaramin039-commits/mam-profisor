import { researchMemoryService } from './research-memory.service';

export async function resolveServerVerifiedCitations<T extends {
  citationId: string;
  sourceId: string;
  verified: boolean;
  evidenceId?: string;
}>(
  userId: string,
  workspaceId: string,
  citations: T[]
): Promise<T[]> {
  const memory = await researchMemoryService.hydrateProjectState(userId, workspaceId);
  const evidenceById = new Map(
    memory.memoryItems
      .filter(item => item.type === 'evidence' && item.metadata?.['verified'] === true)
      .map(item => [
        String(item.metadata?.['evidenceId'] || ''),
        item
      ])
      .filter(([evidenceId]) => Boolean(evidenceId))
  );

  return citations.map(citation => {
    const evidence = citation.evidenceId
      ? evidenceById.get(citation.evidenceId)
      : undefined;
    const sourceMatches = evidence
      ? String(evidence.metadata?.['sourceId'] || '') === citation.sourceId
      : false;

    return {
      ...citation,
      verified: Boolean(evidence && sourceMatches)
    };
  });
}

export function hasServerVerifiedMethodology(
  memoryItems: Array<{
    type: string;
    content: string;
    tags: string[];
  }>
): boolean {
  return memoryItems.some(item =>
    item.type !== 'note' &&
    item.tags.includes('methodology') &&
    item.content.trim().length > 0
  ) || memoryItems.some(item =>
    item.type === 'note' &&
    item.tags.includes('methodology') &&
    item.content.trim().length > 0
  );
}

export function filterVerifiedCitationIds(
  citations: Array<{ citationId: string; verified: boolean }>
): Set<string> {
  return new Set(
    citations.filter(citation => citation.verified).map(citation => citation.citationId)
  );
}
