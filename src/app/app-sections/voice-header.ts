import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { APP_VIEW_IMPORTS } from '../../app-view-imports';

@Component({
  selector: 'app-voice-header',
  standalone: true,
  imports: APP_VIEW_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './voice-header.html'
})
export class AppCognitiveVoiceHeaderComponent {
  @Input({ required: true }) vm!: any;
}
