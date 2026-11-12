import { Injectable } from '@angular/core';
import {
  generateCompleteAcademicWork,
  CompleteAcademicWorkResult,
  MasterOrchestrationProgress
} from './MasterOrchestrator';
import { AcademicLevel } from './LevelProfiles';

export * from './MasterOrchestrator';

@Injectable({
  providedIn: 'root'
})
export class MasterOrchestratorService {
  public async generateCompleteWork(
    title: string,
    level: AcademicLevel,
    onProgress?: (progress: MasterOrchestrationProgress) => void
  ): Promise<CompleteAcademicWorkResult> {
    return generateCompleteAcademicWork(title, level, onProgress);
  }
}
