import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../app-view-imports';

@Component({
  selector: 'app-voice-calibration',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './voice-calibration.html'
})
export class AppCognitiveVoiceCalibrationComponent {
  @Input({ required: true }) vm!: any;

  get calibrationError() {
    return this.vm?.calibrationError;
  }

  get isCalibratingVoice() {
    return this.vm?.isCalibratingVoice;
  }
}
