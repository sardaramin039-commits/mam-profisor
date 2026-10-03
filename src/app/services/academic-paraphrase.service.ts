import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AcademicParaphraseResponse {
  paraphrasedText?: string;
  originalText?: string;
  discipline?: string;
  toneLevel?: string;
  changesSummary?: string[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicParaphraseService {
  private readonly http = inject(HttpClient);

  isParaphrasing = signal<boolean>(false);
  paraphraseResult = signal<AcademicParaphraseResponse | null>(null);
  paraphraseError = signal<string | null>(null);

  async runParaphrase(
    text: string,
    discipline: string,
    toneLevel: string
  ): Promise<AcademicParaphraseResponse | null> {
    const trimmed = text.trim();
    if (!trimmed) {
      this.paraphraseError.set('تکایە سەرەتا چەند خاڵێک یان پەرەگرافێکی دیاریکراو بنووسە بۆ داڕشتنەوە.');
      return null;
    }

    if (this.isParaphrasing()) return null;
    this.isParaphrasing.set(true);
    this.paraphraseResult.set(null);
    this.paraphraseError.set(null);

    try {
      const data = await firstValueFrom(
        this.http.post<AcademicParaphraseResponse>(
          '/api/academic_paraphrase',
          { text: trimmed, discipline, toneLevel }
        )
      );

      if (data && !data.error) {
        this.paraphraseResult.set(data);
        return data;
      }

      throw new Error(data?.error || 'داتای نەخوازراو وەرگیرا.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.paraphraseError.set(msg);
      return null;
    } finally {
      this.isParaphrasing.set(false);
    }
  }
}
