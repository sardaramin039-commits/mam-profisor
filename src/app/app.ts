import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { APP_VIEW_IMPORTS } from './app-view-imports';
import { APP_TEMPLATE_SECTION_IMPORTS } from './app-template-sections';
import { AppControllerActions } from './app-controller-actions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [...APP_VIEW_IMPORTS, ...APP_TEMPLATE_SECTION_IMPORTS],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent extends AppControllerActions implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
