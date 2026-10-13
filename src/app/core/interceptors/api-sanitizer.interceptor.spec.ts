import { HttpRequest, HttpResponse } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { apiSanitizerInterceptor } from './api-sanitizer.interceptor';

describe('apiSanitizerInterceptor', () => {
  it('preserves academic source text and does not forge trust headers', async () => {
    const body = {
      sourceText: 'Example code: <script>const x = 1;</script> and javascript: URLs are discussed here.',
      citation: '(Researcher, 2024)'
    };
    const request = new HttpRequest('POST', '/api/rag/index-document', body);
    const next = vi.fn(() => of(new HttpResponse({ status: 200 })));

    await new Promise<void>((resolve, reject) => {
      apiSanitizerInterceptor(request, next).subscribe({
        complete: resolve,
        error: reject
      });
    });

    const forwarded = next.mock.calls[0]?.[0];
    expect(forwarded?.body).toEqual(body);
    expect(forwarded?.headers.has('X-Kurdish-Library-Sanitized')).toBe(false);
    expect(forwarded?.headers.has('X-RAG-Pipeline-Access')).toBe(false);
  });
});
