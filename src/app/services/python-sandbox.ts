import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
  private readonly http = inject(HttpClient);

  async executeCode(code: string, datasetName?: string): Promise<PythonSandboxResult> {
    const trimmed = code.trim();
    if (!trimmed) throw new Error('کۆدی پایتۆن پێویستە.');

    return firstValueFrom(
      this.http.post<PythonSandboxResult>(
        '/api/dataset_sandbox_run',
        {
          code: trimmed.slice(0, 100_000),
          datasetName: datasetName?.trim().slice(0, 200)
        }
      )
    );
  }
}
