import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = {
  authStateReady: vi.fn(),
  getIdToken: vi.fn()
};

const authProvider = {
  authStateReady: mocks.authStateReady,
  currentUser: null as { getIdToken: () => Promise<string> } | null
};

import {
  ACADEMIC_PIPELINE_AUTH,
  AcademicPipelineClientService
} from './academic-pipeline-client.service';

let service: AcademicPipelineClientService;

function streamResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    }
  });
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  mocks.getIdToken.mockResolvedValue('verified-test-id-token');
  authProvider.currentUser = { getIdToken: mocks.getIdToken };
  mocks.authStateReady.mockResolvedValue(undefined);
  TestBed.configureTestingModule({
    providers: [
      AcademicPipelineClientService,
      { provide: ACADEMIC_PIPELINE_AUTH, useValue: authProvider }
    ]
  });
  service = TestBed.inject(AcademicPipelineClientService);
});

afterEach(() => {
  TestBed.resetTestingModule();
  vi.unstubAllGlobals();
});

describe('AcademicPipelineClientService', () => {
  it('authenticates and parses SSE messages even when an event is split across network chunks', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(streamResponse([
      'data: {"stage":"blueprint","progressPercent":10,"message":"Outline ready","partialMark',
      'down":"## Research title"}\n\n',
      'data: {"stage":"completed","progressPercent":100,"message":"Completed","partialMarkdown":"## Conclusion"}\n\n'
    ]));
    const events: string[] = [];

    const result = await service.generate(
      { title: 'Research title', level: 'phd' },
      event => events.push(event.stage)
    );

    expect(result).toBe('## Research title\n\n## Conclusion');
    expect(events).toEqual(['blueprint', 'completed']);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer verified-test-id-token',
      'Content-Type': 'application/json'
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      title: 'Research title',
      level: 'phd',
      discipline: 'گشتی'
    });
  });

  it('does not call the protected endpoint when no Firebase user is signed in', async () => {
    authProvider.currentUser = null;
    const fetchMock = vi.mocked(fetch);

    await expect(service.generate(
      { title: 'Research title', level: 'master' },
      () => undefined
    )).rejects.toThrow('تکایە سەرەتا بچۆ ژوورەوە');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not surface arbitrary response bodies from an authorization failure', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(
      '{"error":"INTERNAL_PROVIDER_SECRET"}',
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    ));

    await expect(service.generate(
      { title: 'Research title', level: 'master' },
      () => undefined
    )).rejects.toThrow('دەسەڵاتی بەکارهێنان پشتڕاست نەکرایەوە');
  });

  it('surfaces a sanitized pipeline error event without treating the stream as complete', async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse([
      'data: {"stage":"error","progressPercent":0,"message":"Generation failed safely"}\n\n'
    ]));

    await expect(service.generate(
      { title: 'Research title', level: 'phd' },
      () => undefined
    )).rejects.toThrow('Generation failed safely');
  });
});
