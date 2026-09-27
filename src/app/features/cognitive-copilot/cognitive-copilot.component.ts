import { Component } from '@angular/core';
import { CopilotInputComponent } from './copilot-input.component';
import { CopilotResultsComponent } from './copilot-results.component';

@Component({
  selector: 'app-cognitive-copilot',
  standalone: true,
  imports: [CopilotInputComponent, CopilotResultsComponent],
  template: `
    <section class="bg-gradient-to-br from-[#FAF9F5] over-white to-[#F6F4EE] border-2 border-[#D4AF37] rounded-2xl p-6 shadow-md text-right space-y-6" id="cognitive-copilot-section">
      <app-copilot-input></app-copilot-input>
      <app-copilot-results></app-copilot-results>
    </section>
  `
})
export class CognitiveCopilotComponent {}
