import { ChapterItemModel as ChapterItem } from '../domain/models';

export interface AcademicTerm {
  id: string;
  kurdishTerm: string;
  foreignTerm: string;
  field: string;
  definition: string;
  academicExample: string;
  source?: string;
  colloquialVariants?: string[];
}

export interface TermConsistencyIssue {
  chapterId: number;
  chapterTitle: string;
  matchedText: string;
  snippet: string;
  suggestion: string;
}

export interface TermAuditDetail {
  term: AcademicTerm;
  totalUsage: number;
  chapterUsage: { chapterId: number; chapterTitle: string; count: number }[];
  issues: TermConsistencyIssue[];
  status: 'optimal' | 'inconsistent' | 'unused';
}

export interface TerminologyDocumentAudit {
  auditTimestamp: string;
  overallScore: number; // 0 - 100
  totalDefinedTerms: number;
  optimalTermsCount: number;
  inconsistentCount: number;
  unusedCount: number;
  details: TermAuditDetail[];
}

/**
 * Common colloquial or informal Kurdish variants that should be standardized into formal academic terms.
 */
const KNOWN_COLLOQUIAL_VARIANTS: Record<string, string[]> = {
  'ڕەوایی نێوەڕۆک': ['ڕاستیی ناوەڕۆک', 'دروستی ناوەرۆک', 'ڕەوایی ناوەڕۆک', 'سەحەتی ناوەڕۆک'],
  'جێگیریی پێوانە': ['تەئکیدی پێوانە', 'نەگۆڕاوی پێوانە', 'جێگیری پێوانەکە'],
  'چوارچێوەی چەمکی': ['مەودای چەمکەکان', 'نەخشەی مەفاهیم', 'چوارچێوەی فیکری'],
  'سێگۆشەسازیی بەڵگە': ['سێگۆشەکردن', 'سێکوچکەکردنی داتا', 'سێ بەڵگەیی'],
  'تێربوونی بیردۆزی': ['تێربوونی تیۆری', 'پڕبوونی بیردۆز', 'تێربوون لە زانیاری'],
  'میتۆدۆلۆژیا': ['ڕێگاوبان', 'تەریقەی کار', 'شێوازی ئیشکردن'],
  'گریمانەی سفر': ['گریمانەی بەتاڵ', 'فەرزیەی سیفر', 'گریمانەی نەبوونی پەیوەندی'],
  'کۆمەڵگەی توێژینەوە': ['خەڵکی توێژینەوە', 'کۆمەڵگای بەشداربووان', 'کۆمەڵەی لێکۆڵینەوە']
};

/**
 * Audits long-form documents to ensure consistent usage of defined Sorani Kurdish academic terms.
 */
