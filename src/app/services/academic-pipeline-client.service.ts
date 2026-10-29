import { Injectable } from '@angular/core';
import { auth } from '../firebase';

export type AcademicPipelineLevel = 'school' | 'bachelor' | 'master' | 'phd' | 'professor';
export type AcademicPipelineStage =
  | 'grounding'
  | 'blueprint'
  | 'writing_subsection'
  | 'critic_refining'
  | 'conclusion'
  | 'completed'
  | 'error';

export interface AcademicPipelineEvent {
  stage: AcademicPipelineStage;
  progressPercent: number;
  message: string;
  sectionCode?: string;
  partialMarkdown?: string;
}

export interface AcademicPipelineRequest {
  title: string;
  level: AcademicPipelineLevel;
}

/**
 * Browser client for the protected Express SSE endpoint.
 * Firebase credentials are obtained at request time and are never persisted by this service.
 */
@Injectable({ providedIn: 'root' })
export class AcademicPipelineClientService {
  public async generate(
    request: AcademicPipelineRequest,
    onEvent: (event: AcademicPipelineEvent) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const title = typeof request.title === 'string' ? request.title.trim() : '';
    if (title.length < 2 || title.length > 500) {
      throw new Error('ناونیشانی توێژینەوە دەبێت لە نێوان ٢ و ٥٠٠ پیت بێت.');
    }

    await auth.authStateReady();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('بۆ بەکارهێنانی زنجیرەی نووسین، تکایە سەرەتا بچۆ ژوورەوە.');
    }

    const token = await currentUser.getIdToken();
    if (!token) {
      throw new Error('ناسنامەی بەکارهێنەر پشتڕاست نەکرایەوە؛ تکایە دووبارە بچۆ ژوورەوە.');
    }

    const response = await fetch('/api/academic-pipeline/stream', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ title, level: request.level }),
      signal
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('دەسەڵاتی بەکارهێنان پشتڕاست نەکرایەوە؛ تکایە دۆخی چوونەژوورەوەت بپشکنە.');
    }
    if (response.status === 429) {
      throw new Error('ژمارەی داواکارییەکان زۆر بوو؛ دوای ماوەیەک دووبارە هەوڵ بدە.');
    }
    if (!response.ok) {
      throw new Error('سێرڤەر نەتوانی زنجیرەی نووسین دەست پێ بکات (HTTP ' + response.status + ').');
    }
    if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
      throw new Error('وەڵامی سێرڤەر شێوازی دروستی streaming ـی نییە.');
    }
    if (!response.body) {
      throw new Error('پەیوەندیی streaming لە سێرڤەرەوە بەردەست نییە.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assembledMarkdown = '';
    let completed = false;

    const consumeBlock = (block: string): void => {
      const data = block
        .split(/\r?\n/u)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).replace(/^ /u, ''))
        .join('\n');
      if (!data.trim()) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        throw new Error('پەیامی streaming ـی سێرڤەر لە شێوەی دروستدا نەبوو.');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('پێکهاتەی پەیامی streaming نادروستە.');
      }

      const record = parsed as Record<string, unknown>;
      const stage = record['stage'];
      const message = record['message'];
      const progress = record['progressPercent'];
      const validStages: AcademicPipelineStage[] = [
        'grounding', 'blueprint', 'writing_subsection', 'critic_refining',
        'conclusion', 'completed', 'error'
      ];
      if (
        typeof stage !== 'string' ||
        !validStages.includes(stage as AcademicPipelineStage) ||
        typeof message !== 'string' ||
        typeof progress !== 'number' ||
        !Number.isFinite(progress)
      ) {
        throw new Error('پێکهاتەی پەیامی streaming تەواو نییە.');
      }

      const event: AcademicPipelineEvent = {
        stage: stage as AcademicPipelineStage,
        message,
        progressPercent: Math.max(0, Math.min(100, progress)),
        ...(typeof record['sectionCode'] === 'string' ? { sectionCode: record['sectionCode'] } : {}),
        ...(typeof record['partialMarkdown'] === 'string' ? { partialMarkdown: record['partialMarkdown'] } : {})
      };
      onEvent(event);

      if (event.stage === 'error') {
        throw new Error(event.message || 'زنجیرەی نووسین تەواو نەبوو.');
      }
      if (event.partialMarkdown?.trim()) {
        assembledMarkdown = assembledMarkdown
          ? assembledMarkdown + '\n\n' + event.partialMarkdown
          : event.partialMarkdown;
      }
      if (event.stage === 'completed') completed = true;
    };

    try {
      while (true) {
        const result = await reader.read();
        buffer += decoder.decode(result.value, { stream: !result.done });
        const blocks = buffer.split(/\r?\n\r?\n/u);
        buffer = blocks.pop() ?? '';
        for (const block of blocks) consumeBlock(block);
        if (result.done) {
          if (buffer.trim()) consumeBlock(buffer);
          break;
        }
      }
    } catch (error: unknown) {
      try {
        await reader.cancel();
      } catch {
        // The stream may already be closed or aborted.
      }
      throw error;
    } finally {
      reader.releaseLock();
    }

    if (!completed || !assembledMarkdown.trim()) {
      throw new Error('زنجیرەی نووسین بە بێ ئەنجامی تەواو کۆتایی هات؛ دەقی پێشوو بپارێزە.');
    }
    return assembledMarkdown.trim();
  }
}
