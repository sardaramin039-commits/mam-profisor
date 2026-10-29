import type { GoogleGenAI } from '@google/genai';
import { GeminiCoreEngine } from './core-engine';

export interface UploadedAcademicFile {
  uri: string;
  mimeType: 'application/pdf' | 'text/plain';
  displayName: string;
}

export interface ThesisMasterCacheRequest {
  thesisTitle: string;
  systemInstruction: string;
  outlineSummaryJson: string;
  uploadedFiles: UploadedAcademicFile[];
  ttlHours?: number;
}

/**
 * Server-only file upload and explicit context-cache manager.
 * Keep this module out of Angular browser imports; source documents may be private.
 */
export class AcademicKnowledgeVault {
  constructor(private readonly engine: GeminiCoreEngine = new GeminiCoreEngine()) {}

  public async uploadSourceDocument(
    fileBuffer: Buffer,
    mimeType: 'application/pdf' | 'text/plain',
    displayName: string
  ): Promise<UploadedAcademicFile> {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new Error('The academic source file is empty or is not a Node.js Buffer.');
    }
    if (mimeType !== 'application/pdf' && mimeType !== 'text/plain') {
      throw new Error('Unsupported academic source MIME type.');
    }

    const safeName = displayName.trim().slice(0, 128);
    if (!safeName) throw new Error('A display name is required for the academic source file.');

    const ai = this.engine.getClient();
    // Copy bytes into a Uint8Array to avoid Buffer/ArrayBufferLike type incompatibilities.
    const bytes = new Uint8Array(fileBuffer);
    const blob = new Blob([bytes], { type: mimeType });
    const uploaded = await ai.files.upload({
      file: blob,
      config: { mimeType, displayName: safeName }
    });

    if (!uploaded.uri) {
      throw new Error('Gemini Files API did not return a file URI for the uploaded source.');
    }

    return {
      uri: uploaded.uri,
      mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'text/plain',
      displayName: safeName
    };
  }

  public async createThesisMasterCache(
    params: ThesisMasterCacheRequest
  ): Promise<string | undefined> {
    const title = params.thesisTitle.trim();
    const systemInstruction = params.systemInstruction.trim();
    const outline = params.outlineSummaryJson.trim();
    if (!title || !systemInstruction || !outline) {
      throw new Error('Thesis title, system instruction, and outline summary are required.');
    }

    const ttlHours = params.ttlHours ?? 2;
    if (!Number.isFinite(ttlHours) || ttlHours <= 0 || ttlHours > 24) {
      throw new Error('Context-cache TTL must be greater than 0 and no more than 24 hours.');
    }

    const files = params.uploadedFiles.filter(file =>
      typeof file.uri === 'string' &&
      file.uri.trim().length > 0 &&
      (file.mimeType === 'application/pdf' || file.mimeType === 'text/plain')
    );
    if (files.length !== params.uploadedFiles.length) {
      throw new Error('One or more uploaded source files have an invalid URI or MIME type.');
    }

    const parts: Array<Record<string, unknown>> = [
      { text: `Thesis title: ${title}\nApproved outline and structure:\n${outline}` },
      ...files.map(file => ({
        fileData: { fileUri: file.uri, mimeType: file.mimeType }
      }))
    ];

    try {
      const ai = this.engine.getClient();
      const { pro } = await this.engine.getOptimalModels();
      const cache = await ai.caches.create({
        model: pro,
        config: {
          displayName: `thesis_${title.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80)}_${Date.now()}`.slice(0, 128),
          systemInstruction,
          contents: [{ role: 'user', parts }],
          ttl: `${Math.max(60, Math.floor(ttlHours * 3600))}s`
        }
      });

      if (!cache.name) {
        console.warn('[Gemini context cache] Cache API returned no cache name; normal context will be used.');
        return undefined;
      }
      return cache.name;
    } catch {
      // Explicit caching is optional. Callers must continue without a cache on API/model/size errors.
      console.warn('[Gemini context cache] Explicit cache creation failed; continue without cached context.');
      return undefined;
    }
  }
}

/** Structural helper keeps call sites independent of the concrete SDK client type. */
export type AcademicKnowledgeVaultClient = GoogleGenAI;
