import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
  private readonly http = inject(HttpClient);

  async checkPlagiarism(content: string, title?: string): Promise<PlagiarismResult> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('دەقی پشکنین پێویستە.');
    }

    return firstValueFrom(
      this.http.post<PlagiarismResult>(
        '/api/plagiarism_check',
        {
          content: trimmed.slice(0, 250_000),
          title: title?.trim().slice(0, 500)
        }
      )
    );
  }
}
