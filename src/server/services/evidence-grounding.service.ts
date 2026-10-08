        : [];
      const verifiedCitations = rawVerifiedCitations.filter((citation: any) => {
        if (citation?.verified !== true) return false;

        const chunks = eligibleBySourceId.get(String(citation?.sourceId || '')) || [];
        const matchedChunk = chunks.find(chunk =>
          hasGroundedEvidence(citation?.sourceId, citation?.evidenceQuote)
        );
        if (!matchedChunk) return false;

        return (
          citationTextMatchesSource(citation?.inTextCitation, matchedChunk) &&
          hasGroundedEvidence(citation?.sourceId, citation?.evidenceQuote)
        );
      }).map((citation: any) => ({
        citationId: String(citation.citationId || ''),
        sourceId: String(citation.sourceId || ''),