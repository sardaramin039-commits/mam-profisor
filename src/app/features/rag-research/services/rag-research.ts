import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RetrievedChunkModel } from '../../../domain/models';

export interface DeepResearchResult {
  topic: string;
  executiveSummary: string;
  keyFindings: string[];
  theoreticalFramework: string;
  methodologicalInsights: string;
  academicSources: {
    title: string;
    authors: string;
    year: string;
    journal: string;
    relevance: string;
  }[];
  kurdishAcademicSynthesis: string;
  futureAvenues: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RagResearchService {
  private http = inject(HttpClient);

  readonly retrievedChunks = signal<RetrievedChunkModel[]>([]);
  readonly selectedModel = signal<string>('gemini-3.8-flash');
  readonly chunkLimit = signal<number>(5);

  readonly isResearching = signal<boolean>(false);
  readonly researchAgentResult = signal<DeepResearchResult | null>(null);
  readonly researchError = signal<string | null>(null);
  readonly isIndexingDocument = signal<boolean>(false);
  readonly indexStatus = signal<string | null>(null);

  toggleChunkInChapter(chunkId: string) {
    this.retrievedChunks.update(list => 
      list.map(c => c.id === chunkId ? { ...c, isUsedInChapter: !c.isUsedInChapter } : c)
    );
  }

  getSelectedChunksContent(): string {
    return this.retrievedChunks()
      .filter(c => c.isUsedInChapter)
      .map(c => `📖 کتێبی: ${c.bookTitle} (${c.bookAuthor})\n${c.content}`)
      .join('\n\n---\n\n');
  }

  indexDocument(document: {
    title: string;
    content: string;
    author?: string;
    year?: number;
  }) {
    if (!document.title?.trim() || !document.content?.trim()) return;

    this.isIndexingDocument.set(true);
    this.indexStatus.set(null);

    this.http.post<{
      id: string;
      retrievalStatus: string;
      verificationStatus: 'unverified';
      embeddingDimensions: number;
    }>('/api/rag/index-document', {
      ...document,
      title: document.title.trim(),
      content: document.content.trim()
    }).subscribe({
      next: (result) => {
        this.indexStatus.set(
          result.retrievalStatus === 'persisted-vector'
            ? 'بەڵگەنامەکە بە سەرکەوتوویی لە pgvector ئیندێکس کرا.'
            : 'بەڵگەنامەکە لە cache ـی کاتیی ئیندێکس کرا؛ verification ـی سەرچاوە هێشتا نەکراوە.'
        );
        this.isIndexingDocument.set(false);
      },
      error: (err) => {
        console.error('RAG Index Document Error:', err);
        this.indexStatus.set('ئینگێستکردنی بەڵگەنامەکە سەرکەوتوو نەبوو.');
        this.isIndexingDocument.set(false);
      }
    });
  }

  retrieveForClaim(query: string, documentId?: string, limit = 5) {
    if (!query?.trim()) return;

    this.http.post<{
      query: string;
      candidates: Array<{
        chunkId: string;
        documentId: string;
        sourceId: string;
        sourceTitle: string;
        text: string;
        verificationStatus: 'verified' | 'unverified';
        score: number;
        provenance?: { author?: string; year?: string };
        retrievalStatus: string;
      }>;
      metrics: {
        lexicalMatchCount: number;
        semanticMatchCount: number;
        fusedCandidatesCount: number;
        rerankedCount: number;
      };
      retrievalStatus: string;
      verificationPolicy: string;
    }>('/api/rag/hybrid-retrieve', {
      query: query.trim(),
      documentId,
      limit
    }).subscribe({
      next: (result) => {
        this.retrievedChunks.set((result.candidates || []).map(candidate => ({
          id: candidate.chunkId,
          bookTitle: candidate.sourceTitle,
          bookAuthor: candidate.provenance?.author,
          author: candidate.provenance?.author,
          year: candidate.provenance?.year ? Number(candidate.provenance.year) : undefined,
          content: candidate.text,
          relevanceScore: candidate.score,
          text: candidate.text,
          sourceTitle: candidate.sourceTitle,
          isUsedInChapter: false,
          isVerified: candidate.verificationStatus === 'verified'
        })));
      },
      error: (err) => {
        console.error('RAG Retrieval Error:', err);
        this.retrievedChunks.set([]);
      }
    });
  }

  runDeepResearchAgent(topic: string, discipline = 'زانستە ئەکادیمییەکان', documentTitle = '') {
    if (!topic || !topic.trim()) return;

    this.isResearching.set(true);
    this.researchError.set(null);

    this.http.post<DeepResearchResult>('/api/deep_research_agent', {
      topic: topic.trim(),
      discipline,
      documentTitle
    }).subscribe({
      next: (res) => {
        this.researchAgentResult.set(res);
        this.isResearching.set(false);
      },
      error: (err) => {
        console.error('Deep Research Agent Error:', err);
        this.researchError.set('داواکارییەکە تووشی هەڵە بوو. تکایە دووبارە هەوڵ بدەرەوە.');
        this.isResearching.set(false);
      }
    });
  }
}

