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

export class CitationIntelligenceService {
  public build(
    paragraphs: any[],
    verifiedSources: any[],
    style: CitationStyle = 'APA7'
  ): CitationIntelligenceResult {
    const sources = Array.isArray(verifiedSources) ? verifiedSources : [];
    const sourceById = new Map<string, any>();
    for (const source of sources) {
      const id = clean(source?.id ?? source?.sourceId ?? source?.doiOrIsbn ?? source?.doi);
      if (id) sourceById.set(id, source);
    }

    const citations: CitationRecord[] = [];
    let unmappedClaimCount = 0;
    let blockedCitationCount = 0;

    for (const paragraph of Array.isArray(paragraphs) ? paragraphs : []) {
      for (const claim of Array.isArray(paragraph?.claims) ? paragraph.claims : []) {
        const sourceId = clean(claim?.sourceId);
        const source = sourceById.get(sourceId);
        if (!source || claim?.citationEligible !== true || claim?.verificationStatus !== 'verified') {
          blockedCitationCount++;
          if (!sourceId) unmappedClaimCount++;
          continue;
        }

        const authors = clean(source.author || source.authors || 'ن.د.');
        const year = clean(source.year || source.publicationYear || 'n.d.');
        const title = clean(source.sourceTitle || source.title || 'Untitled');
        const page = clean(claim.page || claim.pageNumber);
        const inText = this.formatInText(authors, year, page, style);
        const bibliography = this.formatBibliography(authors, year, title, clean(source.publisher), clean(source.doiOrIsbn || source.doi), style);
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

  private formatInText(authors: string, year: string, page: string, style: CitationStyle): string {
    const author = authors.split(',')[0].trim();
    if (style === 'IEEE') return '[verified]';
    if (style === 'MLA9') return `(${author}${page ? ` ${page}` : ''})`;
    if (style === 'ChicagoNB') return '[footnote-eligible]';
    return `(${author}, ${year}${page ? `, p. ${page}` : ''})`;
  }

  private formatBibliography(
    authors: string,
    year: string,
    title: string,
    publisher: string,
    identifier: string,
    style: CitationStyle
  ): string {
    if (style === 'IEEE') return `${authors}. "${title}." ${publisher}, ${year}. ${identifier}`.trim();
    if (style === 'MLA9') return `${authors}. ${title}. ${publisher}, ${year}. ${identifier}`.trim();
    return `${authors} (${year}). ${title}. ${publisher}.${identifier ? ` ${identifier}` : ''}`.trim();
  }
}

export const citationIntelligenceService = new CitationIntelligenceService();
