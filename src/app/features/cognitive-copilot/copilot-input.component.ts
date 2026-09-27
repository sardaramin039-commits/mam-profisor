import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppDashboardStateService } from '../../services/app-dashboard-state.service';
import { AppTemplateBridgeService } from '../../services/app-template-bridge.service';

@Component({
  selector: 'app-copilot-input',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './copilot-input.component.html',
  styles: [':host { display: block; }']
})
export class CopilotInputComponent {
  private readonly bridge = inject(AppTemplateBridgeService);
  private readonly dashboardState = inject(AppDashboardStateService);

  readonly userVoiceSampleText = this.dashboardState.userVoiceSampleText;
  readonly calibrationError = this.dashboardState.calibrationError;
  readonly calibratedVoiceProfile = this.dashboardState.calibratedVoiceProfile;
  readonly isCalibratingVoice = this.dashboardState.isCalibratingVoice;

  readonly copilotActiveTab = this.dashboardState.copilotActiveTab;
  readonly copilotInputText = this.bridge.copilotInputText;
  readonly copilotExtraInfo = this.bridge.copilotExtraInfo;
  readonly isCopilotRunning = this.bridge.isCopilotRunning;
  readonly copilotError = this.bridge.copilotError;

  calibrateAuthorVoice(): void {
    this.dashboardState.calibrateAuthorVoice();
  }

  runCognitiveCopilot(): void {
    this.bridge.runCognitiveCopilot();
  }
}
