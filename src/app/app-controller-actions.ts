import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import { FormalityToneConfig } from './features/editor/components/formality-tone-control.component';
import { TextLineageNode } from './features/editor/components/text-lineage-connector.component';
import { AppAcademicActions } from './helpers/app-academic-actions';
import { buildAcademicThesisOutline } from './helpers/outline-structure';
import { calculateWordValidationStatus } from './helpers/word-validation.helper';
import { ChapterItemModel as ChapterItem } from './domain/models';
import { AppControllerBase } from './app-controller-base';

export abstract class AppControllerActions extends AppControllerBase {
  private http = inject(HttpClient);

  applyGeneratedTextToChapter(text: string, mode: 'replace' | 'append' = 'append'): void {
    const chapter = this.activeChapter();
    const clean = (text || '').trim();
    if (!chapter || !clean) {
      this.toastService.showToast('ئاگاداری', 'بەشێکی چالاک و دەقی دروست پێویستە.', 'warning', 3000);
      return;
    }
    const next = mode === 'replace' ? clean : [chapter.content?.trim(), clean].filter(Boolean).join('\n\n');
    this.editorService.updateChapterContent(chapter.id, next, mode === 'replace' ? 'جێگرتنەوەی دەقی بەش' : 'زیادکردنی دەق بە کۆتایی بەش');
    this.toastService.showToast('سەرکەوتوو بوو', 'گۆڕانکارییەکە بۆ دەستنووس نێردرا؛ پاشەکەوتکردن بە خزمەتگوزاری دەستنووس بەڕێوەدەبرێت.', 'success', 3000);
  }

  updateActiveChapterContent(newContent: string) {
    const activeId = this.editorService.activeChapterId();
    if (activeId !== null) {
      this.editorService.updateChapterContent(activeId, newContent, 'چاکسازیی ڕێنوسی سۆرانی');
    } else if (this.editorService.chapters().length > 0) {
      this.editorService.updateChapterContent(this.editorService.chapters()[0].id, newContent, 'چاکسازیی ڕێنوسی سۆرانی');
    }
  }

  appendDictatedSpeechText(text: string): void {
    const active = this.activeChapter();
    if (!active) return;
    this.editorService.updateChapterContent(active.id, (active.content || '') + text, 'تۆمارکردنی دەنگی زانستی');
  }

  onInsertAcademicAddition(text: string): void {
    const active = this.activeChapter();
    if (!active) {
      this.toastService.showToast('ئاگاداری', 'تکایە سەرەتا بەشێک دەستنیشان بکە بۆ تێکردنی بڕگەکە.', 'warning', 3000);
      return;
    }
    this.editorService.updateChapterContent(active.id, (active.content || '') + text, 'زیادکردنی بڕگەی ئەکادیمی');
    this.toastService.showToast('سەرکەوتوو بوو', 'بڕگەی ئەکادیمی بە سەرکەوتوویی تێکەڵی دەقی بەشەکە کرا.', 'success', 3000);
  }

  onFormalityConfigChanged(config: FormalityToneConfig): void {
    this.selectedFormalityConfig.set(config);
  }

  onLineageParentChanged(node: TextLineageNode | null): void {
    this.selectedLineageParent.set(node);
  }

  getActiveThesisText(): string {
    const activeId = this.editorService.activeChapterId();
    if (activeId !== null) {
      return this.editorService.chapters().find(c => c.id === activeId)?.content || '';
    }
    return this.editorService.chapters()[0]?.content || '';
  }

  onDriveFileImported(file: { name: string; content: string }) {
    this.updateActiveChapterContent(file.content);
    this.mainTab.set('editor');
  }

  getWordProgressPct(chapter: ChapterItem | null): number {
    if (!chapter) return 0;
    const target = this.getChapterTarget(chapter);
    if (target <= 0) return 0;
    const current = chapter.wordCount || (chapter.content ? chapter.content.trim().split(/\s+/).filter(Boolean).length : 0);
    return Math.min(200, Math.round((current / target) * 100));
  }

  getWordValidationStatus(chapter: ChapterItem | null) {
    return calculateWordValidationStatus(chapter, (ch) => this.getChapterTarget(ch));
  }

  fixAllChaptersSpelling(): void {
    const msg = this.editorController.fixAllChaptersSpelling(this.chapters(), (updated) => this.chapters.set(updated));
    if (msg) {
      this.searchFeedbackMessage.set(msg);
      setTimeout(() => this.searchFeedbackMessage.set(null), 5000);
    }
  }

