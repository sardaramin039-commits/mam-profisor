import { Injectable, signal } from '@angular/core';

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
  isParaphrasing = signal<boolean>(false);
  paraphraseResult = signal<AcademicParaphraseResponse | null>(null);
  paraphraseError = signal<string | null>(null);

  async runParaphrase(text: string, discipline: string, toneLevel: string): Promise<AcademicParaphraseResponse | null> {
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
      const response = await fetch('/api/academic_paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          discipline,
          toneLevel
        })
      });

      if (!response.ok) {
        throw new Error('کێشەیەک لە پێوەندی کردن بە سێرڤەری پارافراز ڕوویدا.');
      }

      const data = await response.json();
      if (data && !data.error) {
        this.paraphraseResult.set(data);
        return data;
      } else {
        throw new Error(data.error || 'داتای نەخوازراو وەرگیرا.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.paraphraseError.set(msg);
      return null;
    } finally {
      this.isParaphrasing.set(false);
    }
  }
}
