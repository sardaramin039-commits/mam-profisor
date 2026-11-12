import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface EmbeddingResponse {
  embedding?: number[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Embedding {
  private readonly http = inject(HttpClient);

  async generateEmbedding(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) return [];

    try {
      const data = await firstValueFrom(
        this.http.post<EmbeddingResponse>(
          '/api/generate_embedding',
          { text: trimmed.slice(0, 50_000) }
        )
      );

      if (data.error) throw new Error(data.error);
      return Array.isArray(data.embedding) ? data.embedding : [];
    } catch (error) {
      console.error('هەڵە لە دروستکردنی ڤێکتەر:', error);
      throw error;
    }
  }
}
