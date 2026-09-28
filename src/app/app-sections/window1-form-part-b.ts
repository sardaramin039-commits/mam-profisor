import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-window1-form-part-b',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window1-form-part-b.html'
})
export class AppWindow1FormPartBComponent {
  @Input({ required: true }) vm!: any;
}
