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
  async executeCode(code: string, datasetName?: string): Promise<PythonSandboxResult> {
    const response = await fetch('/api/dataset_sandbox_run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, datasetName })
    });

    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ ژینگەی پایتۆن نییە بۆ جێبەجێکردنی کۆدەکان.');
    }

    return response.json();
  }
}
