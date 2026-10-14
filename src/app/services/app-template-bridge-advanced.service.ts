import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem } from '../domain/models';
import { ACADEMIC_GLOSSARY as GLOSSARY_PROMPT } from '../../prompts/academic-glossary';
import { CitationBuilder, CitationItem } from '../helpers/citation-builder';

function createSnapshotHash(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
import { AppTemplateBridgeWritingService } from './app-template-bridge-writing.service';
import { AcademicToulminArgumentService } from './academic-toulmin-argument.service';
import { AcademicHedgingStanceService } from './academic-hedging-stance.service';
import { AcademicLexiconStandardsService } from './academic-lexicon-standards.service';

@Injectable()
export class AppTemplateBridgeAdvancedService extends AppTemplateBridgeWritingService {
  readonly lexiconService = inject(AcademicLexiconStandardsService);

  anonymizeActiveChapterData(chapter: any) {
    if (!chapter) return;
    const text = (chapter.content || '').trim();
    if (!text) {
      this.anonymizationError.set('تکایە سەرەتا دەق یان ناوەڕۆکی بەش بنووسە بۆ شاردنەوەی زانیارییە کەسییەکان.');
      return;
    }
    this.isAnonymizingData.set(true);
    this.anonymizationError.set(null);

    this.http.post<any>('/api/anonymize_data', {
      text: text.slice(0, 250000)
    }).subscribe({
      next: result => {
        this.anonymizationResult.set(result);
        this.isAnonymizingData.set(false);
      },
      error: error => {
        console.error('Anonymization error:', error);
        this.anonymizationError.set('شاردنەوەی زانیارییە ناسێنەرەکان سەرکەوتوو نەبوو.');
        this.isAnonymizingData.set(false);
      }
    });
  }
  recalibrateWithIntuition(chapter: any) {}
  generateVivaQuestions(chapter: any) {
    if (!chapter) return;
    this.isSimulatingViva.set(true);
    this.vivaErrorMessage.set(null);

    this.http.post<any>('/api/simulate_viva', {
      thesisTitle: chapter.title || 'تێزی ئەکادیمی',
      abstract: (chapter.content || '').slice(0, 8000)
    }).subscribe({
      next: result => {
        const questions = Array.isArray(result?.questions)
          ? result.questions
          : Array.isArray(result?.vivaQuestions)
            ? result.vivaQuestions
            : [];
        this.vivaQuestions.set(questions);
        this.isSimulatingViva.set(false);
      },
      error: error => {
        console.error('Viva generation error:', error);
        this.vivaErrorMessage.set('دروستکردنی پرسیارەکانی Viva سەرکەوتوو نەبوو.');
        this.isSimulatingViva.set(false);
      }
    });
  }
  generateAcademicAdditions(chapter: any) {
    if (!chapter) return;
    const content = (chapter.content || '').trim();
    if (!content) return;
    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'argument_builder',
      inputText: `تێزی سەرەکی: ${chapter.title || 'تێز'}\nدەق: ${content.slice(0, 10000)}`,
      options: {
        academicLevel: 'دکتۆرا',
        discipline: this.consultationAction() || 'گشتی',
        tone: 'formal_academic'
      }
    }).subscribe({
      next: result => {
        const text = typeof result?.output === 'string' ? result.output.trim() : '';
        if (text) {
          this.appendAdditionsToChapter(chapter, text);
        }
      },
      error: err => console.error('Academic additions error:', err)
    });
  }
  appendAdditionsToChapter(chapter: any, addition: any) {
    const text = String(addition || '').trim();
    if (!chapter || !text) return;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '').trim() + '\n\n' + text, 'زیادکردنی بڕگەی ئەکادیمی');
  }
  appendMethodologyLayoutToChapter(chapter: any) {
    if (!chapter || !this.methodologyResult()) return;
    const result = this.methodologyResult();
    const parts = [result.methodologyText, ...(Array.isArray(result.dataCollectionTools) ? result.dataCollectionTools.map((x: unknown) => String(x)) : [])].filter(Boolean);
    if (!parts.length) return;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '').trim() + '\n\n' + parts.join('\n'), 'زیادکردنی پێکهاتەی مێتۆدۆلۆژی');
  }
  analyzeSoraniPhoneticsAndDialect(chapter: any) {}
  constructMethodologyAndHypotheses(chapter: any) {
    if (!chapter) return;
    this.isConstructingMethodology.set(true);
    this.methodologyError.set(null);

    this.http.post<any>('/api/construct_methodology', {
      title: chapter.title || 'توێژینەوەی ئەکادیمی',
      discipline: this.consultationAction() || 'گشتی',
      researchType: this.methodologyType(),
      sampleSize: null
    }).subscribe({
      next: result => {
        this.methodologyResult.set(result);
        this.isConstructingMethodology.set(false);
      },
      error: error => {
        console.error('Methodology construction error:', error);
        this.methodologyError.set('بونیادنانی مێتۆدۆلۆژی سەرکەوتوو نەبوو.');
        this.isConstructingMethodology.set(false);
      }
    });
  }
  appendStatsExplanationToChapter(chapter: any) {
    const result = this.empiricalStatsResult();
    if (!chapter || !result) return;
    const text = typeof result.explanation === 'string' ? result.explanation.trim() : '';
    if (!text) return;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '').trim() + '\n\n### ڕوونکردنەوەی ئامار\n' + text, 'زیادکردنی ڕوونکردنەوەی ئامار');
  }
  simulateEmpiricalStats(chapter: any) {
    this.statsError.set('ئاماری ئەزموونی خەیاڵی دروست ناکرێت. داتای ڕاستەقینە زیاد بکە یان dataset ـێکی پشتڕاستکراو بەکاربهێنە.');
    this.empiricalStatsResult.set(null);
  }
  generateMultiStyleCitation() {
    if (!this.citationForm.valid) {
      this.citationForm.markAllAsTouched();
      return;
    }

    const value = this.citationForm.getRawValue();
    const source: CitationItem = {
      id: '',
      authors: String(value.author || ''),
      title: String(value.title || ''),
      year: Number(value.year || 0),
      publisher: String(value.publisher || value.journalOrPublisher || ''),
      journal: String(value.journalOrPublisher || ''),
      doi: value.doi || undefined,
      type: 'book'
    };

    this.formattedMultiStyle.set({
      APA: CitationBuilder.formatAPA(source),
      MLA: CitationBuilder.formatMLA(source),
      Harvard: CitationBuilder.formatHarvard(source),
      Chicago: CitationBuilder.formatChicago(source),
      IEEE: CitationBuilder.formatIEEE(source)
    });
  }
  checkChapterPlagiarism(chapter: any) {
    if (!chapter) return;
    const content = (chapter.content || '').trim();
    if (!content) return;
    this.http.post<any>('/api/plagiarism_check', {
      title: chapter.title || 'بەشی تێز',
      content: content.slice(0, 20000)
    }).subscribe({
      next: result => {
        if (result?.similarityScore !== undefined) {
          this.editorService.updateChapterContent(
            chapter.id,
            chapter.content,
            `پشکنینی ڕەسەنایەتی: نمرەی هاوشێوەیی ${result.similarityScore}%`
          );
        }
      },
      error: err => console.error('Plagiarism check error:', err)
    });
  }
  exportSandboxPDF() {}
  appendPythonSandboxOutputToChapter(chapter: any) {}
  executePythonDatasetInterpreter(chapter: any) {}
  copyLatexCode(code: string) {
    if (code) navigator.clipboard.writeText(code);
  }
  generateEliteAcademicAssessment(chapter: any) {
    if (!chapter) return;
    const content = (chapter.content || '').trim();
    if (!content) return;
    this.http.post<any>('/api/analyze_academic_rigor', {
      title: chapter.title || 'بەشی توێژینەوە',
      content: content.slice(0, 20000),
      discipline: this.consultationAction() || 'گشتی',
      theoreticalFramework: 'epistemological_realism',
      academicStyle: 'apa7'
    }).subscribe({
      next: result => {
        this.activeAcademicDiagnostic.set(result);
      },
      error: err => console.error('Elite assessment error:', err)
    });
  }
  copyCitationsToClipboard(txt: string) {
    if (txt) navigator.clipboard.writeText(txt);
  }
  appendCitationToChapter(chapter: any) {}

  toggleAcademicRule(id: string) {
    this.academicRules.update(list => list.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }
  removeCustomRule(id: string) {
    this.academicRules.update(list => list.filter(r => r.id !== id));
  }
  onGlobalSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.globalSearchQuery.set(val);
  }
  searchOpenChapter(result: any) {}
  searchUseGlossary(result: any) {}
  searchCopyGlossary(result: any) {
    if (result?.text) navigator.clipboard.writeText(result.text);
  }
  clearComparison() { this.comparedResult.set(null); }
  getOriginalComparisonText(res: any): string { return res?.text || ''; }
  copyAllSearchResults() {}
  sendFilteredReportToEmail() {}
  runRecentSearch(term: string) { this.globalSearchQuery.set(term); }
  onBuildCitation() {
    if (this.citationForm.valid) {
      const v = this.citationForm.value;
      this.citationResult.set(`${v.author} (${v.year}). ${v.title}. ${v.journalOrPublisher || ''}.`);
    }
  }
  importPdf4KurdBookToForm(book: any) {
    if (!book) return;
    this.verifiedSourceForm.patchValue({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      year: Number(book.year || 0) || null,
      sourceType: 'book',
      doi: '',
      doiOrUrl: book.link || '',
      isVerified: false
    });
  }
  importPdf4KurdBookToVerified(book: any) {}
  deleteVerifiedSource(id: string) {
    if (!id) return;
    void this.data.deleteSource(id);
  }
  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.glossarySearchQuery.set(val);
  }
  onFilterCategory(cat: string) { this.glossaryCategoryFilter.set(cat); }
  useGlossaryTerm(entry: any) {
    if (!entry) return;
    this.activeGlossaryTerm.set({
      kurdish: entry.kurdish || entry.sorani || '',
      english: entry.english || entry.foreign || '',
      category: entry.category || 'general',
      desc: entry.desc || entry.definition || ''
    });
    this.glossaryUserDraft.set(entry.kurdish || entry.sorani || entry.foreign || '');
  }
  analyzeChapterRigor(c: ChapterItem) {
    if (!c) return;
    const content = (c.content || '').trim();
    if (!content) {
      this.activeAcademicDiagnostic.set({
        academicScore: 0,
        clarityScore: 0,
        methodologyScore: 0,
        kurdishTerminologyScore: 0,
        critiqueSummary: 'تکایە سەرەتا ناوەڕۆکی بەش بنووسە پێش داواکردنی هەڵسەنگاندنی ئەکادیمی.'
      } as any);
      return;
    }
    this.isAnalyzingRigorForChapterId.set(c.id);

    this.http.post<any>('/api/analyze_academic_rigor', {
      title: c.title || 'بەشی توێژینەوە',
      content,
      discipline: this.consultationAction() || 'گشتی',
      theoreticalFramework: 'critical_theory',
      academicStyle: this.selectedCitationStyle()
    }).subscribe({
      next: result => {
        this.activeAcademicDiagnostic.set(result);
        this.isAnalyzingRigorForChapterId.set(null);
      },
      error: error => {
        console.error('Rigor analysis error:', error);
        this.isAnalyzingRigorForChapterId.set(null);
      }
    });
  }
  resetViva() {
    this.vivaQuestions.set(null);
    this.vivaEvaluationResult.set(null);
    this.vivaUserDefenseInput.set('');
  }
  submitVivaDefense(c: ChapterItem) {
    const defense = this.vivaUserDefenseInput().trim();
    if (!c || !defense) return;

    this.isEvaluatingDefense.set(true);
    this.vivaErrorMessage.set(null);

    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'ai_defense_preparation',
      inputText: [
        'ناونیشانی بەش: ' + (c.title || 'بەش'),
        'دەقی بەش: ' + (c.content || '').slice(0, 12000),
        'وەڵامی بەرگریی خوێندکار: ' + defense
      ].join('\n'),
      options: {
        language: 'ckb',
        tone: 'formal_academic',
        academicLevel: 'ماستەر'
      }
    }).subscribe({
      next: result => {
        this.vivaEvaluationResult.set({
          status: 'reviewed-not-scored',
          score: null,
          isPassed: null,
          feedbackText: typeof result?.output === 'string'
            ? result.output
            : JSON.stringify(result?.output || {})
        });
        this.isEvaluatingDefense.set(false);
      },
      error: error => {
        console.error('Viva defense evaluation error:', error);
        this.vivaErrorMessage.set('هەڵسەنگاندنی وەڵامی Viva سەرکەوتوو نەبوو.');
        this.isEvaluatingDefense.set(false);
      }
    });
  }

  evaluateToulminRigor(chapter: any) {
    if (!chapter) return;
    this.toulminService.analyzeText(chapter.content || '', chapter.title || 'تێز').subscribe();
  }

  evaluateHedgingStance(chapter: any) {
    if (!chapter) return;
    this.hedgingService.evaluateText(chapter.content || '');
  }

  applyAutoHedging(chapter: any) {
    if (!chapter || !chapter.content) return;
    const hedged = this.hedgingService.applyAutoHedging(chapter.content);
    chapter.content = hedged;
    if (chapter.id != null) {
      this.editorService.updateChapterContent(chapter.id, hedged, 'پەیڕەوکردنی زمانی ئیحتیاتی ئەکادیمی');
    }
  }

  selectUniversityPreset(presetId: string) {
    this.lexiconService.activeUniversityPreset.set(presetId);
  }
}
