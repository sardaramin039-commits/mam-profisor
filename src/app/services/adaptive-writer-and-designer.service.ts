import { Injectable } from '@angular/core';
import {
  writeCalibratedSubSection,
  generateCalibratedConclusion,
  generateLevelDesignStylesheet
} from './AdaptiveWriterAndDesigner';
import { AcademicLevel } from './LevelProfiles';
import { SubSectionPlan } from './BlueprintAndOutlineAgent';
import { AdaptiveCitationManager } from './AdaptiveCitationManager';

export * from './AdaptiveWriterAndDesigner';

@Injectable({
  providedIn: 'root'
})
export class AdaptiveWriterAndDesignerService {
  public async writeSubSection(params: {
    thesisTitle: string;
    level: AcademicLevel;
    chapterTitle: string;
    sectionTitle: string;
    subSection: SubSectionPlan;
    previousClosingParagraph: string;
    nextSubSectionTitle?: string;
    citationManager: AdaptiveCitationManager;
  }): Promise<{ fullSubSectionMarkdown: string; lastParagraph: string; keyFindings: string[] }> {
    return writeCalibratedSubSection(params);
  }

  public async generateConclusion(
    title: string,
    level: AcademicLevel,
    allFindings: string[]
  ): Promise<string> {
    return generateCalibratedConclusion(title, level, allFindings);
  }

  public getLevelStylesheet(level: AcademicLevel): string {
    return generateLevelDesignStylesheet(level);
  }
}
