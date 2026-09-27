import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcademicPlatformService {
  private http = inject(HttpClient);

  public isOrchestrating = signal<boolean>(false);
  public lastPipelineResult = signal<any | null>(null);

  /**
   * Triggers the 10-Agent Academic Pipeline orchestration
   */
  public async orchestratePipeline(topic: string, discipline: string, draftText?: string, rawSources?: any[]): Promise<any> {
    this.isOrchestrating.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post('/api/platform/multi-agent-orchestrate', { topic, discipline, draftText, rawSources })
      );
      this.lastPipelineResult.set(res?.result);
      return res?.result;
    } catch (err) {
      console.error('Pipeline orchestration failed:', err);
      throw err;
    } finally {
      this.isOrchestrating.set(false);
    }
  }

  /**
   * Builds Claim-Evidence Graph
   */
  public async buildClaimEvidenceGraph(topic: string, draftText: string, sources: any[]): Promise<any> {
    const res: any = await firstValueFrom(
      this.http.post('/api/platform/evidence-graph', { topic, draftText, sources })
    );
    return res?.graph;
  }

  /**
   * Verifies academic sources & trust levels (A+ to F)
   */
  public async verifySources(sources: any[]): Promise<any> {
    const res: any = await firstValueFrom(
      this.http.post('/api/platform/source-verification', { sources })
    );
    return res;
  }

  /**
   * Evaluates thesis draft as AI Professor
   */
  public async evaluateThesis(draftText: string, topic: string): Promise<any> {
    const res: any = await firstValueFrom(
      this.http.post('/api/platform/academic-review', { draftText, topic })
    );
    return res?.report;
  }

  /**
   * Runs Pre-export QA Compliance Gate
   */
  public async runQAGate(documentText: string, sources: any[]): Promise<any> {
    const res: any = await firstValueFrom(
      this.http.post('/api/platform/qa-gate', { documentText, sources })
    );
    return res?.qa;
  }

  /**
   * Gets Observability Telemetry Metrics
   */
  public async getTelemetry(): Promise<any> {
    const res: any = await firstValueFrom(this.http.get('/api/platform/telemetry'));
    return res?.telemetry;
  }
}
