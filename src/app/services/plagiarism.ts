import { Injectable, inject } from '@angular/core';
import { AuthenticatedApiService } from '../core/services/authenticated-api.service';

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
  private readonly api = inject(AuthenticatedApiService);

  checkPlagiarism(content: string, title?: string): Promise<PlagiarismResult> {
    return this.api.post<PlagiarismResult>('/api/plagiarism_check', {
      content,
      title
    });
  }
}
