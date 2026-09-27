import { Injectable, inject } from '@angular/core';
import { AuthenticatedApiService } from '../../../core/services/authenticated-api.service';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly api = inject(AuthenticatedApiService);

  buildMasterAcademicPrompt(
    userQuery: string,
    contextData: string,
    discipline: string,
    academicLevel: string
  ): string {
    return `
تۆ پڕۆفیسۆر، بیرمەندێکی ڕەخنەگر و توێژەرێکی خاوەن شێوازی تایبەت و ئۆرگانیکیت لە کایەی ئەدەب، مێژوو، زانستە مرۆڤایەتییەکان و ڕوانگەی ئەکادیمیدا. 

ڕشتەی زانستی: ${discipline}
ئاستی ئەکادیمی: ${academicLevel}
پرسیاری توێژینەوە / تێمای نووسین: ${userQuery}

سەرچاوە خاوەکان لە داتابەیسەوە:
${context_data_sanitized(contextData)}

⚠️ یاسا ڕەهاکان بۆ ڕێگری لە نیشانەکانی AI و مسۆگەرکردنی نووسینی مرۆیی:
١. نەهێشتنی نیشانە میکانیکییەکان: ڕاستەوخۆ بچۆ ناو قووڵایی بابەتەکە و خۆت بەدوور بگرە لە کڵێشەی دووبارە.
٢. ڕیتمی ئۆرگانیکی زمانی سۆرانی پێوەر: ڕستەی کورت و درێژ تێکەڵ بکە و دەقێکی ڕەوان بئافرێنە.
٣. بەکارھێنانی سەرچاوەکان بە شێوازی سروشتی و بەڵگەدار.

وەڵامی ئەکادیمی، قووڵ و بێ دووبارەبوونەوە:
`.trim();
  }

  async simulateViva(payload: { title: string; content: string; discipline: string; academicLevel: string; questions?: unknown[]; userDefense?: string }) {
    return this.api.post('/api/simulate_viva', payload);
  }

  async checkPlagiarism(payload: { content: string; title?: string }) {
    return this.api.post('/api/plagiarism_check', payload);
  }

  async runEliteAcademicAssessment(payload: { content: string; title: string; discipline: string; academicLevel: string }) {
    return this.api.post('/api/elite_academic_assessment', payload);
  }

  async runHarvardAcademicReview(payload: { title: string; content: string; discipline: string }) {
    return this.api.post('/api/harvard_academic_review', payload);
  }
}

function context_data_sanitized(raw: string): string {
  if (!raw || !raw.trim()) {
    return 'هیچ سەرچاوەیەکی داتابەیس لەم کاتەدا نەدۆزرایەوە.';
  }
  return raw;
}
