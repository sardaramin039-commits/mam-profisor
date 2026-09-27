import { Injectable } from '@angular/core';

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
  /**
   * Arbitrary Python execution is intentionally disabled until the application
   * has a dedicated isolated sandbox backend (container/jail + resource limits).
   */
  async executeCode(_code: string, _datasetName?: string): Promise<PythonSandboxResult> {
    throw new Error(
      'Python sandbox backend is not deployed. Arbitrary code execution is disabled for safety.'
    );
  }
}
