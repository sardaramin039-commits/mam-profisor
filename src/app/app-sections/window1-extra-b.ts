import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-window1-extra-b',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window1-extra-b.html'
})
export class AppWindow1ExtraBComponent {
  @Input({ required: true }) vm!: any;

  get historyFilterLevel() {
    return this.vm?.historyFilterLevel;
  }

  get historyFilterStatus() {
    return this.vm?.historyFilterStatus;
  }

  get filteredHistoryList() {
    return this.vm?.filteredHistoryList;
  }
}
