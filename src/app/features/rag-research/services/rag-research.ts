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
