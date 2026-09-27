import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Embedding {
  /**
   * Generates a vector embedding for the given text by invoking the secure server API endpoint.
   * This preserves client-side security guidelines.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/rag/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'سەرکەوتوو نەبوو لە دروستکردنی ڤێکتەر');
      }
      
      const data = await response.json();
      return data.embedding || [];
    } catch (error) {
      console.error('هەڵە لە دروستکردنی ڤێکتەر: ', error);
      throw error;
    }
  }
}
