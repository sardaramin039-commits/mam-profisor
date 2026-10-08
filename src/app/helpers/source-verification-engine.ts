export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED';
export type IdentityVerificationStatus = 'verified' | 'unverified';
export type EvidenceVerificationStatus = 'verified' | 'unverified' | 'not_available';

export type SourceTierLevel = 'Tier 1' | 'Tier 2' | 'Tier 3';

export type ContentKind = 'SOURCE-BASED' | 'SYNTHESIS' | 'AI-INFERENCE';

export interface SourceIdentifiers {
  doi?: string;
  isbn?: string;
  pmid?: string;
  openAlexId?: string;
  crossrefId?: string;
  semanticScholarId?: string;
  url?: string;
}

export interface VerifiedCitationRecord {
  id: string;
  claimText?: string;
  title: string;
  author: string;
  publicationYear: number | null;
  publisherOrJournal: string;
  identifiers: SourceIdentifiers;
  doiOrUrl?: string;
  pageNumber?: number | string | null;
  exactEvidenceSnippet: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  identityStatus: IdentityVerificationStatus;
  evidenceStatus: EvidenceVerificationStatus;
  citationEligible: boolean;
  verificationNotes?: string;
  auditDate: string;

  tier: SourceTierLevel;
  tierName: string;
  reliabilityScore: number;

  canonicalSource: boolean;
  duplicateOf: string | null;
  mirrorsCount: number;

  workflowStepsCompleted: {
    searched: boolean;
    retrieved: boolean;
    read: boolean;
    verified: boolean;
    cited: boolean;
  };
}

export interface EvidenceLinkedClaim {
  claimId: string;
  claimText: string;
  sourceId: string;
  sourceTitle: string;
  author: string;
  publicationYear: number | null;
  pageNumber: number | string | null;
  evidenceText: string;
  sourceURL?: string;
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  contentKind: ContentKind;
  badges: {
    primary: string;
    secondary: string;
  };
}

export interface ResearchGateAuditResult {
  passed: boolean;
  score: number;
  insufficientReason?: string;
  missingClaims: string[];
  missingEvidence: string[];
  unverifiedSources: string[];
  recommendedSources: string[];
  canonicalSourceCount: number;
  verifiedSourceCount: number;
}

export interface VerificationAuditReport {
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  verifiedSources: VerifiedCitationRecord[];
  partiallyVerifiedSources: VerifiedCitationRecord[];
  unverifiedClaims: VerifiedCitationRecord[];
  formattedSummaryMarkdown: string;
}

