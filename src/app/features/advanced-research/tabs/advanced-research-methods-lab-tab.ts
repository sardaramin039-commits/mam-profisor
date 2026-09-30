import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
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
  mode = signal<'prisma'|'power'|'claim_map'|'provenance'|'framework'|'risk_bias'|'evidence_grade'>('prisma');
  projectId = input<string>('current');
  result = signal<any>(null);
  error = signal<string | null>(null);
  running = signal(false);

  title=''; rationale=''; question=''; eligibility=''; informationSources=''; searchStrategy='';
  selectionProcess=''; dataCollection=''; riskOfBias=''; synthesis=''; reportingBias='';
  certainty=''; protocol=''; funding=''; conflicts=''; dataCode='';
  identified=0; screened=0; retrieved=0; excluded=0; included=0;
  design='two_group_t'; effect=0.5; alpha=0.05; power=0.8; mean1=0; mean2=0; sd1=1; sd2=1; n1=30; n2=30;
  claimsJson='[]'; provenanceJson='[]'; frameworkJson='{}'; assessmentsJson='{}'; evidenceJson='{}';
  frameworkKind='PICO'; riskTool='rob2'; initialCertainty='high';
  riskOfBiasInput=''; inconsistency=''; indirectness=''; imprecision=''; publicationBias='';
  decisionKind='other'; decisionText=''; decisionRationale=''; decisionImpact=''; actor:'user'|'ai_assistant'|'reviewer'='user';
  decisionEvidenceJson='[]'; decisionConflictJson='[]'; decisions=signal<Array<Record<string,unknown>>>([]); decisionRunning=signal(false);


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
    } : this.mode()==='claim_map' ? { claims:this.parseJson(this.claimsJson) }
      : this.mode()==='provenance' ? { records:this.parseJson(this.provenanceJson) }
      : this.mode()==='framework' ? { framework:this.frameworkKind, values:this.parseRecord(this.frameworkJson) }
      : this.mode()==='risk_bias' ? { tool:this.riskTool, assessments:this.parseRecord(this.assessmentsJson), evidence:this.parseRecord(this.evidenceJson) }
      : { initialCertainty:this.initialCertainty,riskOfBias:this.riskOfBiasInput,inconsistency:this.inconsistency,indirectness:this.indirectness,imprecision:this.imprecision,publicationBias:this.publicationBias };

    this.api.runResearchMethodsLab(this.mode(),p).subscribe({
      next:r=>{this.result.set(r.result);this.running.set(false);},
      error:e=>{this.error.set(e?.error?.error||'هەڵەیەک ڕوویدا.');this.running.set(false);}
    });
  }
  loadDecisions(): void {
    this.decisionRunning.set(true);
    this.api.listResearchDecisions(this.projectId()).subscribe({
      next:r=>{this.decisions.set(r.decisions);this.decisionRunning.set(false);},
      error:()=>this.decisionRunning.set(false)
    });
  }

  addDecision(): void {
    if (this.decisionText.trim().length < 3) return;
    this.decisionRunning.set(true);
    this.api.addResearchDecision(this.projectId(), {
      kind:this.decisionKind, decision:this.decisionText, rationale:this.decisionRationale,
      evidenceIds:this.parseJson(this.decisionEvidenceJson).map(String),
      conflictingEvidence:this.parseJson(this.decisionConflictJson).map(String),
      impact:this.decisionImpact, actor:this.actor
    }).subscribe({
      next:d=>{this.decisions.update(items=>[d,...items]);this.decisionText='';this.decisionRationale='';this.decisionImpact='';this.decisionRunning.set(false);},
      error:()=>this.decisionRunning.set(false)
    });
  }

  private parseRecord(value:string): Record<string, unknown> {
    try { const v=JSON.parse(value||'{}'); return v && typeof v==='object' && !Array.isArray(v) ? v : {}; }
    catch { return {}; }
  }

  private parseJson(value:string): unknown[] { try { const v=JSON.parse(value||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } }
}
