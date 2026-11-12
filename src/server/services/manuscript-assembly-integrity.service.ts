import { createHash } from 'node:crypto';

export interface ManuscriptSectionInput {
  sectionId: string;
  title: string;
  order: number;
  body: string;
  citationIds?: string[];
}

export interface ManuscriptIntegrityIssue {
  code: 'duplicate_section' | 'invalid_order' | 'empty_section' | 'placeholder_text' |
    'unverified_citation' | 'duplicate_citation' | 'oversized_manuscript';
  severity: 'blocker' | 'warning';
  sectionId?: string;
  message: string;
}

export interface ManuscriptIntegrityResult {
  readyForExport: boolean;
  orderedSections: ManuscriptSectionInput[];
  issues: ManuscriptIntegrityIssue[];
  wordCount: number;
  estimatedPagesAt350Words: number;
  contentHash: string | null;
}

const MAX_SECTIONS = 250;
const MAX_MANUSCRIPT_CHARS = 1_000_000;
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/iu,
  /\bTBD\b/iu,
  /\blorem ipsum\b/iu,
  /\[\s*insert\s+(?:citation|source|text|figure|table|content)[^\]]*\]/iu,
  /\[\s*citation needed\s*\]/iu,
  /\[\s*add (?:source|reference|evidence)[^\]]*\]/iu
];

function clean(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  const normalized = value.normalize('NFKC').trim();
  return normalized.length <= maxLength ? normalized : '';
}

function countWords(text: string): number {
  return text.trim().match(/\S+/gu)?.length ?? 0;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function createContentHash(sections: ManuscriptSectionInput[]): string {
  const canonical = sections.map(section => ({
    sectionId: section.sectionId,
    title: section.title,
    order: section.order,
    body: section.body,
    citationIds: unique((section.citationIds || []).map(id => id.trim()).filter(Boolean)).sort()
  }));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export class ManuscriptAssemblyIntegrityService {
  public validate(
    sectionsInput: unknown,
    verifiedCitationIdsInput: unknown
  ): ManuscriptIntegrityResult {
    const issues: ManuscriptIntegrityIssue[] = [];
    if (!Array.isArray(sectionsInput) || sectionsInput.length === 0) {
      return {
        readyForExport: false, orderedSections: [], wordCount: 0,
        estimatedPagesAt350Words: 0, contentHash: null,
        issues: [{ code: 'empty_section', severity: 'blocker', message: 'No manuscript sections were supplied.' }]
      };
    }
    if (sectionsInput.length > MAX_SECTIONS) {
      return {
        readyForExport: false, orderedSections: [], wordCount: 0,
        estimatedPagesAt350Words: 0, contentHash: null,
        issues: [{ code: 'oversized_manuscript', severity: 'blocker', message: 'Manuscript exceeds the section limit.' }]
      };
    }

    const verifiedCitationIds = new Set(
      (Array.isArray(verifiedCitationIdsInput) ? verifiedCitationIdsInput : [])
        .map(item => clean(item, 200))
        .filter(Boolean)
    );
    const parsed: ManuscriptSectionInput[] = [];
    const seenSectionIds = new Set<string>();
    let totalChars = 0;

    for (const item of sectionsInput) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        issues.push({ code: 'empty_section', severity: 'blocker', message: 'A section record is malformed.' });
        continue;
      }
      const value = item as Record<string, unknown>;
      const sectionId = clean(value['sectionId'], 160);
      const title = clean(value['title'], 500);
      const body = typeof value['body'] === 'string' ? value['body'].normalize('NFKC').trim() : '';
      const order = value['order'];
      const citationIds = Array.isArray(value['citationIds'])
        ? value['citationIds'].map(id => clean(id, 200)).filter(Boolean)
        : [];

      if (!sectionId || seenSectionIds.has(sectionId)) {
        issues.push({
          code: 'duplicate_section', severity: 'blocker', sectionId: sectionId || undefined,
          message: 'Every manuscript section must have a non-empty unique sectionId.'
        });
        continue;
      }
      seenSectionIds.add(sectionId);
      if (!title || !body) {
        issues.push({
          code: 'empty_section', severity: 'blocker', sectionId,
          message: 'Section title and body are required.'
        });
      }
      if (typeof order !== 'number' || !Number.isSafeInteger(order) || order < 0) {
        issues.push({
          code: 'invalid_order', severity: 'blocker', sectionId,
          message: 'Section order must be a non-negative safe integer.'
        });
      }

      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(body) || pattern.test(title)) {
          issues.push({
            code: 'placeholder_text', severity: 'blocker', sectionId,
            message: 'Unresolved placeholder text must be completed before export.'
          });
          break;
        }
      }

      const dedupedCitationIds = unique(citationIds);
      if (dedupedCitationIds.length !== citationIds.length) {
        issues.push({
          code: 'duplicate_citation', severity: 'warning', sectionId,
          message: 'Duplicate citation identifiers were collapsed for integrity checks.'
        });
      }
      for (const citationId of dedupedCitationIds) {
        if (!verifiedCitationIds.has(citationId)) {
          issues.push({
            code: 'unverified_citation', severity: 'blocker', sectionId,
            message: 'Citation reference "' + citationId + '" is not in the supplied verified citation set.'
          });
        }
      }

      totalChars += title.length + body.length;
      parsed.push({ sectionId, title, order: typeof order === 'number' ? order : -1, body, citationIds: dedupedCitationIds });
    }

    if (totalChars > MAX_MANUSCRIPT_CHARS) {
      issues.push({
        code: 'oversized_manuscript', severity: 'blocker',
        message: 'Manuscript text exceeds the one-million-character export safety limit.'
      });
    }

    const orderCounts = new Map<number, number>();
    for (const section of parsed) {
      orderCounts.set(section.order, (orderCounts.get(section.order) || 0) + 1);
    }
    for (const section of parsed) {
      if (section.order >= 0 && (orderCounts.get(section.order) || 0) > 1) {
        issues.push({
          code: 'invalid_order', severity: 'blocker', sectionId: section.sectionId,
          message: 'Section order values must be unique to keep the manuscript sequence deterministic.'
        });
      }
    }

    const orderedSections = parsed.slice().sort((a, b) => a.order - b.order);
    const wordCount = orderedSections.reduce((sum, section) => sum + countWords(section.body), 0);
    const hash = issues.some(issue => issue.severity === 'blocker') ? null : createContentHash(orderedSections);
    return {
      readyForExport: hash !== null,
      orderedSections,
      issues,
      wordCount,
      estimatedPagesAt350Words: Math.ceil(wordCount / 350),
      contentHash: hash
    };
  }
}

export const manuscriptAssemblyIntegrityService = new ManuscriptAssemblyIntegrityService();
