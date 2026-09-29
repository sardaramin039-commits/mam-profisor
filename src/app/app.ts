import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GlobalToastContainerComponent } from './components/global-toast-container';
import { SplashScreenComponent } from './features/splash/splash-screen.component';
import { APP_TEMPLATE_SECTION_IMPORTS } from './app-template-sections';
import { AppControllerActions } from './app-controller-actions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [GlobalToastContainerComponent, SplashScreenComponent, ...APP_TEMPLATE_SECTION_IMPORTS],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent extends AppControllerActions implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
