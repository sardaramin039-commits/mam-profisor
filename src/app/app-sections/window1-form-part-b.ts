import { Component, ChangeDetectionStrategy, Input, ControlContainer, FormGroupDirective } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-window1-form-part-b',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  templateUrl: './window1-form-part-b.html'
})
export class AppWindow1FormPartBComponent {
  @Input({ required: true }) vm!: any;
}
