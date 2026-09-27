import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../../features/editor/services/editor';
import { AppTemplateBridgeService } from '../../services/app-template-bridge.service';
import { AppUiActionsService } from '../../services/app-ui-actions.service';

@Component({
  selector: 'app-copilot-results',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './copilot-results.component.html',
  styles: [':host { display: block; }']
})
export class CopilotResultsComponent {
  private readonly bridge = inject(AppTemplateBridgeService);
  private readonly editorService = inject(EditorService);
  private readonly uiActions = inject(AppUiActionsService);

  readonly copilotDebateResult = this.bridge.copilotDebateResult;
  readonly cockpitManualResolution = this.bridge.cockpitManualResolution;
  readonly copilotGapResult = this.bridge.copilotGapResult;
  readonly copilotStressResult = this.bridge.copilotStressResult;
  readonly copilotOntologyResult = this.bridge.copilotOntologyResult;
  readonly chapters = this.editorService.chapters;

  getKurdishNumberStr(index: number): string {
    return this.uiActions.getKurdishNumberStr(index);
  }

  getChapterById(id: number | string): any {
    return this.bridge.getChapterById(id);
  }

  applyCockpitAccept(chapter: any): void {
    this.bridge.applyCockpitAccept(chapter);
  }

  applyCockpitCritic(chapter: any): void {
    this.bridge.applyCockpitCritic(chapter);
  }

  applyCockpitManual(chapter: any): void {
    this.bridge.applyCockpitManual(chapter);
  }

  applyCopilotToChapter(chapter: any): void {
    this.bridge.applyCopilotToChapter(chapter);
  }
}
