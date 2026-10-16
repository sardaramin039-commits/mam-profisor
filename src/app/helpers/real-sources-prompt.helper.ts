/**
 * src/app/helpers/real-sources-prompt.helper.ts
 *
 * Directives and sanitization utilities for real sources and zero-hallucination policies.
 */

export interface SourceItemBrief {
  author: string;
  year?: string | number;
  title: string;
}

export function buildRealSourcesPromptContext(
  projectSources: SourceItemBrief[],
  libraryBooks: SourceItemBrief[]
): string {
  const known = [
    ...projectSources.map(s => `- ${s.author} (${s.year || 'n.d.'}): «${s.title}»`),
    ...libraryBooks.slice(0, 12).map(b => `- ${b.author} (${b.year || 'n.d.'}): «${b.title}»`)
  ];

  if (known.length === 0) {
    return `\n[ڕێسای سەرچاوە زانستییەکان - ZERO HALLUCINATION POLICY]:\nهیچ سەرچاوەیەکی دەرەکی ساختە یان نووسەری خەیاڵی لەنێو کەوانەدا مەنوسە. لەکاتی نەبوونی سەرچاوەی دیاریکراو، بە چەمکسازیی لۆژیکی و چوارچێوەی ئیپستۆمۆلۆژی بابەتەکە شیکار بکە.`;
  }

  return `\n[سەرچاوە ڕاستەقینە باوەڕپێکراوەکان - ZERO HALLUCINATION POLICY]:\nتەنها و تەنها ڕێگەپێدراوە لەم سەرچاوانەی خوارەوە ئاماژەی کەوانەیی (نووسەر، ساڵ) بەکاربهێنیت:\n${known.slice(0, 15).join('\n')}\nقەدەغەکردنی ڕەها: دانانی هەر سەرچاوە، نووسەر، یان ساڵێکی ساختە بە توندی قەدەغەیە؛ ئەگەر پێویست بوو بنووسە: [پێویستی بە سەرچاوە: تێزی توێژەر].`;
}

export function sanitizeCitationMatches(
  text: string,
  knownAuthors: string[],
  onUnmatchedAuthor?: (unmatched: string) => void
): string {
  if (!text) return text;
  const citeRegex = /\(([\u0600-\u06FFa-zA-Z\s.-]+?)[،,]\s*(\d{4}|[\u0660-\u0669]{4}|n\.d\.)(?::\s*[\u0660-\u0669\d-]+)?\)/g;
  const skip = new Set(['بڕوانە', 'وەکو', 'سەیربکە', 'لاپەڕە', 'see', 'note']);

  return text.replace(citeRegex, (match, author) => {
    const trimmed = author.trim();
    if (skip.has(trimmed.toLowerCase())) return match;
    const isKnown = knownAuthors.some(ka => ka && (ka.includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(ka)));
    if (isKnown || knownAuthors.length === 0) return match;
    onUnmatchedAuthor?.(match);
    return `[پێویستی بە سەرچاوەی پشتڕاستکراوەیە: ${trimmed}]`;
  });
}
