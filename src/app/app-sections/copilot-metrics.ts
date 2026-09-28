import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-copilot-metrics',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-metrics.html'
})
export class AppCognitiveCopilotMetricsComponent {
  @Input({ required: true }) vm!: any;
}
