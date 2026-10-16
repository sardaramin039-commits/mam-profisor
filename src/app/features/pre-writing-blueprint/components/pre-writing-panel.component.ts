import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PreWritingService } from '../services/pre-writing.service';
import { ProposalAlignmentFeedback, ResearchProposalBlueprint } from '../models/pre-writing.models';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { VerticalAlignmentMatrixItem } from '../../../helpers/thesis-context-map';
import { toSoraniNumber } from '../../../pipes/sorani-number.pipe';

@Component({
  selector: 'app-pre-writing-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './pre-writing-panel.component.html'
})
export class AppPreWritingPanelComponent implements OnInit {
  private readonly preWritingService = inject(PreWritingService);
  private readonly academicStore = inject(AcademicStoreService);

  readonly host = input.required<any>();

  readonly blueprint = signal<ResearchProposalBlueprint>(this.preWritingService.getDefaultBlueprint());
  readonly isSaved = signal(false);
  readonly activeStep = signal<'problem' | 'questions' | 'objectives' | 'scope' | 'methodology' | 'preview' | 'matrix'>('problem');
  readonly alignmentFeedback = signal<ProposalAlignmentFeedback | null>(null);
  readonly verticalMatrix = computed(() => this.academicStore.verticalAlignmentMatrix());

  readonly newSubQuestion = signal('');
  readonly newObjective = signal('');
  readonly newTool = signal('');

  readonly proposalPreview = computed(() => {
    const title = this.host().refineForm?.get?.('title')?.value || this.host().manuscriptTitle?.() || '';
    return this.preWritingService.generateProposalDocument(title, this.blueprint());
  });

  ngOnInit(): void {
    const saved = this.preWritingService.loadBlueprint();
    this.blueprint.set(saved);
    this.validate();
  }

  saveBlueprint(): void {
    this.preWritingService.saveBlueprint(this.blueprint());
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 2500);
    this.validate();
  }

  updateField<K extends keyof ResearchProposalBlueprint>(field: K, val: ResearchProposalBlueprint[K]): void {
    this.blueprint.update(bp => ({ ...bp, [field]: val }));
    this.validate();
  }

  addSubQuestion(): void {
    const q = this.newSubQuestion().trim();
    if (!q) return;
    this.blueprint.update(bp => ({
      ...bp,
      subQuestions: [...bp.subQuestions, q]
    }));
    this.newSubQuestion.set('');
    this.validate();
  }

  removeSubQuestion(index: number): void {
    this.blueprint.update(bp => ({
      ...bp,
      subQuestions: bp.subQuestions.filter((_, i) => i !== index)
    }));
    this.validate();
  }

  addObjective(): void {
    const obj = this.newObjective().trim();
    if (!obj) return;
    this.blueprint.update(bp => ({
      ...bp,
      specificObjectives: [...bp.specificObjectives, obj]
    }));
    this.newObjective.set('');
    this.validate();
  }

  removeObjective(index: number): void {
    this.blueprint.update(bp => ({
      ...bp,
      specificObjectives: bp.specificObjectives.filter((_, i) => i !== index)
    }));
    this.validate();
  }

  addDataTool(): void {
    const tool = this.newTool().trim();
    if (!tool) return;
    this.blueprint.update(bp => ({
      ...bp,
      dataCollectionTools: [...bp.dataCollectionTools, tool]
    }));
    this.newTool.set('');
    this.validate();
  }

  removeDataTool(index: number): void {
    this.blueprint.update(bp => ({
      ...bp,
      dataCollectionTools: bp.dataCollectionTools.filter((_, i) => i !== index)
    }));
    this.validate();
  }

  validate(): void {
    const fb = this.preWritingService.validateAlignment(this.blueprint());
    this.alignmentFeedback.set(fb);
  }

  copyProposal(): void {
    navigator.clipboard?.writeText(this.proposalPreview());
  }

  applyToChapterDraft(): void {
    const active = this.host().activeChapter?.();
    if (active) {
      active.content = (active.content ? active.content + '\n\n' : '') + this.proposalPreview();
      this.host().saveToLocalDraft?.();
    }
  }

  toSorani(val: any): string {
    return toSoraniNumber(val);
  }

  syncVerticalAlignmentMatrix(): void {
    const bp = this.blueprint();
    const questions = [bp.coreQuestion, ...bp.subQuestions].filter(Boolean);
    const objectives = [bp.mainObjective, ...bp.specificObjectives].filter(Boolean);
    const chapters = this.academicStore.chapters();

    const items: VerticalAlignmentMatrixItem[] = questions.map((q, idx) => {
      const qNum = idx + 1;
      const targetChapterId = idx + 2; // Link to practical/analytical chapters
      const targetChapter = chapters.find(c => c.id === targetChapterId) || {
        id: targetChapterId,
        title: `بەشی ${targetChapterId}: تەوەری شیکاریی ${qNum}`
      };
      const objectiveText = objectives[idx] || `وەڵامدانەوەی پێداویستیی لێکۆڵینەوە بۆ پرسیاری ${qNum}`;

      return {
        id: `align-${Date.now()}-${qNum}`,
        questionNumber: qNum,
        questionText: q,
        objectiveText,
        targetChapterId: targetChapter.id,
        targetChapterTitle: targetChapter.title,
        expectedFindingSummary: `دەرەنجامی سەلمێنراو بۆ هاوتابوونی پرسیاری ${qNum} لە بەشی دەرەنجامەکان.`,
        status: 'aligned'
      };
    });

    if (items.length > 0) {
      this.academicStore.setVerticalAlignmentMatrix(items);
      this.academicStore.setFeedback('ماتریسی هاوتابوونی ستوونی بە سەرکەوتوویی نوێکرایەوە.');
    }
  }
}
