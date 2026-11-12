import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { EvidenceProvenance, EvidenceType } from './evidence-verification-policy';

// WeakSet trust cannot be supplied over JSON; only this server retrieval module marks sources.
const serverVerifiedFullTextSources = new WeakSet<object>();

export function isServerVerifiedFullTextSource(source: unknown): boolean {
  return typeof source === 'object' && source !== null && serverVerifiedFullTextSources.has(source);
}

export function preserveServerVerifiedFullText<T extends object>(original: unknown, copy: T): T {
  if (isServerVerifiedFullTextSource(original)) {
    serverVerifiedFullTextSources.add(copy);
  }
  return copy;
}

function markServerVerifiedFullText<T extends object>(source: T): T {
  serverVerifiedFullTextSources.add(source);
  return source;
}

export interface FullTextEnrichmentSource {
  claimText?: string;
  id?: string;
  sourceId?: string;
  title?: string;
  url?: string;
  pmid?: string;
  pmcid?: string;
  openAlexId?: string;
  sourceType?: string;
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

type OpenAlexWorkResponse = {
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

async function resolveOpenAlexHtmlUrl(source: FullTextEnrichmentSource): Promise<string> {
  const rawId = String(source.openAlexId || '').trim();
  if (!rawId) return '';

  const workId = rawId.replace(/^https?:\/\/openalex\.org\//i, '').trim();
  if (!/^W\d+$/i.test(workId)) return '';

  try {
    const response = await fetch(
      `https://api.openalex.org/works/${encodeURIComponent(workId)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) return '';

    const data = await response.json() as OpenAlexWorkResponse;
    const location = data.best_oa_location;
    if (location?.is_oa !== true || !location.landing_page_url) return '';

    return location.landing_page_url.trim();
  } catch {
    return '';
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

function isBlockedIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)) ) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224;
}

function isBlockedIpAddress(address: string): boolean {
  if (isIP(address) === 4) return isBlockedIpv4(address);
  if (isIP(address) !== 6) return true;

  const normalized = address.toLowerCase().split('%')[0];
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    if (isIP(mapped) === 4) return isBlockedIpv4(mapped);
    return true;
  }

  // Allow only global-unicast IPv6 (2000::/3); deny special-use prefixes.
  const firstHextet = parseInt(normalized.split(':')[0] || '0', 16);
  return !Number.isFinite(firstHextet) ||
    firstHextet < 0x2000 || firstHextet > 0x3fff ||
    normalized.startsWith('2001:db8:');
}

async function validatePublicHttpsUrl(rawUrl: string): Promise<URL | null> {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.localhost') ||
      url.hostname.endsWith('.local') ||
      url.hostname.endsWith('.internal')
    ) {
      return null;
    }

    // Disallow IP literals; resolve hostnames and reject private/reserved addresses.
    if (isIP(url.hostname)) return null;
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(item => isBlockedIpAddress(item.address))) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function readLimitedResponseBody(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxBytes || !response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return '';
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const joined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

async function readHtmlText(url: string): Promise<string> {
  if (!url) return '';

  try {
    let currentUrl = url;
    let response: Response | undefined;

    // Do not let redirects bypass the URL/DNS checks; validate every hop separately.
    for (let redirects = 0; redirects <= 3; redirects++) {
      const safeUrl = await validatePublicHttpsUrl(currentUrl);
      if (!safeUrl) return '';

      response = await fetch(safeUrl.toString(), {
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8'
        },
        signal: AbortSignal.timeout(7000)
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || redirects === 3) return '';
        currentUrl = new URL(location, safeUrl).toString();
        continue;
      }
      break;
    }

    if (!response?.ok) return '';
    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) return '';

    const body = await readLimitedResponseBody(response, 5 * 1024 * 1024);
    if (!body) return '';
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
  claims: string[]
): Promise<Array<T & Partial<FullTextEnrichmentSource>>> {
  if (!Array.isArray(sources) || !claims.some(claim => normalize(claim))) {
    return sources;
  }

  return Promise.all(sources.map(async source => {
    try {
      const pmcid = await resolveOpenAccessPmcId(source);
      if (pmcid) {
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
              claimText: match.claim,
              evidenceText: match.excerpt,
              evidenceType: 'full-text',
              evidenceProvenance: 'server-verified-fulltext',
              evidenceUrl: url
            }) as T & Partial<FullTextEnrichmentSource>;
          }
        }
      }

      const htmlUrl = String(
        source.sourceType === 'OpenAlex'
          ? await resolveOpenAlexHtmlUrl(source)
          : source.sourceType === 'DOAJ'
            ? source.url || source.evidenceUrl || ''
            : ''
      ).trim();
      const htmlText = await readHtmlText(htmlUrl);
      const htmlMatch = findExcerpts(htmlText, claims);
      if (!htmlMatch.excerpt) return source;

      return markServerVerifiedFullText({
        ...source,
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
