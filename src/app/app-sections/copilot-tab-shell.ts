import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../../app-view-imports';

@Component({
  selector: 'app-copilot-tab-shell',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-tab-shell.html'
})
export class AppCognitiveCopilotTabShellComponent {
  @Input({ required: true }) vm!: any;
}
