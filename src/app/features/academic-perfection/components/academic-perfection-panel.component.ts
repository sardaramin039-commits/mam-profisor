import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AcademicPerfectionService } from '../services/academic-perfection.service';
import {
  AuthenticityDeclaration,
  CreditAuthorRole,
  StatisticalRigorPlan,
  StructuredImradAbstract
} from '../models/academic-perfection.models';

@Component({
  selector: 'app-academic-perfection-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './academic-perfection-panel.component.html'
})
export class AppAcademicPerfectionPanelComponent implements OnInit {
  private readonly perfectionService = inject(AcademicPerfectionService);

  readonly host = input.required<any>();

  readonly activeTab = signal<'imrad' | 'credit' | 'authenticity' | 'statistics'>('imrad');
  readonly isSaved = signal(false);

  readonly imrad = signal<StructuredImradAbstract>(this.perfectionService.getDefaultAbstract());
  readonly creditRoles = signal<CreditAuthorRole[]>(this.perfectionService.getDefaultCreditRoles());
  readonly declaration = signal<AuthenticityDeclaration>(this.perfectionService.getDefaultDeclaration());
  readonly statisticalPlan = signal<StatisticalRigorPlan>(this.perfectionService.getDefaultStatisticalPlan());

  readonly newKeywordKurdish = signal('');
  readonly newKeywordEnglish = signal('');
  readonly newIndepVar = signal('');
  readonly newDepVar = signal('');

  readonly imradPreview = computed(() => {
    const title = this.host().manuscriptTitle?.() || '';
    return this.perfectionService.generateImradDocument(title, this.imrad());
  });

  readonly creditPreview = computed(() => {
    const author = this.declaration().authorName;
    return this.perfectionService.generateCreditStatement(author, this.creditRoles());
  });

  ngOnInit(): void {
    const state = this.perfectionService.loadState();
    this.imrad.set(state.imrad);
    this.creditRoles.set(state.creditRoles);
    this.declaration.set(state.declaration);
    this.statisticalPlan.set(state.statisticalPlan);
  }

  saveAll(): void {
    this.perfectionService.saveState({
      imrad: this.imrad(),
      creditRoles: this.creditRoles(),
      declaration: this.declaration(),
      statisticalPlan: this.statisticalPlan()
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 2500);
  }

  updateImradField<K extends keyof StructuredImradAbstract>(field: K, val: StructuredImradAbstract[K]): void {
    this.imrad.update(i => ({ ...i, [field]: val }));
  }

  addKeywordKurdish(): void {
    const kw = this.newKeywordKurdish().trim();
    if (!kw) return;
    this.imrad.update(i => ({ ...i, keywordsKurdish: [...i.keywordsKurdish, kw] }));
    this.newKeywordKurdish.set('');
  }

  removeKeywordKurdish(idx: number): void {
    this.imrad.update(i => ({ ...i, keywordsKurdish: i.keywordsKurdish.filter((_, idx2) => idx2 !== idx) }));
  }

  addKeywordEnglish(): void {
    const kw = this.newKeywordEnglish().trim();
    if (!kw) return;
    this.imrad.update(i => ({ ...i, keywordsEnglish: [...i.keywordsEnglish, kw] }));
    this.newKeywordEnglish.set('');
  }

  removeKeywordEnglish(idx: number): void {
    this.imrad.update(i => ({ ...i, keywordsEnglish: i.keywordsEnglish.filter((_, idx2) => idx2 !== idx) }));
  }

  toggleCreditRole(roleId: string): void {
    this.creditRoles.update(roles =>
      roles.map(r => (r.roleId === roleId ? { ...r, selected: !r.selected } : r))
    );
  }

  updateCreditAuthor(roleId: string, author: string): void {
    this.creditRoles.update(roles =>
      roles.map(r => (r.roleId === roleId ? { ...r, assignedAuthor: author } : r))
    );
  }

  updateDeclarationField<K extends keyof AuthenticityDeclaration>(field: K, val: AuthenticityDeclaration[K]): void {
    this.declaration.update(d => ({ ...d, [field]: val }));
  }

  updateStatField<K extends keyof StatisticalRigorPlan>(field: K, val: StatisticalRigorPlan[K]): void {
    this.statisticalPlan.update(s => ({ ...s, [field]: val }));
  }

  addIndepVar(): void {
    const v = this.newIndepVar().trim();
    if (!v) return;
    this.statisticalPlan.update(s => ({ ...s, independentVariables: [...s.independentVariables, v] }));
    this.newIndepVar.set('');
  }

  removeIndepVar(idx: number): void {
    this.statisticalPlan.update(s => ({ ...s, independentVariables: s.independentVariables.filter((_, i) => i !== idx) }));
  }

  addDepVar(): void {
    const v = this.newDepVar().trim();
    if (!v) return;
    this.statisticalPlan.update(s => ({ ...s, dependentVariables: [...s.dependentVariables, v] }));
    this.newDepVar.set('');
  }

  removeDepVar(idx: number): void {
    this.statisticalPlan.update(s => ({ ...s, dependentVariables: s.dependentVariables.filter((_, i) => i !== idx) }));
  }

  copyText(txt: string): void {
    navigator.clipboard?.writeText(txt);
  }
}
