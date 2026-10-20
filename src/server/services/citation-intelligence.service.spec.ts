import { describe, expect, it } from 'vitest';
import { CitationIntelligenceService } from './citation-intelligence.service';

describe('citation intelligence strict evidence gate', () => {
  const service = new CitationIntelligenceService();
  const source = {
    id: 'SRC-1', title: 'Grounded Study', author: 'Bandura', year: '1977', publisher: 'Publisher',
    citationEligible: true, evidenceStatus: 'verified', evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext',
    evidenceText: 'Observed evidence supports the stated claim in the verified article full text.'
  };

  it('blocks a citation when the source has only verified identity metadata', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-1', sourceId: 'SRC-1', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [{ ...source, evidenceType: 'abstract' }]);
    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('blocks a citation when full text came from user supplied content', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-1', sourceId: 'SRC-1', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [{ ...source, evidenceProvenance: 'user-supplied-content' }]);
    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('does not allow a claim to elevate missing source evidence metadata', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-SPOOF', sourceId: 'SRC-1', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'Observed evidence supports the stated claim',
      evidenceStatus: 'verified', evidenceType: 'full-text', evidenceProvenance: 'server-verified-fulltext'
    }] }], [{ ...source, evidenceStatus: undefined, evidenceType: undefined, evidenceProvenance: undefined }]);
    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('preserves both authors in APA author-date in-text citations', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-2A', sourceId: 'SRC-2', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [{ ...source, id: 'SRC-2', author: undefined, authors: ['Bandura', 'Walters'] }], 'APA7');
    expect(result.citations[0]?.inText).toBe('(Bandura & Walters, 1977)');
  });

  it('allows a citation only when the verified quote is bound to server-verified full text', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-1', sourceId: 'SRC-1', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [source]);
    expect(result.citations).toHaveLength(1);
    expect(result.verifiedCitationCount).toBe(1);
    expect(result.blockedCitationCount).toBe(0);
  });

  it('blocks a citation when evidenceId points to a different chunk', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-CROSS-CHUNK', sourceId: 'SRC-1', evidenceId: 'EVI-2', citationEligible: true,
      verificationStatus: 'verified', evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [{ ...source, evidenceId: 'EVI-1' }]);
    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('resolves the exact evidence chunk when one source has multiple chunks', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-EXACT-CHUNK', sourceId: 'SRC-1', evidenceId: 'EVI-1', citationEligible: true,
      verificationStatus: 'verified', evidenceQuote: 'Observed evidence supports the stated claim'
    }] }], [
      { ...source, evidenceId: 'EVI-1' },
      { ...source, evidenceId: 'EVI-2', evidenceText: 'A different verified chunk.' }
    ]);
    expect(result.citations).toHaveLength(1);
    expect(result.blockedCitationCount).toBe(0);
  });

  it('blocks a citation when the supplied quote is not actually present in the evidence', () => {
    const result = service.build([{ claims: [{
      citationId: 'CIT-1', sourceId: 'SRC-1', citationEligible: true, verificationStatus: 'verified',
      evidenceQuote: 'This quote is not present'
    }] }], [source]);
    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  const article = {
    ...source,
    id: 'SRC-ARTICLE',
    title: 'Social Learning in Schools',
    author: undefined,
    authors: ['Jane Smith', 'Robert Jones'],
    journal: 'Journal of Learning',
    volume: '12',
    issue: '2',
    pages: '34-45',
    doi: '10.1000/example'
  };
  const verifiedClaim = {
    sourceId: 'SRC-ARTICLE',
    citationEligible: true,
    verificationStatus: 'verified',
    evidenceQuote: 'Observed evidence supports the stated claim'
  };

  it('formats six named styles distinctly for a journal article', () => {
    const result = (style: 'APA7' | 'MLA9' | 'ChicagoAD' | 'ChicagoNB' | 'Harvard' | 'IEEE') =>
      service.build([{ claims: [verifiedClaim] }], [article], style).citations[0];

    expect(result('APA7')?.inText).toBe('(Smith & Jones, 1977)');
    expect(result('MLA9')?.inText).toBe('(Smith and Jones)');
    expect(result('ChicagoAD')?.inText).toBe('(Smith and Jones 1977)');
    expect(result('ChicagoNB')?.inText).toBe('¹');
    expect(result('ChicagoNB')?.footnote).toContain('Journal of Learning');
    expect(result('Harvard')?.inText).toBe('(Smith and Jones, 1977)');
    expect(result('IEEE')?.inText).toBe('[1]');
    expect(result('IEEE')?.bibliography).toMatch(/^\[1\] /u);
    expect(result('MLA9')?.bibliography).toContain('vol. 12');
    expect(result('ChicagoAD')?.bibliography).toContain('Journal of Learning 12');
    expect(result('Harvard')?.bibliography).toContain('pp. 34-45');
  });

  it('reuses the same IEEE and Chicago NB reference number for the same source', () => {
    const paragraphs = [
      { claims: [verifiedClaim] },
      { claims: [{ ...verifiedClaim, citationId: 'CIT-SECOND' }] }
    ];
    const ieee = service.build(paragraphs, [article], 'IEEE');
    expect(ieee.citations.map(item => item.inText)).toEqual(['[1]', '[1]']);
    expect(ieee.citations.every(item => item.bibliography.startsWith('[1] '))).toBe(true);

    const chicago = service.build(paragraphs, [article], 'ChicagoNB');
    expect(chicago.citations.map(item => item.inText)).toEqual(['¹', '¹']);
    expect(chicago.citations.every(item => Boolean(item.footnote))).toBe(true);
  });

  it('does not silently fall back to APA when the runtime style is unsupported', () => {
    const result = service.build([{ claims: [verifiedClaim] }], [article], 'VANCOUVER' as never);
    expect(result.citations).toEqual([]);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('warns about missing style-critical metadata instead of inventing it', () => {
    const result = service.build([{ claims: [verifiedClaim] }], [{
      ...article, year: undefined, publisher: undefined, journal: undefined, volume: undefined
    }], 'ChicagoNB');
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.metadataWarnings).toContain(
      'Publication year is missing; “n.d.” is used rather than inventing a year.'
    );
    expect(result.citations[0]?.metadataWarnings).toContain(
      'A pinpoint page was not supplied for this note.'
    );
  });
});