export function auditDocumentTerminology(
  terms: AcademicTerm[],
  chapters: ChapterItem[]
): TerminologyDocumentAudit {
  const details: TermAuditDetail[] = [];
  let totalIssues = 0;
  let optimalCount = 0;
  let unusedCount = 0;

  for (const term of terms) {
    const kurdishTarget = term.kurdishTerm.trim();
    const foreignTarget = term.foreignTerm ? term.foreignTerm.trim().toLowerCase() : '';
    const variants = [
      ...(term.colloquialVariants || []),
      ...(KNOWN_COLLOQUIAL_VARIANTS[kurdishTarget] || [])
    ];

    let totalCount = 0;
    const chapterUsage: { chapterId: number; chapterTitle: string; count: number }[] = [];
    const issues: TermConsistencyIssue[] = [];

    for (const ch of chapters) {
      const content = ch.content || '';
      if (!content.trim()) continue;

      // Count direct matches of standard term
      const directMatches = (content.match(new RegExp(escapeRegExp(kurdishTarget), 'g')) || []).length;
      if (directMatches > 0) {
        totalCount += directMatches;
        chapterUsage.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          count: directMatches
        });
      }

      // Check for standalone foreign term usage without Kurdish term
      if (foreignTarget && foreignTarget.length > 2) {
        const regexForeign = new RegExp(`\\b${escapeRegExp(foreignTarget)}\\b`, 'gi');
        let foreignMatch: RegExpExecArray | null;
        while ((foreignMatch = regexForeign.exec(content)) !== null) {
          // Check if it's already qualified by Kurdish term near it
          const startIdx = Math.max(0, foreignMatch.index - 50);
          const endIdx = Math.min(content.length, foreignMatch.index + foreignMatch[0].length + 50);
          const localSnippet = content.substring(startIdx, endIdx);

          if (!localSnippet.includes(kurdishTarget)) {
            issues.push({
              chapterId: ch.id,
              chapterTitle: ch.title,
              matchedText: foreignMatch[0],
              snippet: `...${localSnippet.trim()}...`,
              suggestion: `بەکارهێنانی زاراوەی بیانی بەبێ هاوتای کوردی («${kurdishTarget}» پێشنیار دەکرێت).`
            });
          }
        }
      }

      // Check for colloquial variants
      for (const variant of variants) {
        if (!variant || variant === kurdishTarget) continue;
        const regexVar = new RegExp(escapeRegExp(variant), 'g');
        let varMatch: RegExpExecArray | null;
        while ((varMatch = regexVar.exec(content)) !== null) {
          const startIdx = Math.max(0, varMatch.index - 40);
          const endIdx = Math.min(content.length, varMatch.index + varMatch[0].length + 40);
          const localSnippet = content.substring(startIdx, endIdx);

          issues.push({
            chapterId: ch.id,
            chapterTitle: ch.title,
            matchedText: variant,
            snippet: `...${localSnippet.trim()}...`,
            suggestion: `شێوازی ناستاندارد «${variant}»؛ تکایە بە «${kurdishTarget}» بگۆڕدرێت.`
          });
        }
      }
    }

    let status: 'optimal' | 'inconsistent' | 'unused' = 'optimal';
    if (issues.length > 0) {
      status = 'inconsistent';
      totalIssues += issues.length;
    } else if (totalCount === 0) {
      status = 'unused';
      unusedCount++;
    } else {
      optimalCount++;
    }

    details.push({
      term,
      totalUsage: totalCount,
      chapterUsage,
      issues,
      status
    });
  }

  const definedCount = Math.max(1, terms.length);
  const consistencyRatio = Math.max(0, Math.min(100, Math.round(((definedCount - totalIssues * 0.5) / definedCount) * 100)));

  return {
    auditTimestamp: new Date().toLocaleTimeString('ckb', { hour: '2-digit', minute: '2-digit' }),
    overallScore: consistencyRatio,
    totalDefinedTerms: terms.length,
    optimalTermsCount: optimalCount,
    inconsistentCount: details.filter(d => d.status === 'inconsistent').length,
    unusedCount,
    details
  };
}

/**
 * Standardizes a specific academic term across all document chapters by replacing
 * informal or naked foreign occurrences with the official Sorani Kurdish standard term.
 */
export function standardizeTermAcrossChapters(
  term: AcademicTerm,
  chapters: ChapterItem[]
): { updatedChapters: ChapterItem[]; replacementsCount: number } {
  let count = 0;
  const kurdishStandard = term.kurdishTerm.trim();
  const variants = [
    ...(term.colloquialVariants || []),
    ...(KNOWN_COLLOQUIAL_VARIANTS[kurdishStandard] || [])
  ];

  const updatedChapters = chapters.map(ch => {
    let content = ch.content || '';
    if (!content.trim()) return ch;

    // Replace colloquial variants
    for (const v of variants) {
      if (!v || v === kurdishStandard) continue;
      const regex = new RegExp(escapeRegExp(v), 'g');
      const matches = content.match(regex);
      if (matches) {
        count += matches.length;
        content = content.replace(regex, kurdishStandard);
      }
    }

    return {
      ...ch,
      content,
      wordCount: content.trim() ? content.trim().split(/\s+/).length : 0
    };
  });

  return { updatedChapters, replacementsCount: count };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
