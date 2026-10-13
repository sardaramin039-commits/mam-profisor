export interface CrossrefMetadataInput {
  title: string;
  author?: string;
  authors?: string[];
  publisher?: string;
  year?: string | number;
}

export interface CrossrefCandidate {
  title: string;
  authors: string[];
  publisher: string;
  year: string;
  doi: string;
  metadataAccuracy: number;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function authorList(source: CrossrefMetadataInput): string[] {
  if (Array.isArray(source.authors)) {
    return source.authors.map(author => String(author || '').trim()).filter(Boolean);
  }
  return source.author ? [source.author.trim()].filter(Boolean) : [];
}

function authorString(source: CrossrefMetadataInput): string {
  return authorList(source).join(', ');
}

function authorOverlap(inputAuthor: string, externalAuthors: string[]): number {
  const inputTokens = new Set(normalize(inputAuthor).split(' ').filter(token => token.length > 2));
  const externalTokens = new Set(normalize(externalAuthors.join(' ')).split(' ').filter(token => token.length > 2));
  if (inputTokens.size === 0 || externalTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of inputTokens) if (externalTokens.has(token)) overlap++;
  return overlap / inputTokens.size;
}

function titleSimilarity(a: string, b: string): number {
  const left = new Set(normalize(a).split(' ').filter(token => token.length > 2));
  const right = new Set(normalize(b).split(' ').filter(token => token.length > 2));
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / Math.max(left.size, right.size);
}

export async function searchCrossrefByMetadata(
  source: CrossrefMetadataInput
): Promise<CrossrefCandidate | undefined> {
  const authorText = authorString(source);
  const query = [source.title, authorText, source.publisher].filter(Boolean).join(' ').trim();
  if (!query) return undefined;

  try {
    const response = await fetch(
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'Mam-Professor-Academic-Platform/1.0' },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) return undefined;

    const data = await response.json() as {
      message?: { items?: Array<{
        title?: string[];
        author?: Array<{ given?: string; family?: string }>;
        publisher?: string;
        DOI?: string;
        published?: { 'date-parts'?: number[][] };
        issued?: { 'date-parts'?: number[][] };
      }> }
    };

    const items = Array.isArray(data.message?.items) ? data.message.items : [];
    let best: { candidate: CrossrefCandidate; score: number; authorScore: number } | undefined;
    const sourceYear = Number(source.year);
    const hasSourceYear = Number.isFinite(sourceYear) && sourceYear > 0;

    for (const item of items) {
      const title = item.title?.[0]?.trim() || '';
      if (!title) continue;

      const authors = (item.author || [])
        .map(author => [author.given, author.family].filter(Boolean).join(' ').trim())
        .filter(Boolean);
      const score = titleSimilarity(source.title, title);
      const authorScore = authorText ? authorOverlap(authorText, authors) : 1;
      const itemYear = Number(
        item.published?.['date-parts']?.[0]?.[0] ??
        item.issued?.['date-parts']?.[0]?.[0] ??
        0
      );
      const yearMatch = !hasSourceYear || (itemYear > 0 && Math.abs(sourceYear - itemYear) <= 1);

      if (!best || score + authorScore * 0.1 > best.score + best.authorScore * 0.1) {
        const publisher = item.publisher || '';
        const comparisons = [score];
        if (authorText) comparisons.push(authorScore);
        if (hasSourceYear) comparisons.push(Number(yearMatch));
        if (source.publisher && publisher) comparisons.push(Number(normalize(source.publisher) === normalize(publisher)));
        const metadataAccuracy = Math.round(
          comparisons.reduce((sum, value) => sum + value, 0) / comparisons.length * 100
        );

        best = {
          candidate: {
            title,
            authors,
            publisher,
            year: itemYear ? String(itemYear) : '',
            doi: item.DOI || '',
            metadataAccuracy
          },
          score,
          authorScore
        };
      }
    }

    if (
      !best ||
      best.score < 0.82 ||
      best.authorScore < 0.5 ||
      (!authorText && !hasSourceYear) ||
      (hasSourceYear && !best.candidate.year)
    ) {
      return undefined;
    }
    return best.candidate;
  } catch {
    return undefined;
  }
}
