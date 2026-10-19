export interface SimilarityMatch {
  sourceId: string;
  sourceTitle: string;
  similarityScore: number;
  matchedPhraseCount: number;
  risk: 'low' | 'medium' | 'high';
}

export interface SimilarityScreeningResult {
  overallSimilarityScore: number;
  highRiskMatches: number;
  matches: SimilarityMatch[];
  corpusCoverage: number;
  noteKurdish: string;
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function shingles(text: string): Set<string> {
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i < tokens.length - 4; i++) set.add(tokens.slice(i, i + 5).join(' '));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export class TextSimilarityService {
  public screen(draftText: string, sources: any[]): SimilarityScreeningResult {
    const draft = String(draftText || '');
    const draftShingles = shingles(draft);
    if (!draftShingles.size) {
      return { overallSimilarityScore: 0, highRiskMatches: 0, matches: [], corpusCoverage: 0, noteKurdish: 'دەق زۆر کورتە بۆ similarity screening.' };
    }

    const matches: SimilarityMatch[] = [];
    for (const [index, source] of (Array.isArray(sources) ? sources : []).slice(0, 100).entries()) {
      const corpusText = String(
        source?.content ?? source?.fullText ?? source?.text ?? source?.chunkText ?? ''
      );
      if (!corpusText.trim()) continue;
      const sourceShingles = shingles(corpusText);
      const score = Math.round(jaccard(draftShingles, sourceShingles) * 100);
      const matchedPhraseCount = [...draftShingles].filter(item => sourceShingles.has(item)).length;
      if (score >= 5) {
        matches.push({
          sourceId: String(source?.id ?? source?.sourceId ?? source?.doiOrIsbn ?? source?.doi ?? `SRC-${index + 1}`),
          sourceTitle: String(source?.title ?? source?.sourceTitle ?? `Source ${index + 1}`),
          similarityScore: score,
          matchedPhraseCount,
          risk: score >= 35 ? 'high' : score >= 15 ? 'medium' : 'low'
        });
      }
    }

    matches.sort((a, b) => b.similarityScore - a.similarityScore);
    const overall = matches[0]?.similarityScore || 0;
    return {
      overallSimilarityScore: overall,
      highRiskMatches: matches.filter(item => item.risk === 'high').length,
      matches: matches.slice(0, 30),
      corpusCoverage: Math.min(100, Math.round((matches.length / Math.max(1, sources.length)) * 100)),
      noteKurdish: 'ئەمە screening ـی ناوخۆییە لەسەر corpus ـی پێدراو؛ plagiarism detector ـی گشتی نییە.'
    };
  }
}

export const textSimilarityService = new TextSimilarityService();