function normalize(value: string): string {
  return (value || '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function deterministicId(prefix: string, value: string): string {
  let hash = 2166136261;
  const normalized = normalize(value);
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

function hasAuthoritativeIdentifier(source: { identifiers?: SourceIdentifiers; doiOrUrl?: string }): boolean {
  const identifiers = source.identifiers || {};
  return Boolean(
    identifiers.doi ||
    identifiers.isbn ||
    identifiers.pmid ||
    identifiers.openAlexId ||
    identifiers.crossrefId ||
    identifiers.semanticScholarId
  );
}

export class SourceVerificationEngine {
  /**
   * Tier is a deterministic retrieval-quality heuristic. It is NOT a verification result.
   */
  public static calculateSourceTier(sourceNameOrUrl: string): {
    tier: SourceTierLevel;
    tierName: string;
    score: number;
  } {
    const source = normalize(sourceNameOrUrl);

    const tier1Keywords = [
      'crossref', 'openalex', 'semantic scholar', 'pubmed', 'doaj',
      'library of congress', 'worldcat', 'doi.org', 'ieee', 'springer',
      'nature', 'jstor', 'sciencedirect'
    ];
    const tier2Keywords = [
      'google books', 'internet archive', 'open library', 'europeana',
      'university repository', 'digital repository', 'hathitrust', 'arxiv'
    ];

    if (tier1Keywords.some(keyword => source.includes(keyword))) {
      const matched = tier1Keywords.find(keyword => source.includes(keyword)) || 'academic-index';
      return {
        tier: 'Tier 1',
        tierName: `Academic / Index (${matched})`,
        score: 90
      };
    }

    if (tier2Keywords.some(keyword => source.includes(keyword))) {
      const matched = tier2Keywords.find(keyword => source.includes(keyword)) || 'digital-library';
      return {
        tier: 'Tier 2',
        tierName: `Digital Library / Archive (${matched})`,
        score: 70
      };
    }

    return {
      tier: 'Tier 3',
      tierName: 'General Web / Unclassified',
      score: 40
    };
  }

  /**
   * Local workflow only. A local snippet can establish an evidence match,
   * but it cannot establish that the publication itself exists in an authority.
   * Therefore this method never upgrades a source to VERIFIED on its own.
   */
  public static processWorkflow(
    rawClaim: string,
    candidateSource: {
      title?: string;
      author?: string;
      publicationYear?: number | null;
      publisherOrJournal?: string;
      identifiers?: SourceIdentifiers;
      doiOrUrl?: string;
      pageNumber?: number | string | null;
      retrievedTextSnippet?: string;
      sourceUrl?: string;
      externallyVerified?: boolean;
      serverVerifiedFullText?: boolean;
    }
  ): VerifiedCitationRecord {
    const title = (candidateSource.title || '').trim();
    const author = (candidateSource.author || '').trim();
    const snippet = (candidateSource.retrievedTextSnippet || '').trim();
    const rawIdentifier = candidateSource.doiOrUrl || candidateSource.identifiers?.doi || candidateSource.identifiers?.isbn || candidateSource.identifiers?.pmid || '';

    const id = deterministicId('VERIF', [
      rawClaim,
      title,
      author,
      String(candidateSource.publicationYear || ''),
      rawIdentifier,
      snippet
    ].join('::'));

    const sourceRef = [
      candidateSource.publisherOrJournal || '',
      candidateSource.doiOrUrl || '',
      candidateSource.sourceUrl || '',
      title
    ].join(' ');
    const tierInfo = this.calculateSourceTier(sourceRef);

    const searched = Boolean(title || author || rawIdentifier || candidateSource.sourceUrl);
    const retrieved = Boolean(title && author);
    const read = snippet.length >= 10;
    const claimMatch = Boolean(
      rawClaim.trim() &&
      snippet &&
      (normalize(snippet).includes(normalize(rawClaim)) || normalize(rawClaim).includes(normalize(snippet)))
    );
    const authoritativeIdentifier = hasAuthoritativeIdentifier(candidateSource);

    let status: VerificationStatus = 'UNVERIFIED';
    let notes = 'ناسنامەی دەرەکی یان پشتڕاستکردنەوەی authority بەردەست نییە؛ source ـەکە Verified ناکرێت.';
    const evidenceStatus: EvidenceVerificationStatus =
      !snippet || snippet.length < 10
        ? 'not_available'
        : claimMatch
          ? 'verified'
          : 'unverified';
    const identityStatus: IdentityVerificationStatus =
      candidateSource.externallyVerified === true &&
      candidateSource.serverVerifiedFullText === true &&
      retrieved &&
      authoritativeIdentifier
        ? 'verified'
        : 'unverified';

    if (
      identityStatus === 'verified' &&
      evidenceStatus === 'verified'
    ) {
      status = 'VERIFIED';
      notes = 'ناسنامەی source و evidence ـی claim هەردووکیان پشتڕاستکراونەتەوە؛ source مافی citation هەیە.';
    } else if (retrieved && read && claimMatch) {
      status = 'PARTIALLY_VERIFIED';
      notes = 'Claim ـەکە لە snippet ـی وەرگیراودا هەڵکەوتووە، بەڵام identity ـی source بە authority دەرەکی پشتڕاست نەکراوەتەوە.';
    } else if (retrieved && read) {
      status = 'UNVERIFIED';
      notes = 'دەقی source بەردەستە، بەڵام evidence ـی ڕوون یان پشتڕاستکردنەوەی دەرەکی بەس نییە.';
    } else if (!retrieved) {
      notes = 'metadata ـی سەرچاوەکە تەواو نییە؛ citation ـی پشتڕاستکراو دروست ناکرێت.';
    } else if (!read) {
      notes = 'دەقی evidence بەردەست نییە؛ citation ـی پشتڕاستکراو دروست ناکرێت.';
    }

    const verificationBonus = status === 'VERIFIED' ? 10 : status === 'PARTIALLY_VERIFIED' ? -5 : -25;
    const reliabilityScore = Math.max(0, Math.min(100, tierInfo.score + verificationBonus));

    return {
      id,
      claimText: rawClaim.trim(),
      title: title || 'سەرچاوەی دیارینەکراو',
      author: author || 'نووسەر دیارینەکراو نییە',
      publicationYear: candidateSource.publicationYear ?? null,
      publisherOrJournal: candidateSource.publisherOrJournal || 'ناوی بڵاوکەرەوە/گۆڤار دیارینەکراوە',
      identifiers: candidateSource.identifiers || {
        doi: candidateSource.doiOrUrl,
        url: candidateSource.sourceUrl
      },
      doiOrUrl: rawIdentifier || candidateSource.sourceUrl,
      pageNumber: status === 'VERIFIED' ? (candidateSource.pageNumber ?? null) : null,
      exactEvidenceSnippet: snippet,
      sourceUrl: candidateSource.sourceUrl || candidateSource.doiOrUrl,
      verificationStatus: status,
      identityStatus,
      evidenceStatus,
      citationEligible: identityStatus === 'verified' && evidenceStatus === 'verified',
      verificationNotes: notes,
      auditDate: new Date().toISOString(),
      tier: tierInfo.tier,
      tierName: tierInfo.tierName,
      reliabilityScore,
      canonicalSource: true,
      duplicateOf: null,
      mirrorsCount: 0,
      workflowStepsCompleted: {
        searched,
        retrieved,
        read,
        verified: status === 'VERIFIED',
        cited: status === 'VERIFIED'
      }
    };
  }

  public static deduplicateSources(sources: VerifiedCitationRecord[]): VerifiedCitationRecord[] {
    const canonicalMap = new Map<string, VerifiedCitationRecord>();

    for (const source of sources) {
      const normalizedDoi = normalize(source.identifiers?.doi || '');
      const normalizedIsbn = normalize(source.identifiers?.isbn || '');
      const normalizedUrl = normalize(source.identifiers?.url || source.sourceUrl || '');
      const fallbackFingerprint = `${normalize(source.title)}::${normalize(source.author)}::${source.publicationYear || ''}`;
      const fingerprint = normalizedDoi || normalizedIsbn || normalizedUrl || fallbackFingerprint;

      const existing = canonicalMap.get(fingerprint);
      if (existing) {
        existing.mirrorsCount += 1;
        if (source.citationEligible && !existing.citationEligible) {
          existing.verificationStatus = 'VERIFIED';
          existing.identityStatus = 'verified';
          existing.evidenceStatus = 'verified';
          existing.citationEligible = true;
          existing.verificationNotes = source.verificationNotes;
          existing.workflowStepsCompleted.verified = true;
          existing.workflowStepsCompleted.cited = true;
          existing.pageNumber = source.pageNumber;
        }
        existing.reliabilityScore = Math.max(existing.reliabilityScore, source.reliabilityScore);
      } else {
        canonicalMap.set(fingerprint, {
          ...source,
          identifiers: { ...source.identifiers },
          workflowStepsCompleted: { ...source.workflowStepsCompleted }
        });
      }
    }

    return Array.from(canonicalMap.values()).sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  public static createLinkedClaim(
    claimText: string,
    source: VerifiedCitationRecord,
    kind: ContentKind
  ): EvidenceLinkedClaim {
    const claimId = deterministicId('CLAIM', `${source.id}::${claimText}::${kind}`);
    const verified = source.citationEligible === true;

    let primaryBadge = '[Source-Based]';
    let secondaryBadge = verified ? '[Evidence Verified]' : '[Evidence Not Verified]';

    if (kind === 'SYNTHESIS') {
      primaryBadge = '[Synthesis]';
      secondaryBadge = '[Multiple Sources — Verify]';
    } else if (kind === 'AI-INFERENCE') {
      primaryBadge = '[AI-Inference]';
      secondaryBadge = '[Requires Verification]';
    }

    return {
      claimId,
      claimText,
      sourceId: source.id,
      sourceTitle: source.title,
      author: source.author,
      publicationYear: source.publicationYear,
      pageNumber: verified ? (source.pageNumber ?? null) : null,
      evidenceText: source.exactEvidenceSnippet,
      sourceURL: source.sourceUrl || source.doiOrUrl,
      verificationStatus: verified ? 'VERIFIED' : source.verificationStatus,
      confidenceScore: verified ? source.reliabilityScore : 0,
      contentKind: kind,
      badges: {
        primary: primaryBadge,
        secondary: secondaryBadge
      }
    };
  }

  public static auditResearchGate(
    sources: VerifiedCitationRecord[],
    claims: EvidenceLinkedClaim[]
  ): ResearchGateAuditResult {
    const deduplicated = this.deduplicateSources(sources);
    const verifiedSources = deduplicated.filter(source => source.citationEligible === true);
    const unverifiedSources = deduplicated.filter(source => source.citationEligible !== true);

    const missingClaims: string[] = [];
    const missingEvidence: string[] = [];
    const unverifiedSourceTitles = unverifiedSources.map(source => source.title);

    for (const claim of claims) {
      if (claim.verificationStatus !== 'VERIFIED' || !claim.evidenceText || claim.evidenceText.length < 10) {
        missingClaims.push(claim.claimText);
        missingEvidence.push(`هیچ بەڵگەی تەواو بۆ claim ـی «${claim.claimText.slice(0, 80)}» پشتڕاست نەکراوە.`);
      }
    }

    const passed = verifiedSources.length > 0 && missingClaims.length === 0;
    const score = verifiedSources.length === 0
      ? 0
      : Math.round((verifiedSources.length / Math.max(1, deduplicated.length)) * 100);

    return {
      passed,
      score,
      insufficientReason: passed
        ? undefined
        : 'تا source ـی دەرەکی پشتڕاستکراو و evidence ـی هەمان source نەبێت، Research Gate بەڵگەنامەکە بە پاس نازانێت.',
      missingClaims,
      missingEvidence,
      unverifiedSources: unverifiedSourceTitles,
      recommendedSources: [
        'Crossref DOI Index',
        'OpenAlex',
        'PubMed',
        'WorldCat / Library of Congress'
      ],
      canonicalSourceCount: deduplicated.length,
      verifiedSourceCount: verifiedSources.length
    };
  }

  public static generateAuditReport(records: VerifiedCitationRecord[]): VerificationAuditReport {
    const deduplicated = this.deduplicateSources(records);
    const verifiedSources = deduplicated.filter(record => record.verificationStatus === 'VERIFIED');
    const partiallyVerifiedSources = deduplicated.filter(record => record.verificationStatus === 'PARTIALLY_VERIFIED');
    const unverifiedClaims = deduplicated.filter(record => record.verificationStatus === 'UNVERIFIED');

    let markdown = '### Source Verification Audit\n\n';
    markdown += '#### 🟢 Verified Sources\n';
    if (verifiedSources.length === 0) {
      markdown += '* هیچ source ـێکی تەواو پشتڕاستکراو لەم audit ـەدا نییە.\n\n';
    } else {
      for (const source of verifiedSources) {
        markdown += `- **${source.author}** (${source.publicationYear ?? 'n.d.'}). *${source.title}*. ${source.publisherOrJournal}.\n`;
        markdown += `  - Tier: ${source.tier} | Heuristic score: ${source.reliabilityScore}/100\n`;
        if (source.pageNumber) markdown += `  - Page: ${source.pageNumber}\n`;
        if (source.doiOrUrl) markdown += `  - DOI/URL: ${source.doiOrUrl}\n`;
        markdown += `  - Evidence: ${source.exactEvidenceSnippet || '—'}\n`;
      }
      markdown += '\n';
    }

    markdown += '#### 🟡 Partially Verified Sources\n';
    if (partiallyVerifiedSources.length === 0) {
      markdown += '* هیچ source ـێکی بەشێکی پشتڕاستکراو نییە.\n\n';
    } else {
      for (const source of partiallyVerifiedSources) {
        markdown += `- **${source.title}** — ${source.verificationNotes || 'پێویستی بە پشتڕاستکردنەوەی زیاتر هەیە.'}\n`;
      }
      markdown += '\n';
    }

    markdown += '#### 🔴 Unverified Claims\n';
    if (unverifiedClaims.length === 0) {
      markdown += '* هیچ claim ـێکی UNVERIFIED نییە.\n';
    } else {
      for (const claim of unverifiedClaims) {
        markdown += `- **${claim.title}** — ${claim.verificationNotes || 'پشتڕاست نەکراوە.'}\n`;
      }
    }

    return {
      verifiedCount: verifiedSources.length,
      partiallyVerifiedCount: partiallyVerifiedSources.length,
      unverifiedCount: unverifiedClaims.length,
      verifiedSources,
      partiallyVerifiedSources,
      unverifiedClaims,
      formattedSummaryMarkdown: markdown
    };
  }
}
