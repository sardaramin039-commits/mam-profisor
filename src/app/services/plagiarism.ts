import { Injectable } from '@angular/core';

export interface PlagiarismResult {
  originalityScore: number;
  plagiarismRisk: 'نزم' | 'مامناوەند' | 'بەرز';
  matchesCount: number;
  detailedAnalysis: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlagiarismService {
  async checkPlagiarism(content: string, title?: string): Promise<PlagiarismResult> {
    const response = await fetch('/api/plagiarism_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title })
    });

    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ سێرڤەر نییە بۆ پشکنینی ڕەسەنایەتی.');
    }

    return response.json();
  }
}
