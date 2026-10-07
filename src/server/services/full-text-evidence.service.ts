import type { EvidenceProvenance, EvidenceType } from './evidence-verification-policy';

export interface FullTextEnrichmentSource {
  id?: string;
  sourceId?: string;
  title?: string;
  url?: string;
  pmid?: string;
  pmcid?: string;
  evidenceText?: string;
  evidenceType?: EvidenceType;
  evidenceProvenance?: EvidenceProvenance;
  evidenceUrl?: string;
}

type EuropePmcSearchResponse = {
  resultList?: {
    result?: Array<{
      pmcid?: string;
      isOpenAccess?: string;
    }>;
  };
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function cleanFullText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPmcId(source: FullTextEnrichmentSource): string {
  if (source.pmcid?.trim()) return source.pmcid.trim().toUpperCase();
  const match = source.url?.match(/(?:PMC|articles\/PMC)(\d+)/i);
  return match ? `PMC${match[1]}`.toUpperCase() : '';
}

async function resolveOpenAccessPmcId(
  source: FullTextEnrichmentSource
): Promise<string> {
  const direct = extractPmcId(source);
  const pmid = String(source.pmid || '').trim();
  if (!direct && !pmid) return '';

  const query = direct
    ? `PMCID:${direct} AND OPEN_ACCESS:y`
    : `EXT_ID:${pmid} AND OPEN_ACCESS:y`;
  const searchUrl =
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=1`;
  const response = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return '';

  const data = await response.json() as EuropePmcSearchResponse;
  const record = data.resultList?.result?.[0];
  if (!record?.pmcid || record.isOpenAccess === 'N') return '';

  return record.pmcid.trim().toUpperCase();
}

function findExcerpts(
  fullText: string,
  claims: string[],
  maxChars = 9000
): { excerpt: string; claim: string } {
  const normalizedText = normalize(fullText);
  if (!normalizedText) return { excerpt: '', claim: '' };

  const excerpts: string[] = [];
  let matchedClaim = '';
  const seen = new Set<number>();

  for (const claim of claims) {
    const normalizedClaim = normalize(claim);
    if (!normalizedClaim || seen.has(normalizedClaim.length)) continue;

    const index = normalizedText.indexOf(normalizedClaim);
    if (index < 0) continue;

    if (!matchedClaim) matchedClaim = claim;
    const start = Math.max(0, index - 700);
    const end = Math.min(normalizedText.length, index + normalizedClaim.length + 700);
    excerpts.push(normalizedText.slice(start, end));
    seen.add(normalizedClaim.length);

    const joined = excerpts.join(' … ');
    if (joined.length >= maxChars) break;
  }

  return {
    excerpt: excerpts.join(' … ').slice(0, maxChars),
    claim: matchedClaim
  };
}

export async function enrichSourcesWithFullText<T extends FullTextEnrichmentSource>(
  sources: T[],
  claims: string[]
): Promise<T[]> {
  if (!Array.isArray(sources) || !claims.some(claim => normalize(claim))) {
    return sources;
  }

  return Promise.all(sources.map(async source => {
    try {
      const pmcid = await resolveOpenAccessPmcId(source);
      if (!pmcid) return source;

      const url =
        `https://www.ebi.ac.uk/europepmc/webservices/rest/${encodeURIComponent(pmcid)}/fullTextXML`;
      const response = await fetch(url, {
        headers: { Accept: 'application/xml,text/xml' },
        signal: AbortSignal.timeout(7000)
      });
      if (!response.ok) return source;

      const xml = await response.text();
      const fullText = cleanFullText(xml);
      const match = findExcerpts(fullText, claims);
      if (!match.excerpt) return source;

      return {
        ...source,
        claimText: match.claim,
        evidenceText: match.excerpt,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceUrl: url
      } as T;
    } catch {
      return source;
    }
  }));
}
