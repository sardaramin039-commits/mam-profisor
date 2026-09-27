import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfProcessorService {
  splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 150): string[] {
    if (!text) return [];
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  }
}
