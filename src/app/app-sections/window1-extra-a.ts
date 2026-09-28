import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-window1-extra-a',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window1-extra-a.html'
})
export class AppWindow1ExtraAComponent {
  @Input({ required: true }) vm!: any;
}
