import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppWindow1FormPartAComponent } from './window1-form-part-a';
import { AppWindow1FormPartBComponent } from './window1-form-part-b';

@Component({
  selector: 'app-window1-form-shell',
  standalone: true,
  imports: [AppWindow1FormPartAComponent, AppWindow1FormPartBComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window1-form-shell.html'
})
export class AppWindow1FormShellComponent {
  @Input({ required: true }) vm!: any;
}
