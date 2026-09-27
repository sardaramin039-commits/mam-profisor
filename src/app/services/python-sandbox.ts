import { Injectable, inject } from '@angular/core';
import { AuthenticatedApiService } from '../core/services/authenticated-api.service';

export interface PythonSandboxResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  generatedChartUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PythonSandboxService {
  private readonly api = inject(AuthenticatedApiService);

  executeCode(code: string, datasetName?: string): Promise<PythonSandboxResult> {
    return this.api.post<PythonSandboxResult>('/api/dataset_sandbox_run', {
      code,
      datasetName
    });
  }
}
