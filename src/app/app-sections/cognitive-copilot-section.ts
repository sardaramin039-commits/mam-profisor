import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppCognitiveVoiceHeaderComponent } from './voice-header';
import { AppCognitiveVoiceCalibrationComponent } from './voice-calibration';
import { AppCognitiveCopilotTabNavComponent } from './copilot-tab-nav';
import { AppCognitiveCopilotTabShellComponent } from './copilot-tab-shell';
import { AppCognitiveCopilotResultComponent } from './copilot-result';
import { AppCognitiveCopilotMetricsComponent } from './copilot-metrics';
import { AppCognitiveCopilotDebateComponent } from './copilot-debate';
import { AppCognitiveCopilotStressComponent } from './copilot-stress';
import { AppCognitiveCopilotOntologyComponent } from './copilot-ontology';
import { AppCognitiveCopilotAdvancedComponent } from './copilot-advanced';

@Component({
  selector: 'app-cognitive-copilot-section',
  standalone: true,
  imports: [
    AppCognitiveVoiceHeaderComponent, AppCognitiveVoiceCalibrationComponent,
    AppCognitiveCopilotTabNavComponent, AppCognitiveCopilotTabShellComponent,
    AppCognitiveCopilotResultComponent, AppCognitiveCopilotMetricsComponent,
    AppCognitiveCopilotDebateComponent, AppCognitiveCopilotStressComponent,
    AppCognitiveCopilotOntologyComponent, AppCognitiveCopilotAdvancedComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cognitive-copilot-section.html'
})
export class AppCognitiveCopilotSectionComponent {
  @Input({ required: true }) vm!: any;
}
