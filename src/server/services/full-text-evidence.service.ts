import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { markServerVerifiedFullText } from './evidence-verification-policy';
import type { EvidenceProvenance, EvidenceType } from './evidence-verification-policy';

export interface FullTextEnrichmentSource {
  claimText?: string;
  id?: string;
  sourceId?: string;
  title?: string;
  url?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  year?: string | number;
  publicationYear?: number;
  authors?: string[];
  openAlexId?: string;
  sourceType?: string;
  evidenceText?: string;
  evidenceType?: EvidenceType;
  evidenceProvenance?: EvidenceProvenance;
  evidenceUrl?: string;
}

type EuropePmcRecord = {
  pmcid?: string;
  pmid?: string;
  isOpenAccess?: string;
  title?: string;
  authorString?: string;
  doi?: string;
  firstPublicationDate?: string;
};

type EuropePmcSearchResponse = {
  resultList?: {
    result?: EuropePmcRecord[];
  };
};

type OpenAlexWorkResponse = {
  title?: string;
  doi?: string | null;
  publication_year?: number;
  best_oa_location?: {
    is_oa?: boolean;
    landing_page_url?: string | null;
    pdf_url?: string | null;
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

function normalizeDoi(value?: string): string {
  return String(value || '').trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .toLocaleLowerCase();
}

function titleSimilarity(a: string, b: string): number {
  const left = new Set(normalize(a).split(' ').filter(token => token.length > 2));
  const right = new Set(normalize(b).split(' ').filter(token => token.length > 2));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / Math.max(left.size, right.size);
}

function matchesAuthoritativeMetadata(
  source: FullTextEnrichmentSource,
  authoritative: { title?: string; doi?: string; pmid?: string; pmcid?: string; publicationYear?: number }
): boolean {
  if (!authoritative.title?.trim()) return false;
  if (source.title?.trim() && titleSimilarity(source.title, authoritative.title) < 0.75) return false;

  if (source.doi?.trim()) {
    if (!authoritative.doi || normalizeDoi(source.doi) !== normalizeDoi(authoritative.doi)) return false;
  }
  if (source.pmid?.trim() && authoritative.pmid && source.pmid.replace(/\D/g, '') !== authoritative.pmid.replace(/\D/g, '')) {
    return false;
  }
  if (source.pmcid?.trim() && authoritative.pmcid
    && source.pmcid.replace(/^PMC/i, '') !== authoritative.pmcid.replace(/^PMC/i, '')) {
    return false;
  }

  const sourceYear = Number(source.year ?? source.publicationYear);
  const authoritativeYear = Number(authoritative.publicationYear);
  if (Number.isFinite(sourceYear) && sourceYear > 0 && Number.isFinite(authoritativeYear) && authoritativeYear > 0
    && Math.abs(sourceYear - authoritativeYear) > 1) {
    return false;
  }

  return true;
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

async function resolveOpenAccessPmcRecord(
  source: FullTextEnrichmentSource
): Promise<EuropePmcRecord | undefined> {
  const direct = extractPmcId(source);
  const pmid = String(source.pmid || '').trim();
  if (!direct && !pmid) return undefined;

  const query = direct
    ? `PMCID:${direct} AND OPEN_ACCESS:y`
    : `EXT_ID:${pmid} AND OPEN_ACCESS:y`;
  const searchUrl =
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=1`;
  const response = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return undefined;

  const data = await response.json() as EuropePmcSearchResponse;
  const record = data.resultList?.result?.[0];
  if (!record?.pmcid || record.isOpenAccess !== 'Y') return undefined;

  const dateYear = Number(record.firstPublicationDate?.match(/\b\d{4}\b/)?.[0] || 0);
  const authoritative = {
    ...record,
    publicationYear: dateYear || undefined
  };
  if (!matchesAuthoritativeMetadata(source, authoritative)) return undefined;
  return record;
}


async function resolveOpenAlexFullTextLocation(
  source: FullTextEnrichmentSource
): Promise<{ url: string; title: string; doi?: string; publicationYear?: number } | undefined> {
  const rawId = String(source.openAlexId || '').trim();
  if (!rawId) return undefined;

  const workId = rawId.replace(/^https?:\/\/openalex\.org\//i, '').trim();
  if (!/^W\d+$/i.test(workId)) return undefined;

  try {
    const response = await fetch(
      `https://api.openalex.org/works/${encodeURIComponent(workId)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) return undefined;

    const data = await response.json() as OpenAlexWorkResponse;
    const location = data.best_oa_location;
    if (location?.is_oa !== true || !location.landing_page_url || !data.title) return undefined;
    const authoritative = {
      title: data.title,
      doi: data.doi || undefined,
      publicationYear: data.publication_year
    };
    if (!matchesAuthoritativeMetadata(source, authoritative)) return undefined;

    const url = location.landing_page_url.trim();
    if (!(await isSafeExternalHttpsUrl(url))) return undefined;
    return { url, title: data.title, doi: data.doi || undefined, publicationYear: data.publication_year };
  } catch {
    return undefined;
  }
}

function isPublicAddress(address: string, family: number): boolean {
  if (family === 4) {
    const octets = address.split('.').map(Number);
    if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
      return false;
    }

    const [a, b, c] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 2 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }

  if (family === 6) {
    const normalized = address.toLocaleLowerCase();
    return !(
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('::ffff:') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      /^fe[89ab]/i.test(normalized) ||
      normalized.startsWith('ff')
    );
  }

  return false;
}

export async function isSafeExternalHttpsUrl(rawUrl: string): Promise<boolean> {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLocaleLowerCase().replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal' ||
      hostname.includes(':') ||
      isIP(hostname) !== 0
    ) {
      return false;
    }

    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(item => isPublicAddress(item.address, item.family));
  } catch {
    return false;
  }
}


