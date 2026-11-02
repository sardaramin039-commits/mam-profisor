import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SseStreamOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  onChunk?: (chunkText: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiSseStreamService {
  private http = inject(HttpClient);

  isStreaming = signal<boolean>(false);
  streamedText = signal<string>('');

  /**
   * Pillar 14: Server-Sent Events (SSE) Streaming between Express backend and Angular frontend
   */
  public async streamAcademicGeneration(options: SseStreamOptions): Promise<string> {
    this.isStreaming.set(true);
    this.streamedText.set('');
    let accumulated = '';

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: options.prompt,
          systemInstruction: options.systemInstruction || '',
          model: options.model || 'gemini-3.8-flash'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.text) {
              accumulated += parsed.text;
              this.streamedText.set(accumulated);
              options.onChunk?.(parsed.text);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Ignore non-JSON control signals
          }
        }
      }

      options.onComplete?.(accumulated);
      return accumulated;
    } catch (err: any) {
      console.error('[GeminiSseStreamService] Streaming error:', err);
      options.onError?.(err);
      throw err;
    } finally {
      this.isStreaming.set(false);
    }
  }

  /**
   * Pillar 20: Multimodal Audio Dictation via backend Gemini inlineData
   */
  public transcribeAudio(audioBase64: string, mimeType = 'audio/webm;codecs=opus', academicContext = ''): Observable<{ success: boolean; transcript: string }> {
    return this.http.post<{ success: boolean; transcript: string }>('/api/gemini/audio-dictation', {
      audioBase64,
      mimeType,
      academicContext
    });
  }

  /**
   * Pillar 20: Multimodal Audio Viva Defense evaluation via backend Gemini inlineData
   */
  public evaluateVivaSpokenAnswer(params: {
    audioBase64: string;
    mimeType?: string;
    questionText: string;
    examinerRole?: string;
    scoringCriteria?: string[];
  }): Observable<{
    success: boolean;
    evaluation: {
      transcript: string;
      grade: number;
      decisionStatus: string;
      critique: string;
      recommendations: string[];
    };
  }> {
    return this.http.post<any>('/api/gemini/audio-viva', params);
  }
}
