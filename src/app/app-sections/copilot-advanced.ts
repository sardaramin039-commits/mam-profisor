import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-copilot-advanced',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-advanced.html'
})
export class AppCognitiveCopilotAdvancedComponent {
  @Input({ required: true }) vm!: any;
}
