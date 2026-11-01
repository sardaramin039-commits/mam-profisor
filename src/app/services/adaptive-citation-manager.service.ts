import { Injectable, inject } from '@angular/core';
import { AdaptiveCitationManager, SourceItem } from './AdaptiveCitationManager';
import { AcademicLevel } from './LevelProfiles';
import { CitationVerificationTrackerService } from './citation-verification-tracker.service';

export * from './AdaptiveCitationManager';

@Injectable({
  providedIn: 'root'
})
export class AdaptiveCitationService {
  private tracker = inject(CitationVerificationTrackerService);
  private managers = new Map<AcademicLevel, AdaptiveCitationManager>();

  public getManager(level: AcademicLevel = 'phd'): AdaptiveCitationManager {
    if (!this.managers.has(level)) {
      this.managers.set(level, new AdaptiveCitationManager(level, this.tracker));
    }
    return this.managers.get(level)!;
  }

  public createManager(level: AcademicLevel = 'phd'): AdaptiveCitationManager {
    return new AdaptiveCitationManager(level, this.tracker);
  }
}
