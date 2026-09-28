import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { APP_VIEW_IMPORTS } from './app-view-imports';
import { AppControllerActions } from './app-controller-actions';
import { AppCognitiveCopilotSectionComponent } from './app-sections/cognitive-copilot-section';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [...APP_VIEW_IMPORTS, AppCognitiveCopilotSectionComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent extends AppControllerActions implements OnInit {
  ngOnInit(): void {
    super.ngOnInit();
  }
}
