import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ReviewCriterion {
  id: string;
  name: string;
  nameEn?: string;
  weight?: number;
  score: number;
  feedback: string;
}

interface ReviewerCriterion {
  category: string;
  score: number;
  findingKurdish: string;
  recommendationKurdish: string;
}

interface ReviewerReport {
  overallScore: number;
  criteria?: ReviewerCriterion[];
  summaryCritiqueKurdish: string;
}

export interface ReviewResponse {
  score: number;
  critique: string;
  recommendations: string[];
  criteria?: ReviewCriterion[];
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
  private readonly http = inject(HttpClient);

  async runHarvardReview(title: string, content: string, discipline: string): Promise<ReviewResponse> {
    return this.runAcademicReview(title, content, discipline);
  }

  async runEliteAssessment(
    title: string,
    content: string,
    discipline: string,
    _academicLevel: string
  ): Promise<ReviewResponse> {
    return this.runAcademicReview(title, content, discipline);
  }

  async runAcademicReview(
    title: string,
    content: string,
    _discipline: string
  ): Promise<ReviewResponse> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; report: ReviewerReport }>(
        '/api/platform/academic-review',
        { topic: title, draftText: content, discipline: _discipline }
      )
    );

    const report = response.report;
    const criteria = Array.isArray(report?.criteria)
      ? report.criteria.map((criterion, index) => ({
          id: `${criterion.category}-${index}`,
          name: criterion.category,
          score: Math.round(Math.max(0, Math.min(10, criterion.score)) * 10),
          feedback: criterion.findingKurdish || criterion.recommendationKurdish || 'پێویستی بە پشکنینی زیاتر هەیە.'
        }))
      : [];

    return {
      score: Math.round(Math.max(0, Math.min(10, report?.overallScore ?? 0)) * 10),
      critique: report?.summaryCritiqueKurdish || 'هیچ شیکارییەکی بەردەست نییە.',
      recommendations: criteria
        .map(criterion => criterion.feedback)
        .filter(Boolean)
        .slice(0, 12),
      criteria
    };
  }

  async analyzeLiteratureGap(
    title: string,
    content: string,
    referencesText: string
  ): Promise<LiteratureGapResult> {
    const response = await firstValueFrom(
      this.http.post<LiteratureGapResult>(
        '/api/analyze_literature_gap',
        { topic: title, discipline: content, existingLiterature: referencesText }
      )
    );
    return response;
  }
}
