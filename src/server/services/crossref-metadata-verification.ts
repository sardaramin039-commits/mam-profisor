export type CrossrefCandidate = {
  title: string;
  authors: string[];
  publisher: string;
  year: string;
  doi: string;
};

export interface CrossrefSourceInput {
  title: string;
  author?: string;
  authors?: string[];
  publisher?: string;
  year?: string | number;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function sourceAuthorString(source: CrossrefSourceInput): string {
  const authors = Array.isArray(source.authors)
    ? source.authors.map(author => String(author || '').trim()).filter(Boolean)
    : source.author ? [source.author.trim()].filter(Boolean) : [];
  return authors.join(', ');
}

function authorOverlap(inputAuthor: string, externalAuthors: string[]): number {
  const inputTokens = new Set(normalize(inputAuthor).split(' ').filter(token => token.length > 2));
  const externalTokens = new Set(normalize(externalAuthors.join(' ')).split(' ').filter(token => token.length > 2));
  if (!inputTokens.size || !externalTokens.size) return 0;
  let overlap = 0;
  for (const token of inputTokens) if (externalTokens.has(token)) overlap++;
  return overlap / inputTokens.size;
}

function titleSimilarity(a: string, b: string): number {
  const left = new Set(normalize(a).split(' ').filter(token => token.length > 2));
  const right = new Set(normalize(b).split(' ').filter(token => token.length > 2));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / Math.max(left.size, right.size);
}

/** Looks up likely Crossref metadata; a match confirms identity candidates only, not evidence. */
export async function searchCrossrefByMetadata(
  source: CrossrefSourceInput
): Promise<CrossrefCandidate | undefined> {
  const query = [source.title, sourceAuthorString(source), source.publisher].filter(Boolean).join(' ').trim();
  if (!query) return undefined;

  try {
    const response = await fetch(
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mam-Professor-Academic-Platform/1.0'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) return undefined;

    const data = await response.json() as {
      message?: {
        items?: Array<{
          title?: string[];
          author?: Array<{ given?: string; family?: string }>;
          publisher?: string;
          DOI?: string;
          published?: { 'date-parts'?: number[][] };
          issued?: { 'date-parts'?: number[][] };
        }>
      }
    };
    const items = Array.isArray(data.message?.items) ? data.message.items : [];
    let best: { candidate: CrossrefCandidate; score: number; authorScore: number; yearMatch: boolean } | undefined;

    for (const item of items) {
      const title = item.title?.[0]?.trim() || '';
      if (!title) continue;
      const authors = (item.author || [])
        .map(author => [author.given, author.family].filter(Boolean).join(' ').trim())
        .filter(Boolean);
      const score = titleSimilarity(source.title, title);
      const authorText = sourceAuthorString(source);
      const authorScore = authorText ? authorOverlap(authorText, authors) : 1;
      const sourceYear = Number(source.year);
      const itemYear = Number(item.published?.['date-parts']?.[0]?.[0] ?? item.issued?.['date-parts']?.[0]?.[0] ?? 0);
      const yearMatch = !Number.isFinite(sourceYear) || !sourceYear || !itemYear
        ? true
        : Math.abs(sourceYear - itemYear) <= 1;

      if (!best || score + authorScore * 0.1 > best.score + best.authorScore * 0.1) {
        best = {
          candidate: {
            title,
            authors,
            publisher: item.publisher || '',
            year: itemYear ? String(itemYear) : '',
            doi: item.DOI || ''
          },
          score,
          authorScore,
          yearMatch
        };
      }
    }

    return best && best.score >= 0.82 && best.authorScore >= 0.5 && best.yearMatch
      ? best.candidate
      : undefined;
  } catch {
    return undefined;
  }
}
