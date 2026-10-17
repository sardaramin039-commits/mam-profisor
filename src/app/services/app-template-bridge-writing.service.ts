import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem } from '../domain/models';
import { ACADEMIC_GLOSSARY as GLOSSARY_PROMPT } from '../../prompts/academic-glossary';
import { CitationBuilder, CitationItem } from '../helpers/citation-builder';
import { createSnapshotHash } from './app-template-bridge.utils';
import { firstValueFrom } from 'rxjs';
import { AppTemplateBridgeStateService } from './app-template-bridge-state.service';
import { GeminiRequestManagerService } from './gemini-request-manager.service';
import { AcademicToulminArgumentService } from './academic-toulmin-argument.service';
import { AcademicHedgingStanceService } from './academic-hedging-stance.service';
import { SourceVerificationEngine } from '../helpers/source-verification-engine';
import { POLYPHONIC_SYNTHESIS_DIRECTIVES } from '../helpers/polyphonic-synthesis.helper';
import { buildTerminologyLockPromptContext } from '../helpers/terminology-consistency-checker';

import { BranchWritingEngineService } from './branch-writing-engine.service';

@Injectable()
export class AppTemplateBridgeWritingService extends AppTemplateBridgeStateService {
  readonly requestManager = inject(GeminiRequestManagerService);
  readonly toulminService = inject(AcademicToulminArgumentService);
  readonly hedgingService = inject(AcademicHedgingStanceService);
  readonly branchEngine = inject(BranchWritingEngineService);
  readonly writingWordProgress = this.requestManager.currentWordCountProgress;
  readonly isBranchWritingInProgress = this.branchEngine.isBranchWritingInProgress;
  readonly branchWritingStatus = this.branchEngine.currentWritingStatus;

  writeSingleChapter(id: number) {
    const chapter = this.getChapterById(id);
    if (!chapter) return;

    if (chapter.axes && chapter.axes.length > 0) {
      this.branchEngine.executeBranchByBranchWriting(this.editorService.chapters(), {
        targetChapterId: chapter.id,
        manuscriptTitle: this.refineForm?.get('title')?.value || chapter.title,
        academicLevel: this.refineForm?.get('academicLevel')?.value || 'ماستەر',
        discipline: this.refineForm?.get('discipline')?.value || 'زانستە ئەکادیمییەکان'
      });
      return;
    }

    const rawTargetWords = Number(this.refineForm?.get('targetWords')?.value) || 1800;
    const targetWords = Math.max(1200, rawTargetWords);
    const fullPrompt = `${chapter.title || 'بەشی توێژینەوەی ئەکادیمی'}\n\n${this.toulminService.getToulminDirectives()}\n\n${this.hedgingService.getHedgingDirectives()}\n\n${POLYPHONIC_SYNTHESIS_DIRECTIVES}\n\n${buildTerminologyLockPromptContext()}`;

    this.requestManager.generateLongAcademicSection(
      fullPrompt,
      targetWords,
      undefined,
      { chapterId: chapter.id, chapterTitle: chapter.title }
    ).then(result => {
      if (result?.content) {
        this.editorService.updateChapterContent(chapter.id, result.content, 'داڕشتنی بەشی ئەکادیمی (Toulmin & Multi-Pass)');
      }
    });
  }

  writeAllChapters() {
    this.branchEngine.executeBranchByBranchWriting(this.editorService.chapters(), {
      manuscriptTitle: this.refineForm?.get('title')?.value || 'تێزی ئەکادیمی',
      academicLevel: this.refineForm?.get('academicLevel')?.value || 'ماستەر',
      discipline: this.refineForm?.get('discipline')?.value || 'زانستە ئەکادیمییەکان'
    });
  }

  // Viva Simulation
  vivaErrorMessage = signal<string | null>(null);
  vivaQuestions = signal<any[] | null>(null);
  vivaEvaluationResult = signal<any | null>(null);
  vivaUserDefenseInput = signal<string>('');
  isEvaluatingDefense = signal<boolean>(false);

