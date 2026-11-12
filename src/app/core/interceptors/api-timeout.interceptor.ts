import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

/**
 * Timeout configuration in milliseconds for different endpoint categories
 */
const AI_TIMEOUT_MS = 120000; // 120 seconds (2 mins) for heavy Gemini / Multi-agent / Thesis rewriting tasks
const STANDARD_TIMEOUT_MS = 45000; // 45 seconds for standard API requests

/**
 * Angular HttpInterceptorFn for managing API request timeouts with Kurdish academic feedback
 */
export const apiTimeoutInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Only apply to backend API requests
  if (req.url.includes('/api/')) {
    // Heavy AI endpoints get extended timeout duration
    const isHeavyAi = req.url.includes('refine') ||
                      req.url.includes('generate') ||
                      req.url.includes('review') ||
                      req.url.includes('multi_agent') ||
                      req.url.includes('deep_research') ||
                      req.url.includes('ai_thesis') ||
                      req.url.includes('ai_book_writer') ||
                      req.url.includes('academic_paraphrase') ||
                      req.url.includes('ai_peer_review') ||
                      req.url.includes('ai-tools') ||
                      req.url.includes('evaluat') ||
                      req.url.includes('plagiarism') ||
                      req.url.includes('gap') ||
                      req.url.includes('rag') ||
                      req.url.includes('chat');

    const timeoutDuration = isHeavyAi ? AI_TIMEOUT_MS : STANDARD_TIMEOUT_MS;

    return next(req).pipe(
      timeout({
        each: timeoutDuration,
        with: () => throwError(() => new TimeoutError())
      }),
      catchError((error) => {
        if (error instanceof TimeoutError || error.name === 'TimeoutError') {
          const customError = new HttpErrorResponse({
            error: {
              success: false,
              message: 'داواکارییە ئەکادیمییەکە کاتی زیاتری خایاند بەهۆی قەبارەی زۆر گەورەی دەقەکە یان خاوی هێڵی ئینتەرنێت. کەرنەڵی ئەپەکە دەقەکان بەش بەش پرۆسەس دەکات، تکایە ڕاستەوخۆ دووبارە کلیک بکەرەوە.',
              isTimeout: true
            },
            status: 408,
            statusText: 'Request Timeout'
          });
          return throwError(() => customError);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
