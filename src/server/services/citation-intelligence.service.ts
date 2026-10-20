import { isCitationEligibleEvidence } from './evidence-verification-policy';

export type CitationStyle = 'APA7' | 'MLA9' | 'ChicagoAD' | 'ChicagoNB' | 'Harvard' | 'IEEE';

const CITATION_STYLES: CitationStyle[] = ['APA7', 'MLA9', 'ChicagoAD', 'ChicagoNB', 'Harvard', 'IEEE'];

export interface CitationRecord {
  citationId: string;
  sourceId: string;
  label: string;
  inText: string;
  bibliography: string;
  verified: boolean;
  pageRequired: boolean;
  style?: CitationStyle;
  footnote?: string;
  metadataWarnings?: string[];
}

export interface CitationIntelligenceResult {
  citations: CitationRecord[];
  verifiedCitationCount: number;
  blockedCitationCount: number;
  unmappedClaimCount: number;
}

interface CitationMetadata {
  authors: string[];
  title: string;
  year: string;
  publisher: string;
  identifier: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  page: string;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeEvidence(value: unknown): string {
  return clean(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function authorNamesValue(source: any): string[] {
  if (Array.isArray(source?.authors)) {
    return source.authors.map((value: unknown) => clean(value)).filter(Boolean);
  }
  const author = clean(source?.author);
  return author ? [author] : [];
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLocaleLowerCase().trim();
  return !normalized || new Set([
    'ن.د.', 'نادیار', 'unknown author', 'unknown publisher', 'untitled'
  ]).has(normalized);
}

function evidenceKey(sourceId: string, evidenceId: string): string {
  return `${sourceId}::${evidenceId}`;
}

function hasStrictEvidenceBinding(source: any, claim: any): boolean {
  const evidenceQuote = clean(claim?.evidenceQuote);
  const claimEvidenceId = clean(claim?.evidenceId);
  const sourceEvidenceId = clean(source?.evidenceId);
  if (claimEvidenceId || sourceEvidenceId) {
    if (!claimEvidenceId || !sourceEvidenceId || claimEvidenceId !== sourceEvidenceId) return false;
  }

  const sourceEvidence = clean(
    source?.evidenceText ?? source?.fullText ?? source?.content ?? source?.text ?? source?.chunkText
  );
  if (!isCitationEligibleEvidence(
    clean(source?.evidenceStatus) === 'verified' ? 'verified' : 'not_available',
    Boolean(evidenceQuote && sourceEvidence),
    source?.evidenceType,
    source?.evidenceProvenance
  )) return false;

  const quote = normalizeEvidence(evidenceQuote);
  const evidence = normalizeEvidence(sourceEvidence);
  return Boolean(quote && evidence && evidence.includes(quote));
}

interface PersonName { given: string; family: string }

function parsePersonName(value: string): PersonName {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return { given: '', family: '' };
  if (cleaned.includes(',')) {
    const [family = '', ...given] = cleaned.split(',');
    return { family: family.trim(), given: given.join(' ').trim() };
  }
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { given: '', family: parts[0] };
  return { given: parts.slice(0, -1).join(' '), family: parts[parts.length - 1] || '' };
}

function initials(value: string): string {
  return value.split(/[\s-]+/).filter(Boolean).map(part => {
    const letter = Array.from(part)[0];
    return letter ? `${letter.toLocaleUpperCase()}.` : '';
  }).filter(Boolean).join(' ');
}

function personForStyle(value: string, style: CitationStyle, index: number): string {
  const person = parsePersonName(value);
  if (!person.given) return person.family;
  if (style === 'APA7' || style === 'Harvard') return `${person.family}, ${initials(person.given)}`;
  if (style === 'IEEE') return `${initials(person.given)} ${person.family}`.trim();
  return index === 0 ? `${person.family}, ${person.given}` : `${person.given} ${person.family}`;
}

function joinAuthors(names: string[], style: CitationStyle): string {
  const formatted = names.map((name, index) => personForStyle(name, style, index)).filter(Boolean);
  if (formatted.length <= 1) return formatted[0] || '';
  if (style === 'MLA9' && formatted.length >= 3) return `${formatted[0]}, et al.`;
  const last = formatted[formatted.length - 1] || '';
  const prefix = formatted.slice(0, -1).join(', ');
  if (style === 'APA7') return `${prefix}, & ${last}`;
  return `${prefix} and ${last}`;
}

function surname(value: string): string {
  return parsePersonName(value).family;
}

function surnameList(names: string[], style: CitationStyle): string {
  const surnames = names.map(surname).filter(Boolean);
  if (surnames.length >= 3) return `${surnames[0]} et al.`;
  if (surnames.length === 2) return style === 'APA7'
    ? `${surnames[0]} & ${surnames[1]}`
    : `${surnames[0]} and ${surnames[1]}`;
  return surnames[0] || '';
}

function identifierValue(source: any): string {
  const value = clean(source?.doi || source?.doiOrIsbn);
  if (!value) return '';
  const doi = value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  return /^10\.\d{4,9}\/\S+$/iu.test(doi) ? `https://doi.org/${doi}` : value;
}

function citationMetadata(source: any, page: string): CitationMetadata {
  return {
    authors: authorNamesValue(source),
    title: clean(source?.title || source?.sourceTitle),
    year: clean(source?.year || source?.publicationYear) || 'n.d.',
    publisher: clean(source?.publisher),
    identifier: identifierValue(source),
    journal: clean(source?.journal || source?.journalTitle || source?.containerTitle),
    volume: clean(source?.volume),
    issue: clean(source?.issue),
    pages: clean(source?.pages || source?.pageRange),
    page
  };
}

function metadataWarnings(meta: CitationMetadata, style: CitationStyle): string[] {
  const warnings: string[] = [];
  if (meta.year === 'n.d.') warnings.push('Publication year is missing; “n.d.” is used rather than inventing a year.');
  if (!meta.journal && !meta.publisher) warnings.push('Journal or publisher metadata is missing.');
  if (meta.journal && !meta.volume) warnings.push('Journal volume is unavailable.');
  if (style === 'ChicagoNB' && !meta.page) warnings.push('A pinpoint page was not supplied for this note.');
  return warnings;
}

function superscriptNumber(value: number): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return String(value).split('').map(digit => map[digit] || digit).join('');
}

function formatInText(meta: CitationMetadata, style: CitationStyle, number: number): string {
  const author = surnameList(meta.authors, style);
  if (style === 'IEEE') return `[${number}]`;
  if (style === 'ChicagoNB') return superscriptNumber(number);
  if (style === 'MLA9') return `(${author}${meta.page ? ` ${meta.page}` : ''})`;
  if (style === 'ChicagoAD') {
    return `(${author}${author ? ' ' : ''}${meta.year}${meta.page ? `, ${meta.page}` : ''})`;
  }
  return style === 'Harvard'
    ? `(${author}, ${meta.year}${meta.page ? `, p. ${meta.page}` : ''})`
    : `(${author}, ${meta.year}${meta.page ? `, p. ${meta.page}` : ''})`;
}

function formatChicagoNote(meta: CitationMetadata): string {
  const authors = joinAuthors(meta.authors, 'ChicagoNB');
  const title = meta.journal ? `"${meta.title},"` : meta.title;
  const publication = meta.journal
    ? `${meta.journal}${meta.volume ? ` ${meta.volume}` : ''}${meta.issue ? `, no. ${meta.issue}` : ''} (${meta.year})`
    : (meta.publisher ? `${meta.publisher}, ${meta.year}` : meta.year);
  const page = meta.page ? `, ${meta.page}` : '';
  const identifier = meta.identifier ? `, ${meta.identifier}` : '';
  return `${authors}, ${title} ${publication}${page}${identifier}.`.trim();
}

function formatBibliography(meta: CitationMetadata, style: CitationStyle, number: number): string {
  const authors = joinAuthors(meta.authors, style);
  const title = meta.title;
  const identifier = meta.identifier;
  const journal = meta.journal;

  if (style === 'IEEE') {
    const details = journal
      ? ` ${journal}${meta.volume ? `, vol. ${meta.volume}` : ''}${meta.issue ? `, no. ${meta.issue}` : ''}${meta.pages ? `, pp. ${meta.pages}` : ''}, ${meta.year}`
      : (meta.publisher ? `, ${meta.publisher}, ${meta.year}` : `, ${meta.year}`);
    return `[${number}] ${authors}, "${title}," ${details.trim()}${identifier ? `, doi: ${identifier}` : ''}.`
      .replace(/\s+/g, ' ').trim();
  }

  if (style === 'APA7') {
    const body = journal
      ? `${title}. ${journal}${meta.volume ? `, ${meta.volume}${meta.issue ? `(${meta.issue})` : ''}` : ''}${meta.pages ? `, ${meta.pages}` : ''}.`
      : `${title}.${meta.publisher ? ` ${meta.publisher}.` : ''}`;
    return `${authors} (${meta.year}). ${body}${identifier ? ` ${identifier}` : ''}`.trim();
  }

  if (style === 'MLA9') {
    if (journal) return `${authors}. "${title}." ${journal}${meta.volume ? `, vol. ${meta.volume}` : ''}${meta.issue ? `, no. ${meta.issue}` : ''}${meta.pages ? `, pp. ${meta.pages}` : ''}, ${meta.year}.${identifier ? ` ${identifier}.` : ''}`;
    return `${authors}. ${title}. ${meta.publisher ? `${meta.publisher}, ` : ''}${meta.year}.${identifier ? ` ${identifier}` : ''}`.trim();
  }

  if (style === 'ChicagoAD') {
    if (journal) return `${authors}. ${meta.year}. "${title}." ${journal}${meta.volume ? ` ${meta.volume}` : ''}${meta.issue ? ` (${meta.issue})` : ''}${meta.pages ? `: ${meta.pages}` : ''}.${identifier ? ` ${identifier}.` : ''}`;
    return `${authors}. ${meta.year}. ${title}.${meta.publisher ? ` ${meta.publisher}.` : ''}${identifier ? ` ${identifier}.` : ''}`.trim();
  }

  if (style === 'ChicagoNB') {
    if (journal) return `${authors}. "${title}." ${journal}${meta.volume ? ` ${meta.volume}` : ''}${meta.issue ? `, no. ${meta.issue}` : ''} (${meta.year})${meta.pages ? `: ${meta.pages}` : ''}.${identifier ? ` ${identifier}.` : ''}`;
    return `${authors}. ${title}.${meta.publisher ? ` ${meta.publisher},` : ''} ${meta.year}.${identifier ? ` ${identifier}.` : ''}`.trim();
  }

  if (journal) return `${authors} (${meta.year}) '${title}', ${journal}${meta.volume ? `, vol. ${meta.volume}` : ''}${meta.issue ? `, no. ${meta.issue}` : ''}${meta.pages ? `, pp. ${meta.pages}` : ''}.${identifier ? ` ${identifier}.` : ''}`;
  return `${authors} (${meta.year}) ${title}.${meta.publisher ? ` ${meta.publisher}.` : ''}${identifier ? ` ${identifier}.` : ''}`.trim();
}

export class CitationIntelligenceService {
  public build(paragraphs: any[], verifiedSources: any[], style: CitationStyle = 'APA7'): CitationIntelligenceResult {
    const claimList = (Array.isArray(paragraphs) ? paragraphs : [])
      .flatMap(paragraph => Array.isArray(paragraph?.claims) ? paragraph.claims : []);
    if (!CITATION_STYLES.includes(style)) {
      return {
        citations: [],
        verifiedCitationCount: 0,
        blockedCitationCount: claimList.length,
        unmappedClaimCount: claimList.filter(claim => !clean(claim?.sourceId)).length
      };
    }

    const sources = Array.isArray(verifiedSources) ? verifiedSources : [];
    const sourceById = new Map<string, any>();
    const sourceIdCounts = new Map<string, number>();
    const sourceByEvidenceId = new Map<string, any>();
    for (const source of sources) {
      const id = clean(source?.id ?? source?.sourceId ?? source?.doiOrIsbn ?? source?.doi);
      const evidenceId = clean(source?.evidenceId);
      if (!id) continue;
      sourceIdCounts.set(id, (sourceIdCounts.get(id) || 0) + 1);
      if (evidenceId) sourceByEvidenceId.set(evidenceKey(id, evidenceId), source);
    }
    for (const [id, count] of sourceIdCounts) {
      if (count === 1) {
        const source = sources.find(item =>
          clean(item?.id ?? item?.sourceId ?? item?.doiOrIsbn ?? item?.doi) === id
        );
        if (source) sourceById.set(id, source);
      }
    }

    const citations: CitationRecord[] = [];
    let unmappedClaimCount = 0;
    let blockedCitationCount = 0;
    let citationNumber = 0;
    const referenceNumberBySource = new Map<string, number>();

    for (const paragraph of Array.isArray(paragraphs) ? paragraphs : []) {
      for (const claim of Array.isArray(paragraph?.claims) ? paragraph.claims : []) {
        const sourceId = clean(claim?.sourceId);
        const evidenceId = clean(claim?.evidenceId);
        const source = evidenceId
          ? sourceByEvidenceId.get(evidenceKey(sourceId, evidenceId))
          : sourceById.get(sourceId);
        const eligible = source &&
          source.citationEligible !== false &&
          claim?.citationEligible === true &&
          claim?.verificationStatus === 'verified';

        if (!eligible || !hasStrictEvidenceBinding(source, claim)) {
          blockedCitationCount++;
          if (!sourceId || !source) unmappedClaimCount++;
          continue;
        }

        const authors = authorNamesValue(source);
        const title = clean(source.sourceTitle || source.title);
        if (!authors.length || isPlaceholder(title) || authors.every(isPlaceholder)) {
          blockedCitationCount++;
          continue;
        }
        const page = clean(claim.page || claim.pageNumber);
        const meta = citationMetadata({ ...source, title, authors }, page);
        let number = citationNumber + 1;
        if (style === 'IEEE' || style === 'ChicagoNB') {
          const existing = referenceNumberBySource.get(sourceId);
          if (existing) number = existing;
          else {
            citationNumber += 1;
            number = citationNumber;
            referenceNumberBySource.set(sourceId, number);
          }
        } else {
          citationNumber += 1;
        }

        const citation: CitationRecord = {
          citationId: clean(claim.citationId) || `CIT-${citations.length + 1}`,
          sourceId,
          label: title,
          inText: formatInText(meta, style, number),
          bibliography: formatBibliography(meta, style, number),
          verified: true,
          pageRequired: style === 'ChicagoNB' || Boolean(page),
          style,
          metadataWarnings: metadataWarnings(meta, style)
        };
        if (style === 'ChicagoNB') citation.footnote = formatChicagoNote(meta);
        citations.push(citation);
      }
    }

    return { citations, verifiedCitationCount: citations.length, blockedCitationCount, unmappedClaimCount };
  }
}

export const citationIntelligenceService = new CitationIntelligenceService();
