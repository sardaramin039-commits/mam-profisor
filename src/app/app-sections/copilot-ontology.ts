import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-copilot-ontology',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-ontology.html'
})
export class AppCognitiveCopilotOntologyComponent {
  @Input({ required: true }) vm!: any;

  get res(): any {
    return this.vm?.copilotStressResult?.() || null;
  }
}