  runCognitiveCopilot() {
    const input = this.copilotInputText().trim();
    if (!input) return;

    this.isCopilotRunning.set(true);
    this.copilotError.set(null);

    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'ai_debate',
      inputText: input,
      options: {
        discipline: 'گشتی',
        academicLevel: 'ماستەر',
        language: 'ckb',
        tone: 'formal_academic'
      }
    }).subscribe({
      next: result => {
        const output = typeof result?.output === 'string' ? result.output.trim() : '';
        const thesisMatch = output.match(/(?:Thesis Argument|Pro)[:\\n]+([\\s\\S]*?)(?=\\n(?:Antithesis Argument|Con|Synthesis)|$)/i);
        const criticMatch = output.match(/(?:Antithesis Argument|Con)[:\\n]+([\\s\\S]*?)(?=\\n(?:Synthesis|Conclusion)|$)/i);
        const synthesisMatch = output.match(/(?:Synthesis(?: Conclusion)?|Conclusion)[:\\n]+([\\s\\S]*)/i);

        this.copilotDebateResult.set({
          thesisText: thesisMatch?.[1]?.trim() || output,
          criticText: criticMatch?.[1]?.trim() || '',
          synthesisText: synthesisMatch?.[1]?.trim() || output,
          rawOutput: output,
          status: result?.isFallback ? 'degraded' : 'generated'
        });
        this.isCopilotRunning.set(false);
      },
      error: (error: unknown) => {
        console.error('Cognitive Copilot error:', error);
        this.copilotError.set('Cognitive Copilot سەرکەوتوو نەبوو.');
        this.isCopilotRunning.set(false);
      }
    });
  }

  getChapterById(id: any): ChapterItem | null {
    const num = Number(id);
    return this.editorService.chapters().find(c => c.id === num) || this.editorService.chapters()[0] || null;
  }

  applyCockpitAccept(chapter: ChapterItem | null) {
    if (!chapter || !this.copilotDebateResult()) return;
    const added = `\n\n${this.copilotDebateResult().synthesisText}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'پەسەندکردنی کۆپایڵۆت');
  }

  applyCockpitCritic(chapter: ChapterItem | null) {
    if (!chapter || !this.copilotDebateResult()) return;
    const added = `\n\n### تێبینی ڕەخنەیی:\n${this.copilotDebateResult().criticText}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'زیادکردنی ڕەخنەی کۆپایڵۆت');
  }

  applyCockpitManual(chapter: ChapterItem | null) {
    if (!chapter || !this.cockpitManualResolution().trim()) return;
    const added = `\n\n${this.cockpitManualResolution()}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'چارەسەری دەستکرد');
    this.cockpitManualResolution.set('');
  }

  applyCopilotToChapter(chapter: ChapterItem | null) {
    const result = this.copilotDebateResult();
    if (!chapter || !result) return;
    const text = String(result.synthesisText || result.rawOutput || '').trim();
    if (!text) return;

    this.editorService.updateChapterContent(
      chapter.id,
      `${(chapter.content || '').trim()}\\n\\n${text}`,
      'جێبەجێکردنی کۆپایڵۆت'
    );
  }

  generateTitleAndSummary(topic: string) {
    const value = topic.trim();
    if (!value) return;

    this.isTitleSummaryGenerating.set(true);
    this.titleSummaryError.set(null);

    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'title_generator',
      inputText: value,
      options: { discipline: 'گشتی', academicLevel: 'ماستەر', language: 'ckb', tone: 'formal_academic' }
    }).subscribe({
      next: titleResult => {
        const titleOutput = typeof titleResult?.output === 'string' ? titleResult.output.trim() : '';
        const titles = titleOutput
          .split('\\n')
          .map((line: string) => line.replace(/^\\s*(?:[-*•]|\\d+[.)])\\s*/, '').trim())
          .filter((line: string) => line.length > 5)
          .slice(0, 5);

        this.http.post<any>('/api/ai-tools/execute', {
          toolId: 'abstract_generator',
          inputText: value,
          options: { discipline: 'گشتی', academicLevel: 'ماستەر', language: 'ckb', tone: 'formal_academic' }
        }).subscribe({
          next: summaryResult => {
            this.generatedTitleSummary.set({
              titles,
              summary: typeof summaryResult?.output === 'string' ? summaryResult.output.trim() : '',
              status: titleResult?.isFallback || summaryResult?.isFallback ? 'degraded' : 'generated'
            } as any);
            this.isTitleSummaryGenerating.set(false);
          },
          error: error => {
            console.warn('Abstract generation error (using local synthesis fallback):', error);
            const fallbackSummary = `ئەم توێژینەوەیە لەژێر ناونیشانی «${titles[0] || value}» بەدواداچوون بۆ بابەتی سەرەکیی (${value}) دەکات بە شێوازێکی زانستی و میتۆدی لە چوارچێوەی لێکۆڵینەوەیەکی ورددا بە زمانی کوردی.`;
            this.generatedTitleSummary.set({ titles, summary: fallbackSummary, status: 'degraded' } as any);
            this.isTitleSummaryGenerating.set(false);
          }
        });
      },
      error: error => {
        console.error('Title generation error:', error);
        this.titleSummaryError.set('دروستکردنی ناونیشان و پوختە سەرکەوتوو نەبوو.');
        this.generatedTitleSummary.set(null);
        this.isTitleSummaryGenerating.set(false);
      }
    });
  }

  applyGeneratedTitle(title: string) {
    const value = title.trim();
    if (!value) return;
    this.generatedTitleSummary.update(current => current ? { ...current, titles: [value, ...current.titles.filter(item => item !== value)] } : { titles: [value], summary: '' });
  }

  copyTitleSummary(summary: string) {
    if (summary) {
      navigator.clipboard.writeText(summary);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  setPageSizeMode(mode: string) {
    if (mode === 'target' || mode === 'range') {
      this.refineForm?.patchValue({ sizeMode: mode });
    }
  }
  closeQuickPreview() { this.isQuickPreviewVisible.set(false); }
  applySourceSuggestion(s: any) {
    if (!s) return;
    this.citationForm.patchValue({
      author: Array.isArray(s.authors) ? s.authors.join(', ') : (s.author || ''),
      title: s.title || '',
      publisher: s.publisher || '',
      journalOrPublisher: s.journal || s.publisher || '',
      year: Number(s.year || s.publicationYear || 0) || null,
      doi: s.doi || ''
    });
    this.sourceMessage.set({ type: 'success', text: 'تەنها metadata هێنرا؛ source هێشتا Verified نییە.' });
  }
  toggleAcademicSection(sec: string) {
    const cur = !!this.refineForm?.get(sec)?.value;
    this.refineForm?.patchValue({ [sec]: !cur });
  }
  updateRagModel(model: string) {
    if (model) {
      this.refineForm?.patchValue({ ragModel: model });
    }
  }
  updateRagLimit(limit: number) {
    if (typeof limit === 'number' && !isNaN(limit)) {
      this.refineForm?.patchValue({ ragLimit: limit });
    }
  }
  toggleRole(role: string) {
    if (role === 'writer') {
      const cur = !!this.refineForm?.get('roleAuthor')?.value;
      this.refineForm?.patchValue({ roleAuthor: !cur });
    } else if (role === 'critic') {
      const cur = !!this.refineForm?.get('roleCritic')?.value;
      this.refineForm?.patchValue({ roleCritic: !cur });
    } else if (role === 'reviewer') {
      const cur = !!this.refineForm?.get('roleReviewer')?.value;
      this.refineForm?.patchValue({ roleReviewer: !cur });
    }
  }
  toggleDialect(dialect: string) {
    if (dialect === 'thesis') {
      const cur = !!this.refineForm?.get('dialectThesis')?.value;
      this.refineForm?.patchValue({ dialectThesis: !cur });
    } else if (dialect === 'antithesis') {
      const cur = !!this.refineForm?.get('dialectAntithesis')?.value;
      this.refineForm?.patchValue({ dialectAntithesis: !cur });
    } else if (dialect === 'synthesis') {
      const cur = !!this.refineForm?.get('dialectSynthesis')?.value;
      this.refineForm?.patchValue({ dialectSynthesis: !cur });
    }
  }
  onDragOver(e: Event, type: string) {
    e.preventDefault();
    if (type === 'copyStyle') this.isDraggingCopyStyle.set(true);
    else if (type === 'comp1') this.isDraggingComp1.set(true);
    else if (type === 'comp2') this.isDraggingComp2.set(true);
  }
  onDragLeave(e: Event, type: string) {
    e.preventDefault();
    if (type === 'copyStyle') this.isDraggingCopyStyle.set(false);
    else if (type === 'comp1') this.isDraggingComp1.set(false);
    else if (type === 'comp2') this.isDraggingComp2.set(false);
  }
  onFileDrop(e: DragEvent, type: string) {
    e.preventDefault();
    this.onDragLeave(e, type);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.handleDroppedFile(file, type);
  }
  onFileSelected(e: Event, type: string) {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) this.handleDroppedFile(file, type);
  }
  private handleDroppedFile(file: File, type: string) {
    if (type === 'copyStyle') {
      this.copyStyleFileName.set(file.name);
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          if (text) this.refineForm?.patchValue({ copyStyleText: text.slice(0, 5000) });
        };
        reader.readAsText(file);
      }
    } else if (type === 'comp1') {
      this.compareFile1Name.set(file.name);
    } else if (type === 'comp2') {
      this.compareFile2Name.set(file.name);
    }
  }
  activateAllAcademicRules() {
    this.academicRules.update(rules => rules.map(rule => ({ ...rule, active: true })));
  }
  deactivateAllAcademicRules() {
    this.academicRules.update(rules => rules.map(rule => ({ ...rule, active: false })));
  }
  triggerComparison(result: any) {
    if (result) this.comparedResult.set(result);
  }
  searchLoadHistory(result: any) {
    if (result?.title) this.refineForm?.patchValue({ title: result.title });
  }
  onRegisterVerifiedSource() {
    if (!this.verifiedSourceForm.valid) {
      this.verifiedSourceForm.markAllAsTouched();
      return;
    }
    const value = this.verifiedSourceForm.getRawValue();
    void this.data.saveSourceToCloud({
      author: String(value.author || ''),
      title: String(value.title || ''),
      publisher: String(value.publisher || ''),
      year: Number(value.year || 0),
      sourceType: value.sourceType || 'book',
      doi: value.doi || value.doiOrUrl || '',
      isbn: value.isbn || '',
      isVerified: false
    });
    this.sourceMessage.set({ type: 'success', text: 'سەرچاوەکە وەک Unverified تۆمارکرا و پێویستی بە verification ـی دەرەکییە.' });
  }
  expandGlossaryTerm(entry: any) {
    if (!entry) return;
    const current = this.expandedTerms();
    const isExp = current[entry.foreign];
    if (isExp) {
      this.expandedTerms.set({ ...current, [entry.foreign]: null });
    } else {
      this.expandedTerms.set({
        ...current,
        [entry.foreign]: {
          explanation: entry.sorani,
          academicDefinition: entry.foreign,
          scientificExample: entry.sorani,
          history: 'مێژووی سەرهەڵدانی زاراوەکە لە ئەکادیمیادا',
          importance: 'گرنگی لە دارشتنی تێز',
          related: []
        }
      });
    }
  }
  applyGlossaryRealtimeFix(orig: string, fix: string) {}
  injectAcademicSourceCitation(source: any, mode: 'inline' | 'bibliography' = 'inline') {
    if (!source?.isVerified) {
      this.sourceMessage.set({ type: 'error', text: 'ئەم source ـە هێشتا Verified نییە؛ citation injection ڕەتکرایەوە.' });
      return;
    }
    const citation = source.formattedCitation || `${source.author} (${source.year || 'n.d.'}). ${source.title}.`;
    this.citationResult.set(mode === 'inline' ? citation : citation + '\\n');
  }
  toggleFaq(index: number) {
    this.expandedFaqIndex.set(this.expandedFaqIndex() === index ? null : index);
  }
  updateCompareLeftText(v: string) { this.compareLeftText.set(v); }
  updateCompareRightText(v: string) { this.compareRightText.set(v); }
  insertAcademicHeading(textarea: HTMLTextAreaElement, level: string) {
    if (!textarea) return;
    const map: Record<string, string> = {
      h1: '\n# سەرپەڕەی سەرەکی (Heading 1)\n',
      h2: '\n## سەرپەڕەی دووەم (Heading 2)\n',
      h3: '\n### تەوەری وردکراوە (Heading 3)\n',
      table: '\n| پێوەر | ژمارە (N) | ڕێژە (٪) | ناوەند (Mean) |\n| :--- | :---: | :---: | :---: |\n| نموونە | ٥٠ | ٪٥٠ | ٤.٢٥ |\n',
      methodology: '\n### میتۆدۆلۆژیا و ڕێکاری زانستی\n',
      results: '\n### ئەنجامەکان و دۆزینەوەکان\n',
      discussion: '\n### گفتوگۆ و تاوتوێکردنی بەڵگەدار\n'
    };
    const ins = map[level] || `\n### ${level}\n`;
    const s = textarea.selectionStart ?? textarea.value.length;
    textarea.value = textarea.value.substring(0, s) + ins + textarea.value.substring(s);
    textarea.selectionStart = textarea.selectionEnd = s + ins.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  applySoranispellFixInViewedChapter() {}
  encryptChapterInVault(_c: any, _pwd: any) {}
  decryptChapterInVault(_c: any, _pwd: any) {}
  createManualSnapshot(c: any) {
    if (!c?.id) return;
    try {
      const snapshot = { id: 'snap_' + Date.now(), chapterId: c.id, createdAt: new Date().toISOString(), content: String(c.content || ''), hash: createSnapshotHash(String(c.content || '')) };
      localStorage.setItem('mam-professor:snapshot:' + String(c.id), JSON.stringify(snapshot));
    } catch (error) { console.warn('Snapshot creation failed:', error); }
  }
  verifyChapterIntegrityAgainstLastSnapshot(c: any): { isValid: boolean; status: 'verified' | 'not-verified' | 'mismatch'; hash?: string } {
    if (!c?.id || typeof window === 'undefined') return { isValid: false, status: 'not-verified' };
    try {
      const raw = localStorage.getItem('mam-professor:snapshot:' + String(c.id));
      if (!raw) return { isValid: false, status: 'not-verified' };
      const snapshot = JSON.parse(raw) as { hash?: string };
      const currentHash = createSnapshotHash(String(c.content || ''));
      const isValid = snapshot.hash === currentHash;
      return { isValid, status: isValid ? 'verified' : 'mismatch', hash: currentHash };
    } catch {
      return { isValid: false, status: 'not-verified' };
    }
  }
  rollbackToSnapshot(c: any, sn: any) {
    if (!c || typeof sn?.content !== 'string') return;
    this.editorService.updateChapterContent(c.id, sn.content, 'گەڕانەوە بۆ وەشانی پێشووتر');
  }
  scrollToSection(text: string, textarea: HTMLTextAreaElement | null) {
    if (!textarea || !text) return;
    const index = textarea.value.indexOf(text);
    if (index < 0) return;
    textarea.focus();
    textarea.setSelectionRange(index, index + text.length);
  }
  verifyCitationsLive(c: any) {
    if (!c?.content) return;
    const sources = this.data.sourcesList() || [];
    const report = SourceVerificationEngine.crossCheckCitationsAgainstBibliography(c.content, sources);
    this.sourceMessage.set({
      type: report.isConsistent ? 'success' : 'error',
      text: `پشکنینی سەرچاوە: ${report.score}% هاوتایی. ${report.unmatchedInText.length ? report.unmatchedInText.length + ' ئاماژەی بێ سەرچاوە دۆزرایەوە.' : 'سەرجەم ئاماژەکان پشتڕاستکراون.'}`
    });
  }
  runAcademicConsultation() {
    const question = this.consultationTextToProofread().trim() || this.consultationTopic().trim();
    if (!question) return;

    this.isConsulting.set(true);
    this.consultationError.set(null);

    this.http.post<any>('/api/academic_consultation', {
      userQuestion: question,
      discipline: this.consultationAction(),
      academicLevel: 'ماستەر',
      currentThesisContext: this.consultationKeyConcept()
    }).subscribe({
      next: result => {
        this.consultationResult.set(result);
        this.isConsulting.set(false);
      },
      error: error => {
        console.error('Academic consultation error:', error);
        this.consultationError.set('ڕاوێژکاریی ئەکادیمی سەرکەوتوو نەبوو.');
        this.isConsulting.set(false);
      }
    });
  }
  appendConsultationToActiveChapter(chapter: any, text: string = '') {
    if (chapter) {
      this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + '\n\n' + text, 'زیادکردنی سەرنجی ڕاوێژکاری');
    }
  }
  auditAIIntegrity(chapter: any) {
    if (!chapter) return;
    this.isAuditingIntegrity.set(true);
    this.integrityAuditError.set(null);

    this.http.post<any>('/api/ai_integrity_audit', {
      text: (chapter.content || '').slice(0, 250000)
    }).subscribe({
      next: result => {
        this.integrityAuditResult.set(result);
        this.isAuditingIntegrity.set(false);
      },
      error: error => {
        console.error('AI integrity audit error:', error);
        this.integrityAuditError.set('پشکنینی AI Integrity سەرکەوتوو نەبوو.');
        this.isAuditingIntegrity.set(false);
      }
    });
  }
  summarizeThesisContext() {}
}
