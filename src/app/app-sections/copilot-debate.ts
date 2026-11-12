import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-copilot-debate',
  standalone: true,
  imports: [...APP_VIEW_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-debate.html'
})
export class AppCognitiveCopilotDebateComponent {
  @Input({ required: true }) vm!: any;

  get res(): any {
    const result = this.vm?.copilotDebateResult?.() || null;
    if (!result) return null;
    return {
      agents: [
        { name: 'Thesis', avatar: 'T', argument: result.thesisText || '' },
        { name: 'Critic', avatar: 'C', argument: result.criticText || '' },
        { name: 'Synthesis', avatar: 'S', argument: result.synthesisText || '' }
      ],
      consensus: result.synthesisText || result.rawOutput || '',
      hardeningSteps: result.criticText ? [result.criticText] : []
    };
  }
}
