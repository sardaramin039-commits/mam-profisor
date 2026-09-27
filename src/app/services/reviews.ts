import { Injectable, inject } from '@angular/core';
import { AuthenticatedApiService } from '../core/services/authenticated-api.service';

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
  private readonly api = inject(AuthenticatedApiService);

  runHarvardReview(title: string, content: string, discipline: string): Promise<ReviewResponse> {
    return this.api.post<ReviewResponse>('/api/harvard_academic_review', {
      title,
      content,
      discipline
    });
  }

  runEliteAssessment(title: string, content: string, discipline: string, academicLevel: string): Promise<ReviewResponse> {
    return this.api.post<ReviewResponse>('/api/elite_academic_assessment', {
      title,
      content,
      discipline,
      academicLevel
    });
  }

  analyzeLiteratureGap(title: string, content: string, referencesText: string): Promise<LiteratureGapResult> {
    return this.api.post<LiteratureGapResult>('/api/literature_gap_analysis', {
      title,
      content,
      referencesText
    });
  }
}
