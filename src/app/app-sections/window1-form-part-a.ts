import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-window1-form-part-a',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  templateUrl: './window1-form-part-a.html'
})
export class AppWindow1FormPartAComponent {
  @Input({ required: true }) vm!: any;
}
