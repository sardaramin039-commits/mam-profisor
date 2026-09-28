import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppWindow1ExtraAComponent } from './window1-extra-a';
import { AppWindow1ExtraBComponent } from './window1-extra-b';

@Component({
  selector: 'app-window1-extra-shell',
  standalone: true,
  imports: [AppWindow1ExtraAComponent, AppWindow1ExtraBComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window1-extra-shell.html'
})
export class AppWindow1ExtraShellComponent {
  @Input({ required: true }) vm!: any;
}
