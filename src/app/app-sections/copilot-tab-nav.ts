import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../../app-view-imports';

@Component({
  selector: 'app-copilot-tab-nav',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-tab-nav.html'
})
export class AppCognitiveCopilotTabNavComponent {
  @Input({ required: true }) vm!: any;
}
