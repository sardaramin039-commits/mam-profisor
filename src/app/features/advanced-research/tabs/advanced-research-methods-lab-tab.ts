import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ResearchApiClientService } from '../services/research-api-client.service';

@Component({
  selector: 'app-advanced-research-methods-lab-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-methods-lab-tab.html'
})
export class AdvancedResearchMethodsLabTabComponent {
  private readonly api = inject(ResearchApiClientService);
  mode = signal<'prisma'|'power'|'claim_map'|'provenance'>('prisma');
  result = signal<any>(null);
  error = signal<string | null>(null);
  running = signal(false);

  title=''; rationale=''; question=''; eligibility=''; informationSources=''; searchStrategy='';
  selectionProcess=''; dataCollection=''; riskOfBias=''; synthesis=''; reportingBias='';
  certainty=''; protocol=''; funding=''; conflicts=''; dataCode='';
  identified=0; screened=0; retrieved=0; excluded=0; included=0;
  design='two_group_t'; effect=0.5; alpha=0.05; power=0.8; mean1=0; mean2=0; sd1=1; sd2=1; n1=30; n2=30;
  claimsJson='[]'; provenanceJson='[]';

  run(): void {
    this.running.set(true); this.error.set(null); this.result.set(null);
    const p:any = this.mode()==='prisma' ? {
      title:this.title,rationale:this.rationale,question:this.question,eligibility:this.eligibility,
      informationSources:this.informationSources,searchStrategy:this.searchStrategy,selectionProcess:this.selectionProcess,
      dataCollection:this.dataCollection,riskOfBias:this.riskOfBias,synthesis:this.synthesis,reportingBias:this.reportingBias,
      certainty:this.certainty,protocol:this.protocol,funding:this.funding,conflicts:this.conflicts,dataCode:this.dataCode,
      identified:this.identified,screened:this.screened,retrieved:this.retrieved,excluded:this.excluded,included:this.included
    } : this.mode()==='power' ? {
      design:this.design,effect:this.effect,alpha:this.alpha,power:this.power,mean1:this.mean1,mean2:this.mean2,
      sd1:this.sd1,sd2:this.sd2,n1:this.n1,n2:this.n2
    } : this.mode()==='claim_map' ? { claims:this.parseJson(this.claimsJson) } : { records:this.parseJson(this.provenanceJson) };

    this.api.runResearchMethodsLab(this.mode(),p).subscribe({
      next:r=>{this.result.set(r.result);this.running.set(false);},
      error:e=>{this.error.set(e?.error?.error||'هەڵەیەک ڕوویدا.');this.running.set(false);}
    });
  }
  private parseJson(value:string): unknown[] { try { const v=JSON.parse(value||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } }
}
