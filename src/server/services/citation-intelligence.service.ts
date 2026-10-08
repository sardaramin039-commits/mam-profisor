import { isCitationEligibleEvidence } from './evidence-verification-policy';

export type CitationStyle = 'APA7' | 'MLA9' | 'ChicagoAD' | 'ChicagoNB' | 'Harvard' | 'IEEE';

export interface CitationRecord {
  citationId: string;
  sourceId: string;
  label: string;
  inText: string;
  bibliography: string;
  verified: boolean;
  pageRequired: boolean;
}

export interface CitationIntelligenceResult {
  citations: CitationRecord[];
  verifiedCitationCount: number;
  blockedCitationCount: number;
  unmappedClaimCount: number;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeEvidence(value: unknown): string {
  return clean(value)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function authorsValue(source: any): string {
  if (Array.isArray(source?.authors)) {
    const authors = source.authors.map((value: unknown) => clean(value)).filter(Boolean).join(', ');
    if (authors) return authors;
  }
  if (typeof source?.author === 'string') return clean(source.author);
  return '';
}

function authorNamesValue(source: any, authors: string): string[] {
  if (Array.isArray(source?.authors)) {
    return source.authors.map((value: unknown) => clean(value)).filter(Boolean);
  }
  return authors ? [authors] : [];
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLocaleLowerCase().trim();
  return !normalized || new Set([
    'ن.د.',
    'نادیار',
    'unknown author',
    'unknown publisher',
    'untitled'
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
    if (!claimEvidenceId || !sourceEvidenceId || claimEvidenceId !== sourceEvidenceId) {
      return false;
    }
  }
  const sourceEvidence = clean(
    source?.evidenceText ??
    source?.fullText ??
    source?.content ??
    source?.text ??
    source?.chunkText
  );
  const evidenceStatus = clean(source?.evidenceStatus);
  const evidenceType = source?.evidenceType;
  const evidenceProvenance = source?.evidenceProvenance;

  if (
    !isCitationEligibleEvidence(
      evidenceStatus === 'verified' ? 'verified' : 'not_available',
      Boolean(evidenceQuote && sourceEvidence),
      evidenceType,
      evidenceProvenance
    )
  ) {
    return false;
  }

  const quote = normalizeEvidence(evidenceQuote);
  const evidence = normalizeEvidence(sourceEvidence);
  return Boolean(quote && evidence && evidence.includes(quote));
}

export class CitationIntelligenceService {
  public build(
    paragraphs: any[],
    verifiedSources: any[],
    style: CitationStyle = 'APA7'
  ): CitationIntelligenceResult {
    const sources = Array.isArray(verifiedSources) ? verifiedSources : [];
    const sourceById = new Map<string, any>();
    const sourceIdCounts = new Map<string, number>();
    const sourceByEvidenceId = new Map<string, any>();

    for (const source of sources) {
      const id = clean(source?.id ?? source?.sourceId ?? source?.doiOrIsbn ?? source?.doi);
      const evidenceId = clean(source?.evidenceId);
      if (!id) continue;

      sourceIdCounts.set(id, (sourceIdCounts.get(id) || 0) + 1);
      if (evidenceId) {
        sourceByEvidenceId.set(evidenceKey(id, evidenceId), source);
      }
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
    const ieeeNumberBySource = new Map<string, number>();

    for (const paragraph of Array.isArray(paragraphs) ? paragraphs : []) {
      for (const claim of Array.isArray(paragraph?.claims) ? paragraph.claims : []) {
        const sourceId = clean(claim?.sourceId);
        const evidenceId = clean(claim?.evidenceId);
        const source = evidenceId
          ? sourceByEvidenceId.get(evidenceKey(sourceId, evidenceId))
          : sourceById.get(sourceId);

        const sourceAndClaimVerified =
          source &&
          source.citationEligible !== false &&
          claim?.citationEligible === true &&
          claim?.verificationStatus === 'verified';

        if (!sourceAndClaimVerified || !hasStrictEvidenceBinding(source, claim)) {
          blockedCitationCount++;
          if (!sourceId || !source) unmappedClaimCount++;
          continue;
        }

        const authors = authorsValue(source);
        const title = clean(source.sourceTitle || source.title);
        const year = clean(source.year || source.publicationYear) || 'n.d.';
        const page = clean(claim.page || claim.pageNumber);

        if (isPlaceholder(authors) || isPlaceholder(title)) {
          blockedCitationCount++;
          continue;
        }

        let referenceNumber = citationNumber + 1;
        if (style === 'IEEE') {
          const existingNumber = ieeeNumberBySource.get(sourceId);
          if (existingNumber) {
            referenceNumber = existingNumber;
          } else {
            citationNumber += 1;
            referenceNumber = citationNumber;
            ieeeNumberBySource.set(sourceId, referenceNumber);
          }
        } else {
          citationNumber += 1;
          referenceNumber = citationNumber;
        }

        const inText = this.formatInText(
          authorNamesValue(source, authors),
          year,
          page,
          style,
          referenceNumber
        );
        const bibliography = this.formatBibliography(
          authors,
          year,
          title,
          clean(source.publisher),
          clean(source.doiOrIsbn || source.doi),
          style
        );

        citations.push({
          citationId: clean(claim.citationId) || `CIT-${citations.length + 1}`,
          sourceId,
          label: title,
          inText,
          bibliography,
          verified: true,
          pageRequired: style === 'ChicagoNB' || Boolean(page)
        });
      }
    }

    return {
      citations,
      verifiedCitationCount: citations.length,
      blockedCitationCount,
      unmappedClaimCount
    };
  }

  private formatInText(
    authorNames: string[],
    year: string,
    page: string,
    style: CitationStyle,
    number: number
  ): string {
    const citedAuthors = authorNames.map(name => {
      const parts = name.split(/[\s,]+/).map(value => value.trim()).filter(Boolean);
      return parts[parts.length - 1] || name;
    });
    const author = citedAuthors[0] || '';
    const withEtAl = citedAuthors.length >= 3 ? `${author} et al.` : author;
    const twoAuthors = authorNames.slice(0, 2);
    const pair = twoAuthors.length === 2 ? twoAuthors.join(' and ') : author;
    const apaPair = twoAuthors.length === 2 ? twoAuthors.join(' & ') : author;

    if (style === 'IEEE' || style === 'ChicagoNB') return `[${number}]`;
    if (style === 'MLA9') return `(${authorNames.length >= 3 ? withEtAl : pair}${page ? ` ${page}` : ''})`;
    if (style === 'ChicagoAD') return `(${authorNames.length >= 3 ? withEtAl : pair}, ${year}${page ? `, ${page}` : ''})`;
    return `(${authorNames.length >= 3 ? withEtAl : apaPair}, ${year}${page ? `, p. ${page}` : ''})`;
  }

  private formatBibliography(
    authors: string,
    year: string,
    title: string,
    publisher: string,
    identifier: string,
    style: CitationStyle
  ): string {
    const details = [publisher, identifier].filter(Boolean).join(' ');
    if (style === 'IEEE') return `${authors}. "${title}." ${details}${details ? ', ' : ''}${year}.`.trim();
    if (style === 'MLA9') return `${authors}. ${title}.${publisher ? ` ${publisher},` : ''} ${year}.${identifier ? ` ${identifier}` : ''}`.trim();
    if (style === 'ChicagoNB') return `${authors}. ${title}.${publisher ? ` ${publisher},` : ''} ${year}.${identifier ? ` ${identifier}` : ''}`.trim();
    return `${authors} (${year}). ${title}.${publisher ? ` ${publisher}.` : ''}${identifier ? ` ${identifier}` : ''}`.trim();
  }
}

export const citationIntelligenceService = new CitationIntelligenceService();