  fixChapterSpelling(chapterId: number): void {
    const msg = this.editorController.fixSingleChapterSpelling(chapterId, this.chapters(), (updated) => this.chapters.set(updated));
    if (msg) {
      this.searchFeedbackMessage.set(msg);
      setTimeout(() => this.searchFeedbackMessage.set(null), 5000);
    }
  }

  updateChapterTargetWords(chapterId: number, targetWords: number) {
    if (!targetWords || targetWords <= 0) return;
    const list = [...this.chapters()];
    const idx = list.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
      list[idx].customTargetWords = targetWords;
      this.chapters.set(list);
    }
  }

  applyMarginPreset(preset: '5%' | '10%' | '15%' | '1page' | '2pages') {
    const target = this.refineForm.get('targetPages')?.value || 10;
    const res = AppAcademicActions.applyMarginPreset(target, preset);
    this.refineForm.patchValue({ sizeMode: 'range', minPages: res.minPages, maxPages: res.maxPages });
  }

  getChapterHeaders(content: string) {
    return AppAcademicActions.getChapterHeaders(content);
  }

  applyTextFormatting(textarea: HTMLTextAreaElement, format: 'bold' | 'italic' | 'sub' | 'sup') {
    textarea.value = AppAcademicActions.formatTextSelection(textarea, format);
  }

  getKurdishNumberStr(index: number): string {
    return this.appUiActions.getKurdishNumberStr(index);
  }

  getSnippet(text: string, query: string, maxLength = 160): string {
    return this.appUiActions.getSnippet(text, query, maxLength);
  }

  getWordCountOfText(text: string): number { return this.appUiActions.getWordCountOfText(text); }
  getCharCountNoSpaces(text: string): number { return this.appUiActions.getCharCountNoSpaces(text); }
  getParagraphCount(text: string): number { return this.appUiActions.getParagraphCount(text); }
  getReadingTimeMinutes(text: string): number { return this.appUiActions.getReadingTimeMinutes(text); }
  isWordFrequencyOpen() { return this.appUiActions.isWordFrequencyOpen(); }
  toggleWordFrequency() { this.appUiActions.toggleWordFrequency(); }
  excludeStopWordsFilter() { return this.appUiActions.excludeStopWordsFilter(); }
  toggleStopWordsFilter() { this.appUiActions.toggleStopWordsFilter(); }
  getKurdishWordFrequency(text: string) { return this.appUiActions.getKurdishWordFrequency(text); }
  getKurdishReadability(text: string) { return this.appUiActions.getKurdishReadability(text); }

  saveStateLocally(): void {
    this.searchController.showFeedback('ڕەشنووسی تێزەکە بە سەرکەوتوویی لە سێرڤەری لۆکاڵیدا تۆمارکرا.');
  }

  clearEditor() {
    this.chapters.set([]);
    this.viewedChapter.set(null);
  }

  openNewBlankThesisModal(): void {
    const curTitle = this.refineForm?.get('title')?.value || 'تێزی ئەکادیمی نوێ';
    this.newThesisTitleInput.set(curTitle === 'تێزی ئەکادیمی' ? 'تێزی ئەکادیمی نوێ' : curTitle);
    this.isNewBlankThesisModalOpen.set(true);
  }

  cancelNewBlankThesis(): void {
    this.isNewBlankThesisModalOpen.set(false);
  }

  confirmNewBlankThesis(): void {
    const title = this.newThesisTitleInput().trim() || 'تێزی ئەکادیمی نوێ';
    const degree = this.newThesisDegreeInput();
    const structure = this.newThesisStructureInput();
    this.createNewBlankThesis(title, degree, structure);
    this.isNewBlankThesisModalOpen.set(false);
  }

  createNewBlankThesis(customTitle = 'تێزی ئەکادیمی نوێ', level: 'bachelor' | 'master' | 'phd' = 'master', structure: 'humanities' | 'empirical' = 'humanities'): void {
    const pages = level === 'phd' ? 80 : (level === 'master' ? 40 : 15);
    const blankOutline = buildAcademicThesisOutline({
      title: customTitle,
      academicLevel: level,
      thesisStructureType: structure,
      targetPages: pages,
      includeDedication: true,
      includeIntro: true,
      includeTOC: true,
      includeConclusion: true,
      includeRecommendations: true,
      includeReferences: true
    });
    this.editorService.setChapters(blankOutline);
    this.chapters.set(blankOutline);
    if (blankOutline.length > 0) {
      this.editorService.activeChapterId.set(blankOutline[0].id);
      this.viewedChapter.set(blankOutline[0]);
    }
    this.refineForm.patchValue({
      title: customTitle,
      academicLevel: level,
      thesisStructureType: structure,
      size: pages,
      targetPages: pages
    });
    this.toastService.showToast('پڕۆژەی نوێی بەتاڵ', 'تێزێکی نوێی خاوێن و بێ داتای دیمۆ دەستیپێکرد.', 'success', 3500);
  }

  toggleAcademicDarkMode() {
    this.academicDarkMode.update(v => !v);
  }

  isManuscriptCompleted(item: any): boolean {
    return !!(item && item.chapters && item.chapters.length > 0 && item.chapters.every((c: any) => c.content && c.content.length > 100));
  }

  getChapterComplexity(c: ChapterItem) {
    return (c.content || '').length > 2000 ? 'بەرز' : 'مامناوەند';
  }

  copyToClipboard(text: string) {
    if (text) navigator.clipboard.writeText(text);
  }

  loginWithGoogle() {
    this.data.loginWithGoogle().catch((err: any) => {
      this.errorStr.set(err?.message || 'شیکردنەوە نەبوو لە هەوردا');
    });
  }

  logout() {
    this.data.logout().catch((err: any) => {
      this.errorStr.set(err?.message || 'کێشە ڕوویدا لە دەرچوون');
    });
  }

  async restoreLocalDraft() {
    const draft = await this.appStateFacade.loadDraftFromLocalStorage();
    if (draft) {
      if (draft.form) {
        this.refineForm.patchValue(draft.form);
      }
      if (draft.chapters && draft.chapters.length) {
        this.chapters.set(draft.chapters);
        this.editorService.setChapters(draft.chapters);
      }
      this.toastService.showSuccess('ڕەشنووس گەڕێندرایەوە', 'ڕەشنووسە لۆکاڵییەکەت بە سەرکەوتوویی لە مێمۆریەوە بارکرایەوە.');
    }
    this.hasLocalDraft.set(false);
  }

  discardLocalDraft() {
    this.appStateFacade.clearLocalDraft();
    this.hasLocalDraft.set(false);
    this.toastService.showInfo('ڕەشنووس سڕایەوە', 'ڕەشنووسە لۆکاڵییە پاشەکەوتکراوەکە بە تەواوی ڕەشکرایەوە.');
  }

  calibrateAuthorVoice() { this.dashboardState.calibrateAuthorVoice(); }
  selectPagePreset(pages: number) { this.refineForm.patchValue({ targetPages: pages, size: pages }); }
  onNumericInput(event: Event, field: string) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.refineForm.patchValue({ [field]: val });
  }
  toggleCustomFeature(feat: string) {
    const val = !this.refineForm.get(feat)?.value;
    this.refineForm.patchValue({ [feat]: val });
    if (feat === 'customSourcesOn' || feat === 'fieldWorkOn') {
      this.chapters.update(list => list.map(c => ({ ...c, [feat]: val })));
      if (this.viewedChapter()) this.viewedChapter.update(c => c ? ({ ...c, [feat]: val }) : c);
    }
    const names: Record<string, string> = { customSourcesOn: 'سەرچاوەی تایبەت', customTOCOn: 'پێڕستی تایبەت', fieldWorkOn: 'کاری مەیدانی' };
    const title = names[feat] || feat;
    if (val) this.toastService.showSuccess(`تایبەتمەندی ${title} چالاک کرا (ON)`, `ئێستا بژاردەی ${title} بە ١٠٠٪ کاریگەرە.`);
    else this.toastService.showInfo(`تایبەتمەندی ${title} ناچالاک کرا (OFF)`, `بژاردەی ${title} لەسەر دۆخی ناچالاک دانرا.`);
  }
  onCustomSourcesInput(event: Event, element: HTMLElement) {
    const val = (event.target as HTMLTextAreaElement)?.value || '';
    if (val.trim().length > 3) {
      this.bridge.isQuickPreviewVisible.set(true);
      this.bridge.quickPreviewSuggestions.set([
        { author: 'ئەمین، سەردار', title: 'فەلسەفەی زمان و گوتاری کوردی', year: 2024, publisher: 'چاپخانەی زانکۆ' },
        { author: 'مستەفا، کەمال', title: 'میتۆدۆلۆژیای توێژینەوەی ئەکادیمی', year: 2023, publisher: 'سلێمانی' },
        { author: 'حەمە، د. ڕەئوف', title: 'زانستی مێژوو و ناسینناسی', year: 2022, publisher: 'هەولێر' }
      ]);
    } else {
      this.bridge.isQuickPreviewVisible.set(false);
    }
  }
  onCustomSourcesClick(element: HTMLElement) {
    const val = (element as HTMLTextAreaElement)?.value || '';
    if (val.trim().length > 3) {
      this.bridge.isQuickPreviewVisible.set(true);
    }
  }
  addCustomRule(input: HTMLInputElement) {
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return;
    const newRule = {
      id: 'custom_' + Date.now(),
      icon: 'rule',
      title: text.length > 35 ? text.slice(0, 35) + '...' : text,
      desc: text,
      active: true,
      enabled: true,
      isCustom: true
    };
    this.bridge.academicRules.update(list => [newRule, ...list]);
    input.value = '';
    this.toastService.showSuccess('مەرجی تایبەت زیادکرا', `مەرجی «${newRule.title}» بە سەرکەوتوویی زیادکرا و چالاک کرا.`);
  }
  loadHistoryItem(item: any) {
    if (!item) return;
    if (item.title) this.refineForm.patchValue({ title: item.title });
    if (item.chapters?.length) {
      this.chapters.set(item.chapters);
      this.editorService.setChapters(item.chapters);
    }
    this.toastService.showSuccess('تێز بارکرا', `تێزی "${item.title || 'بێ ناونیشان'}" بە سەرکەوتوویی بارکرایەوە ناو سەرنووسەر.`);
  }
  deleteHistoryItem(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.data.deleteHistoryItem(id);
    this.toastService.showWarning('تێز سڕایەوە', 'توێژینەوەکە لە مێژووی هەورەکە سڕایەوە.');
  }
  openChapterPreview(c: ChapterItem) { this.viewedChapter.set(c); }
  toggleChapterLock(chapterId: number) {
    this.editorService.toggleLock(chapterId);
    this.chapters.set(this.editorService.chapters());
    const target = this.chapters().find(c => c.id === chapterId);
    if (this.viewedChapter()?.id === chapterId && target) this.viewedChapter.set(target);
    if (target?.isLocked) this.toastService.showWarning('بەشەکە قفڵکرا (ON)', `بەشی «${target.title}» لە دەستکاری پارێزرا.`);
    else this.toastService.showSuccess('قفڵەکە کرایەوە (OFF)', `بەشی «${target?.title}» بۆ نووسین ئامادەیە.`);
  }
  insertMythologicalSynthesisToChapter(c: ChapterItem, myth: any) { this.dashboardState.insertMythologicalSynthesisToChapter(c, myth); }
  toggleChunkUsage(id: string) { this.dashboardState.toggleChunkUsage(id); }
  verifyChunkSource(chunk: any) { this.dashboardState.verifyChunkSource(chunk); }

  runCognitiveCopilot() { this.bridge.runCognitiveCopilot(); }
  getChapterById(id: any) { return this.bridge.getChapterById(id); }
  applyCockpitAccept(c: any) { this.bridge.applyCockpitAccept(c); }
  applyCockpitCritic(c: any) { this.bridge.applyCockpitCritic(c); }
  applyCockpitManual(c: any) { this.bridge.applyCockpitManual(c); }
  applyCopilotToChapter(c: any) { this.bridge.applyCopilotToChapter(c); }
  generateTitleAndSummary(topic: string) { this.bridge.generateTitleAndSummary(topic); }
  applyGeneratedTitle(t: string) { if (t) this.refineForm.patchValue({ title: t }); }
  copyTitleSummary(summary: string) { this.bridge.copyTitleSummary(summary); }
  setPageSizeMode(mode: string) { this.bridge.setPageSizeMode(mode); }
  closeQuickPreview() { this.bridge.closeQuickPreview(); }
  applySourceSuggestion(s: any) { this.bridge.applySourceSuggestion(s); }
  toggleAcademicSection(sec: string) {
    this.bridge.toggleAcademicSection(sec);
    const cur = !!this.refineForm.get(sec)?.value;
    const names: Record<string, string> = {
      includeDedication: 'پێشکەشە',
      includeIntro: 'پێشەکی',
      includeTOC: 'پێڕست',
      includeConclusion: 'ئەنجام',
      includeRecommendations: 'ڕاسپاردەکان',
      includeReferences: 'سەرچاوەکان'
    };
    const title = names[sec] || sec;
    this.toastService.showToast('دۆخی پێکهاتە', `بڕگەی «${title}» ${cur ? 'چالاک کرا (ON)' : 'ناچالاک کرا (OFF)'}`, cur ? 'success' : 'info', 2500);
  }
  updateRagModel(m: string) { this.bridge.updateRagModel(m); }
  updateRagLimit(l: number) { this.bridge.updateRagLimit(l); }
  toggleRole(role: string) { this.bridge.toggleRole(role); }
  toggleDialect(d: string) { this.bridge.toggleDialect(d); }
  onDragOver(e: Event, type: string) { this.bridge.onDragOver(e, type); }
  onDragLeave(e: Event, type: string) { this.bridge.onDragLeave(e, type); }
  onFileDrop(e: DragEvent, type: string) { this.bridge.onFileDrop(e, type); }
  onFileSelected(e: Event, type: string) { this.bridge.onFileSelected(e, type); }
  onSendToSecondWindow() {
    const val = this.refineForm.value;
    const title = (val.title || '').trim();
    if (!title) {
      this.toastService.showToast('ئاگاداری', 'تکایە سەرەتا ناونیشانی تێز یان توێژینەوەکەت بنووسە.', 'warning', 3500);
      return;
    }
    const newChapters = buildAcademicThesisOutline({
      title,
      discipline: val.discipline,
      writingType: val.writingType,
      academicLevel: val.academicLevel,
      targetPages: val.targetPages || val.size || 10,
      includeDedication: val.includeDedication,
      includeIntro: val.includeIntro,
      includeTOC: val.includeTOC,
      includeConclusion: val.includeConclusion,
      includeRecommendations: val.includeRecommendations,
      includeReferences: val.includeReferences,
      customSourcesOn: val.customSourcesOn,
      customSourcesText: val.customSourcesText,
      customTOCOn: val.customTOCOn,
      customTOCText: val.customTOCText,
      fieldWorkOn: val.fieldWorkOn,
      fieldWorkText: val.fieldWorkText,
      thesisStructureType: val.thesisStructureType
    });
    this.chapters.set(newChapters);
    this.editorService.setChapters(newChapters);
    if (newChapters.length > 0) {
      this.editorService.activeChapterId.set(newChapters[0].id);
    }
    this.activeSubTab.set('editor');
    this.toastService.showSuccess('پێکهاتەی بەشەکان ڕێکخرا', `بە سەرکەوتوویی ${newChapters.length} بەشی ئەکادیمی بۆ ناونیشانی «${title}» لە پەنجەرەی دووەم جێگیرکران.`);
    // Scroll window 2 into view gracefully
    if (typeof window !== 'undefined') {
      const w2 = document.getElementById('window-2-section');
      if (w2) {
        w2.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  activateAllAcademicRules() {
    this.bridge.activateAllAcademicRules();
    this.toastService.showSuccess('هەموو مەرجەکان کارا کران (ON)', 'سەرجەم ڕێسا زانستییەکان بە ١٠٠٪ چالاک کران.');
  }
  deactivateAllAcademicRules() {
    this.bridge.deactivateAllAcademicRules();
    this.toastService.showInfo('هەموو مەرجەکان ناچالاک کران (OFF)', 'سەرجەم ڕێسا زانستییەکان ناچالاک کران.');
  }
  triggerComparison(r: any) { this.bridge.triggerComparison(r); } searchLoadHistory(r: any) { this.bridge.searchLoadHistory(r); } onRegisterVerifiedSource() { this.bridge.onRegisterVerifiedSource(); }
  expandGlossaryTerm(entry: any) { this.bridge.expandGlossaryTerm(entry); } applyGlossaryRealtimeFix(orig: string, fix: string) { this.bridge.applyGlossaryRealtimeFix(orig, fix); }
  toggleAcademicRule(id: string) {
    this.bridge.toggleAcademicRule(id);
    const rule = this.bridge.academicRules().find(r => r.id === id);
    const active = rule?.active;
    this.toastService.showToast('ڕێسای ئەکادیمی', `مەرجی «${rule?.title || id}» ${active ? 'چالاک کرا (ON)' : 'ناچالاک کرا (OFF)'}`, active ? 'success' : 'info', 2500);
  }
  removeCustomRule(id: string) { this.bridge.removeCustomRule(id); }
  onGlobalSearchInput(e: Event) { this.bridge.onGlobalSearchInput(e); }
  searchOpenChapter(r: any) { this.bridge.searchOpenChapter(r); }
  searchUseGlossary(r: any) { this.bridge.searchUseGlossary(r); }
  searchCopyGlossary(r: any) { this.bridge.searchCopyGlossary(r); }
  clearComparison() { this.bridge.clearComparison(); }
  getOriginalComparisonText(r: any) { return this.bridge.getOriginalComparisonText(r); }
  copyAllSearchResults() { this.bridge.copyAllSearchResults(); }
  sendFilteredReportToEmail() { this.bridge.sendFilteredReportToEmail(); }
  runRecentSearch(t: string) { this.bridge.runRecentSearch(t); }
  onBuildCitation() { this.bridge.onBuildCitation(); }
  importPdf4KurdBookToForm(b: any) { this.bridge.importPdf4KurdBookToForm(b); }
  importPdf4KurdBookToVerified(b: any) { this.bridge.importPdf4KurdBookToVerified(b); }
  deleteVerifiedSource(id: string) { this.bridge.deleteVerifiedSource(id); }
  injectAcademicSourceCitation(source: any, mode?: any) { this.bridge.injectAcademicSourceCitation(source, mode); }
  onSearchChange(e: Event) { this.bridge.onSearchChange(e); }
  onFilterCategory(cat: string) { this.bridge.onFilterCategory(cat); }
  useGlossaryTerm(entry: any) { this.bridge.useGlossaryTerm(entry); }
  toggleFaq(idx: number) { this.bridge.toggleFaq(idx); }
  reviewStructure(): void { this.bottomDockActions.reviewStructure(this.activeChapter(), (v) => this.isReviewingStructure.set(v)); }
  autoWrite(): void { this.bottomDockActions.autoWrite(this.activeChapter(), this.copilotInputText(), this.manuscriptTitle(), (v) => this.isWritingProgress.set(v)); }
  autoHumanize(): void { this.bottomDockActions.autoHumanize(this.activeChapter(), this.copilotInputText(), (v) => this.isHumanizingProgress.set(v)); }
  saveAll(): void { this.bottomDockActions.saveAll(this.refineForm.get('discipline')?.value || 'زانستە گشتییەکان', this.refineForm.get('academicLevel')?.value || 'ماستەر', this.manuscriptTitle(), (v) => this.isExportingWord.set(v)); }
  closeChapterPreview() { this.viewedChapter.set(null); }
  updateCompareLeftText(v: string) { this.bridge.updateCompareLeftText(v); }
  updateCompareRightText(v: string) { this.bridge.updateCompareRightText(v); }
  insertAcademicHeading(textarea: HTMLTextAreaElement, level: string) { this.bridge.insertAcademicHeading(textarea, level); }
  updateChapterContent(id: number, content: string, msg?: string) {
    this.editorService.updateChapterContent(id, content, msg || 'تۆمارکردنی گۆڕانکاری');
    this.editorSyncFeedback.scheduleSync(this.editorService.chapters(), this.refineForm.value, this.manuscriptTitle());
  }
  forceManualSyncNow() {
    this.editorSyncFeedback.forceSyncNow(this.editorService.chapters(), this.refineForm.value, this.manuscriptTitle());
  }
  applySoranispellFixInViewedChapter() { this.bridge.applySoranispellFixInViewedChapter(); }
  encryptChapterInVault(c: any, pwd: any) { this.bridge.encryptChapterInVault(c, pwd); }
  decryptChapterInVault(c: any, pwd: any) { this.bridge.decryptChapterInVault(c, pwd); }
  createManualSnapshot(c: any) { this.bridge.createManualSnapshot(c); }
  verifyChapterIntegrityAgainstLastSnapshot(c: any) { return this.bridge.verifyChapterIntegrityAgainstLastSnapshot(c); }
  rollbackToSnapshot(c: any, sn: any) { this.bridge.rollbackToSnapshot(c, sn); }
  scrollToSection(text: string, textarea: any) { this.bridge.scrollToSection(text, textarea); }
  verifyCitationsLive(c: any) { this.bridge.verifyCitationsLive(c); }
  runAcademicConsultation() { this.bridge.runAcademicConsultation(); }
  appendConsultationToActiveChapter(c: any, text: string = '') { this.bridge.appendConsultationToActiveChapter(c, text); }
  auditAIIntegrity(chapter: any) { this.bridge.auditAIIntegrity(chapter); }
  summarizeThesisContext() { this.bridge.summarizeThesisContext(); }
  anonymizeActiveChapterData(chapter: any) { this.bridge.anonymizeActiveChapterData(chapter); }
  recalibrateWithIntuition(chapter: any) { this.bridge.recalibrateWithIntuition(chapter); }
  generateVivaQuestions(chapter: any) { this.bridge.generateVivaQuestions(chapter); }
  generateAcademicAdditions(chapter: any) { this.bridge.generateAcademicAdditions(chapter); }
  appendAdditionsToChapter(chapter: any, addition: any) { this.bridge.appendAdditionsToChapter(chapter, addition); }
  appendMethodologyLayoutToChapter(chapter: any) { this.bridge.appendMethodologyLayoutToChapter(chapter); }
  analyzeSoraniPhoneticsAndDialect(chapter: any) { this.bridge.analyzeSoraniPhoneticsAndDialect(chapter); }
  constructMethodologyAndHypotheses(chapter: any) { this.bridge.constructMethodologyAndHypotheses(chapter); }
  appendStatsExplanationToChapter(chapter: any) { this.bridge.appendStatsExplanationToChapter(chapter); }
  simulateEmpiricalStats(chapter: any) { this.bridge.simulateEmpiricalStats(chapter); }
  applyHarvardActionableImprovement(c: any, item?: any) { this.bridge.applyHarvardActionableImprovement(c, item); }
  runHarvardAcademicReview(c: any) { this.bridge.runHarvardAcademicReview(c); }
  appendLiteratureGapParagraphToChapter(c: any, text?: any) { this.bridge.appendLiteratureGapParagraphToChapter(c, text); }
  analyzeLiteratureGap(c: any) { this.bridge.analyzeLiteratureGap(c); }
  applyEliteCoAuthorMitigatedText(c: any) { this.bridge.applyEliteCoAuthorMitigatedText(c); }
  analyzeEliteCoAuthorHub(c: any) { this.bridge.analyzeEliteCoAuthorHub(c); }
  applyParaphrasedAlternativeToChapter(c: any, alt?: any) { this.bridge.applyParaphrasedAlternativeToChapter(c, alt); }
  applyParaphrasedText(c: any) { this.bridge.applyParaphrasedText(c); }
  runAcademicParaphrase() { this.bridge.runAcademicParaphrase(); }
  writeSingleChapter(id: number) { this.bridge.writeSingleChapter(id); }
  writeAllChapters() { this.bridge.writeAllChapters(); }
  generateMultiStyleCitation() { this.bridge.generateMultiStyleCitation(); }
  checkChapterPlagiarism(chapter: any) { this.bridge.checkChapterPlagiarism(chapter); }
  exportSandboxPDF() { this.bridge.exportSandboxPDF(); }
  appendPythonSandboxOutputToChapter(chapter: any) { this.bridge.appendPythonSandboxOutputToChapter(chapter); }
  executePythonDatasetInterpreter(chapter: any) { this.bridge.executePythonDatasetInterpreter(chapter); }
  copyLatexCode(code: string) { this.bridge.copyLatexCode(code); }
  generateEliteAcademicAssessment(chapter: any) { this.bridge.generateEliteAcademicAssessment(chapter); }
  copyCitationsToClipboard(txt: string) { this.bridge.copyCitationsToClipboard(txt); }
  appendCitationToChapter(chapter: any) { this.bridge.appendCitationToChapter(chapter); }
  analyzeChapterRigor(c: any) { this.bridge.analyzeChapterRigor(c); }
  resetViva() { this.bridge.resetViva(); }
  submitVivaDefense(c: any) { this.bridge.submitVivaDefense(c); }
}