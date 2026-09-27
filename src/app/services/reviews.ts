import { Injectable } from '@angular/core';

export interface ReviewResponse {
  score: number;
  critique: string;
  recommendations: string[];
}

export interface LiteratureGapResult {
  identifiedGaps: string[];
  suggestedResearchDirections: string[];
  noveltyScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  async runHarvardReview(title: string, content: string, discipline: string): Promise<ReviewResponse> {
    const res = await fetch('/api/harvard_academic_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, discipline })
    });
    if (!res.ok) throw new Error('تێکچوونی پێوەندی لەگەڵ سێرڤەری هەڵسەنگاندنی هارفەرد.');
    return res.json();
  }

  async runEliteAssessment(title: string, content: string, discipline: string, academicLevel: string): Promise<ReviewResponse> {
    const res = await fetch('/api/elite_academic_assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, discipline, academicLevel })
    });
    if (!res.ok) throw new Error('تێکچوونی پێوەندی لەگەڵ سێرڤەری هەڵسەنگاندنی نوخبەی ئەکادیمی.');
    return res.json();
  }

  async analyzeLiteratureGap(title: string, content: string, referencesText: string): Promise<LiteratureGapResult> {
    const res = await fetch('/api/literature_gap_analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, referencesText })
    });
    if (!res.ok) throw new Error('تێکچوونی پێوەندی بۆ شیکاریی بۆشایی ئەدەبیاتی توێژینەوە.');
    return res.json();
  }
}
