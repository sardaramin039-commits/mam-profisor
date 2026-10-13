import { afterEach, describe, expect, it } from 'vitest';
import { enrichSourcesWithFullText } from './full-text-evidence.service';
import { isServerVerifiedFullText } from './evidence-verification-policy';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('full-text evidence enrichment', () => {
  it('retrieves only open-access Europe PMC full text and preserves source metadata', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));

      if (url.includes('/search?query=EXT_ID:12345')) {
        return new Response(JSON.stringify({
          resultList: {
            result: [{
              pmcid: 'PMC123456',
              pmid: '12345',
              title: 'Peer Tutoring Study',
              doi: '10.1000/example',
              firstPublicationDate: '2025-02-01',
              isOpenAccess: 'Y'
            }]
          }
        }), { status: 200 });
      }

      if (url.includes('/PMC123456/fullTextXML')) {
        return new Response(
          '<article><body><p>Peer tutoring improves academic achievement among students in secondary classrooms.</p></body></article>',
          { status: 200 }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'pubmed-12345',
      title: 'Peer Tutoring Study',
      authors: ['Researcher'],
      year: '2025',
      sourceType: 'PubMed',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
      pmid: '12345',
      doi: '10.1000/example',
      evidenceText: 'abstract evidence',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['peer tutoring improves academic achievement among students']
    );

    expect(enriched.id).toBe(source.id);
    expect(enriched.doi).toBe(source.doi);
    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(isServerVerifiedFullText(enriched)).toBe(true);
    expect(enriched.claimText).toBe(
      'peer tutoring improves academic achievement among students'
    );
    expect(enriched.evidenceText).toContain('Peer tutoring improves academic achievement');
    expect(enriched.evidenceUrl).toContain('/PMC123456/fullTextXML');
  });


  it('enriches an OpenAlex open-access landing page when full text is available', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/works/W123456789')) {
        return new Response(JSON.stringify({
          title: 'Open access study',
          doi: null,
          publication_year: 2024,
          best_oa_location: {
            is_oa: true,
            landing_page_url: 'https://publisher.example.org/articles/oa-study'
          }
        }), { status: 200 });
      }

      if (url.includes('publisher.example.org/articles/oa-study')) {
        return new Response(
          `<html><head><title>Open access study</title></head><body><article>
<p>Introduction. School belonging is associated with stronger student engagement in secondary education. This relationship is discussed across educational psychology and classroom research, with attention to motivation, participation, and persistence.</p>
<p>Method. The study examines student experiences using a structured academic design and compares patterns across relevant classroom contexts. The analysis considers engagement, perceived support, and the conditions that shape participation in school activities.</p>
<p>Results. The findings indicate meaningful variation in engagement and show how supportive learning environments can strengthen students' participation. The evidence is interpreted alongside prior research and clearly distinguishes observed findings from broader theoretical claims.</p>
<p>Discussion. The results are consistent with research on belonging, motivation, and social support in education. The authors discuss implications for teachers, school leaders, and researchers and identify limitations that should guide future work.</p>
<p>References. The article concludes with a scholarly reference list and identifies the literature used to frame the research question, methodology, results, and discussion.</p>
<p>Implications. The evidence has practical implications for classroom practice and future educational research, while the authors distinguish these implications from direct causal conclusions.</p>
<p>Limitations. The study notes limitations in sampling, measurement, and context and recommends replication with broader populations and additional sources of evidence.</p>
<p>Practical significance. The article also explains how the findings may inform school improvement, student support, teacher development, and future empirical studies, while emphasizing that practical recommendations should remain proportional to the strength and scope of the observed evidence.</p>
</article></body></html>`,
          {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' }
          }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'openalex-W123456789',
      title: 'Open access study',
      sourceType: 'OpenAlex',
      openAlexId: 'https://openalex.org/W123456789',
      url: 'https://openalex.org/W123456789',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['school belonging is associated with stronger student engagement']
    );

    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(enriched.claimText).toBe(
      'school belonging is associated with stronger student engagement'
    );
    expect(enriched.evidenceText).toContain('School belonging is associated with stronger student engagement');
    expect(enriched.evidenceUrl).toBe('https://publisher.example.org/articles/oa-study');
  });

  it('enriches a DOAJ article page only when the returned page contains the claim', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('doaj.example.org/article/42')) {
        return new Response(
          '<article><h1>Teacher Feedback Study</h1><p>Introduction. Teacher feedback can improve revision quality when students receive actionable guidance. The study considers how specific comments support revision and learning.</p><p>Method. Researchers compare revision tasks and examine how students respond to feedback that identifies concrete next steps. The design records changes in draft quality across multiple classroom activities.</p><p>Results. Students receiving actionable feedback show clearer revisions in the observed tasks. The evidence is discussed with reference to writing development, classroom assessment, and teacher practice.</p><p>Discussion. The findings support careful use of feedback that is specific, understandable, and connected to revision goals. The authors also discuss limitations and implications for teaching.</p><p>References. Prior studies on formative assessment and academic writing are reviewed to position the findings within the literature.</p><p>Implications. The results suggest that teachers can strengthen revision quality by giving students feedback that is specific, actionable, and connected to clearly stated learning goals.</p><p>Limitations. The authors identify limits related to the classroom context, sample size, and measurement approach and recommend further studies across different educational settings.</p><p>Conclusion. The study concludes that effective feedback works best when learners can understand the comment and use it to make a concrete revision.</p><p>Future research. Further work should examine how feedback quality interacts with student experience, assignment type, and teacher training across multiple classrooms and institutions.</p></article>',
          {
            status: 200,
            headers: { 'content-type': 'text/html' }
          }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'doaj-42',
      title: 'Teacher feedback study',
      sourceType: 'DOAJ',
      url: 'https://doaj.example.org/article/42',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['teacher feedback can improve revision quality'],
      { allowDiscoveredProviderUrls: true }
    );

    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(enriched.evidenceUrl).toBe(source.url);
  });

  it('leaves a source unchanged when Europe PMC does not mark it as open access', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));

      if (url.includes('/search?query=EXT_ID:98765')) {
        return new Response(JSON.stringify({
          resultList: {
            result: [{
              pmcid: 'PMC987654',
              isOpenAccess: 'N'
            }]
          }
        }), { status: 200 });
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'pubmed-98765',
      title: 'Restricted Study',
      pmid: '98765',
      evidenceText: 'abstract evidence',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['restricted claim']
    );

    expect(enriched).toEqual(source);
  });
});


describe('HTML full-text validation', () => {
  it('rejects a short abstract-like HTML landing page', async () => {
    globalThis.fetch = (async () => new Response(
      '<html><main><p>School belonging improves engagement among students.</p></main></html>',
      { status: 200, headers: { 'content-type': 'text/html' } }
    )) as typeof fetch;

    const [enriched] = await enrichSourcesWithFullText(
      [{
        id: 'openalex-short',
        title: 'Abstract-like page',
        sourceType: 'DOAJ',
        url: 'https://example.org/abstract'
      }],
      ['school belonging improves engagement'],
      { allowDiscoveredProviderUrls: true }
    );

    expect(enriched.evidenceType).toBeUndefined();
    expect(enriched.evidenceProvenance).toBeUndefined();
  });
});
