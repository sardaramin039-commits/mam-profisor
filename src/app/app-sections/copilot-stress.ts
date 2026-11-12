import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-copilot-stress',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-stress.html'
})
export class AppCognitiveCopilotStressComponent {
  @Input({ required: true }) vm!: any;

  get res(): any {
    return this.vm?.copilotGapResult?.() || null;
  }
}