const MIN_HTML_FULLTEXT_CHARS = 1600;
const MIN_HTML_PARAGRAPHS = 3;

function looksLikeFullTextHtml(body: string, text: string): boolean {
  const paragraphCount = (body.match(/<p(?:\s|>)/gi) || []).length;
  const hasArticleStructure = /<(article|main|section)(?:\s|>)/i.test(body);
  const hasScholarlySections =
    /\b(introduction|method(?:s|ology)?|results|discussion|references|bibliography)\b/i.test(text);

  return (
    text.length >= MIN_HTML_FULLTEXT_CHARS &&
    paragraphCount >= MIN_HTML_PARAGRAPHS &&
    (hasArticleStructure || hasScholarlySections)
  );
}

async function readHtmlText(url: string): Promise<string> {
  if (!url || !(await isSafeExternalHttpsUrl(url))) return '';

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8'
      },
      signal: AbortSignal.timeout(7000),
      redirect: 'error'
    });
    if (!response.ok) return '';

    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) return '';

    const body = await response.text();
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return looksLikeFullTextHtml(body, text) ? text : '';
  } catch {
    return '';
  }
}

function findExcerpts(
  fullText: string,
  claims: string[],
  maxChars = 9000
): { excerpt: string; claim: string } {
  const units = fullText
    .split(/(?<=[.!?؟؛…])\s+/u)
    .map(unit => unit.trim())
    .filter(Boolean);
  if (!units.length) return { excerpt: '', claim: '' };

  const excerpts: string[] = [];
  let matchedClaim = '';

  for (const claim of claims) {
    const normalizedClaim = normalize(claim);
    if (!normalizedClaim || matchedClaim === claim) continue;

    const index = units.findIndex(unit =>
      normalize(unit).includes(normalizedClaim)
    );
    if (index < 0) continue;

    if (!matchedClaim) matchedClaim = claim;
    const startIndex = Math.max(0, index - 1);
    const endIndex = Math.min(units.length, index + 2);
    excerpts.push(units.slice(startIndex, endIndex).join(' '));

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
  claims: string[],
  options: { allowDiscoveredProviderUrls?: boolean } = {}
): Promise<Array<T & Partial<FullTextEnrichmentSource>>> {
  if (!Array.isArray(sources) || !claims.some(claim => normalize(claim))) {
    return sources;
  }

  return Promise.all(sources.map(async source => {
    try {
      const pmcRecord = await resolveOpenAccessPmcRecord(source);
      if (pmcRecord?.pmcid) {
        const pmcid = pmcRecord.pmcid.trim().toUpperCase();
        const url =
          `https://www.ebi.ac.uk/europepmc/webservices/rest/${encodeURIComponent(pmcid)}/fullTextXML`;
        const response = await fetch(url, {
          headers: { Accept: 'application/xml,text/xml' },
          signal: AbortSignal.timeout(7000)
        });
        if (response.ok) {
          const xml = await response.text();
          const match = findExcerpts(cleanFullText(xml), claims);
          if (match.excerpt) {
            return markServerVerifiedFullText({
              ...source,
              title: source.title?.trim() || pmcRecord.title,
              doi: source.doi?.trim() || pmcRecord.doi,
              pmid: source.pmid?.trim() || pmcRecord.pmid,
              pmcid,
              claimText: match.claim,
              evidenceText: match.excerpt,
              evidenceType: 'full-text',
              evidenceProvenance: 'server-verified-fulltext',
              evidenceUrl: url
            }) as T & Partial<FullTextEnrichmentSource>;
          }
        }
      }

      let htmlUrl = '';
      let authoritativeTitle = '';
      let authoritativeDoi: string | undefined;
      let authoritativeYear: number | undefined;

      if (source.sourceType === 'OpenAlex') {
        const location = await resolveOpenAlexFullTextLocation(source);
        htmlUrl = location?.url || '';
        authoritativeTitle = location?.title || '';
        authoritativeDoi = location?.doi;
        authoritativeYear = location?.publicationYear;
      } else if (source.sourceType === 'DOAJ' && options.allowDiscoveredProviderUrls === true) {
        // Only call this branch for records obtained by the server's own discovery adapter,
        // never for rawSources supplied in an HTTP request.
        htmlUrl = source.url || source.evidenceUrl || '';
        authoritativeTitle = source.title || '';
        authoritativeDoi = source.doi;
        const sourceYear = Number(source.year ?? source.publicationYear);
        authoritativeYear = Number.isFinite(sourceYear) && sourceYear > 0 ? sourceYear : undefined;
      }

      if (!htmlUrl || !authoritativeTitle || !(await isSafeExternalHttpsUrl(htmlUrl))) return source;
      const htmlText = await readHtmlText(htmlUrl);
      const htmlMatch = findExcerpts(htmlText, claims);
      if (!htmlMatch.excerpt) return source;

      return markServerVerifiedFullText({
        ...source,
        title: source.title?.trim() || authoritativeTitle,
        doi: source.doi || authoritativeDoi,
        year: source.year || authoritativeYear,
        claimText: htmlMatch.claim,
        evidenceText: htmlMatch.excerpt,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceUrl: htmlUrl
      }) as T & Partial<FullTextEnrichmentSource>;
    } catch {
      return source;
    }
  }));
}
