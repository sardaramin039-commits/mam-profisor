import { ChangeDetectionStrategy, Component } from '@angular/core';
import { APP_VIEW_IMPORTS } from './app-view-imports';
import { AppTemplateSectionBase } from './app-template-section-base';
const VIEW_IMPORTS = [...APP_VIEW_IMPORTS];

@Component({selector:'app-workspace-header',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/workspace-header.component.html'})
export class AppWorkspaceHeaderComponent extends AppTemplateSectionBase {}

@Component({selector:'app-workspace-top',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/workspace-top.component.html'})
export class AppWorkspaceTopComponent extends AppTemplateSectionBase {}

@Component({selector:'app-workspace-analytics',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/workspace-analytics.component.html'})
export class AppWorkspaceAnalyticsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one-config',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-one-config.component.html'})
export class AppWindowOneConfigComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one-custom',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-one-custom.component.html'})
export class AppWindowOneCustomComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one-structure',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-one-structure.component.html'})
export class AppWindowOneStructureComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one-compare',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-one-compare.component.html'})
export class AppWindowOneCompareComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one-rules',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-one-rules.component.html'})
export class AppWindowOneRulesComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-one',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppWindowOneConfigComponent,AppWindowOneCustomComponent,AppWindowOneStructureComponent,AppWindowOneCompareComponent,AppWindowOneRulesComponent],templateUrl:'./app-sections/window-one.component.html'})
export class AppWindowOneComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-two-editor',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-two-editor.component.html'})
export class AppWindowTwoEditorComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-two-rag-citations',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-two-rag-citations.component.html'})
export class AppWindowTwoRagCitationsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-two-diagnostics',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/window-two-diagnostics.component.html'})
export class AppWindowTwoDiagnosticsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-window-two',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppWindowTwoEditorComponent,AppWindowTwoRagCitationsComponent,AppWindowTwoDiagnosticsComponent],templateUrl:'./app-sections/window-two.component.html'})
export class AppWindowTwoComponent extends AppTemplateSectionBase {}

@Component({selector:'app-global-search',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/global-search.component.html'})
export class AppGlobalSearchComponent extends AppTemplateSectionBase {}

@Component({selector:'app-academic-tools-citation',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/academic-tools-citation.component.html'})
export class AppAcademicToolsCitationComponent extends AppTemplateSectionBase {}

@Component({selector:'app-academic-tools-glossary',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/academic-tools-glossary.component.html'})
export class AppAcademicToolsGlossaryComponent extends AppTemplateSectionBase {}

@Component({selector:'app-academic-tools-faq',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/academic-tools-faq.component.html'})
export class AppAcademicToolsFaqComponent extends AppTemplateSectionBase {}

@Component({selector:'app-academic-tools',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppAcademicToolsCitationComponent,AppAcademicToolsGlossaryComponent,AppAcademicToolsFaqComponent],templateUrl:'./app-sections/academic-tools.component.html'})
export class AppAcademicToolsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-workspace-main',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppWorkspaceTopComponent,AppWorkspaceAnalyticsComponent,AppWindowOneComponent,AppWindowTwoComponent,AppGlobalSearchComponent,AppAcademicToolsComponent],templateUrl:'./app-sections/workspace-main.component.html'})
export class AppWorkspaceMainComponent extends AppTemplateSectionBase {}

@Component({selector:'app-workspace-bottom-bar',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/workspace-bottom-bar.component.html'})
export class AppWorkspaceBottomBarComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-compare',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-compare.component.html'})
export class AppViewedChapterCompareComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-editor-security',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-editor-security.component.html'})
export class AppViewedChapterEditorSecurityComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-integrity',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-integrity.component.html'})
export class AppViewedChapterIntegrityComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-context',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-context.component.html'})
export class AppViewedChapterContextComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-rigor',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-rigor.component.html'})
export class AppViewedChapterRigorComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-viva',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-viva.component.html'})
export class AppViewedChapterVivaComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-additions',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-additions.component.html'})
export class AppViewedChapterAdditionsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-consultation',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-consultation.component.html'})
export class AppViewedChapterConsultationComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-methodology',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-methodology.component.html'})
export class AppViewedChapterMethodologyComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-stats',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-stats.component.html'})
export class AppViewedChapterStatsComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-citation-export',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-citation-export.component.html'})
export class AppViewedChapterCitationExportComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-plagiarism',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-plagiarism.component.html'})
export class AppViewedChapterPlagiarismComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-python',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-python.component.html'})
export class AppViewedChapterPythonComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-elite',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-elite.component.html'})
export class AppViewedChapterEliteComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-harvard',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:VIEW_IMPORTS,templateUrl:'./app-sections/viewed-chapter-harvard.component.html'})
export class AppViewedChapterHarvardComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-advanced',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppViewedChapterMethodologyComponent,AppViewedChapterStatsComponent,AppViewedChapterCitationExportComponent,AppViewedChapterPlagiarismComponent,AppViewedChapterPythonComponent,AppViewedChapterEliteComponent,AppViewedChapterHarvardComponent],templateUrl:'./app-sections/viewed-chapter-advanced.component.html'})
export class AppViewedChapterAdvancedComponent extends AppTemplateSectionBase {}

@Component({selector:'app-viewed-chapter-modal',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[...VIEW_IMPORTS,AppViewedChapterCompareComponent,AppViewedChapterEditorSecurityComponent,AppViewedChapterIntegrityComponent,AppViewedChapterContextComponent,AppViewedChapterRigorComponent,AppViewedChapterVivaComponent,AppViewedChapterAdditionsComponent,AppViewedChapterConsultationComponent,AppViewedChapterAdvancedComponent],templateUrl:'./app-sections/viewed-chapter-modal.component.html'})
export class AppViewedChapterModalComponent extends AppTemplateSectionBase {}

export const APP_TEMPLATE_SECTION_IMPORTS = [
  AppWorkspaceHeaderComponent,
  AppWorkspaceMainComponent,
  AppWorkspaceBottomBarComponent,
  AppViewedChapterModalComponent,
] as const;
