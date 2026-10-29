import { CommonModule } from '@angular/common';
import { DashboardHeaderComponent } from './features/dashboard/dashboard-header.component';
import { SplashScreenComponent } from './features/splash/splash-screen.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SearchEngineComponent } from './features/search-engine/search-engine';
import { AcademicPlagiarismCheckerComponent, AcademicPlagiarismCheckerComponent as PlagiarismComponent } from './features/academic-suite/academic-plagiarism-checker.component';
import { PythonSandboxComponent } from './features/python-sandbox/python-sandbox';
import { HarvardReviewComponent } from './features/harvard-review/harvard-review';
import { EliteReviewComponent } from './features/elite-review/elite-review';
import { ResearchFeatureComponent } from './features/rag-research/research.component';
import { GlossaryComponent } from './features/glossary/glossary';
import { ExportWordComponent } from './features/export-word/export-word';
import { LatexComponent } from './features/latex/latex';
import { CitationFeatureComponent } from './features/citation-manager/citation.component';
import { ThesisDefenseSimulatorComponent, ThesisDefenseSimulatorComponent as VivaSimulationComponent } from './features/academic-suite/thesis-defense-simulator.component';
import { LiteratureGapComponent } from './features/literature-gap/literature-gap';
import { AdvancedResearchHubComponent } from './features/advanced-research/advanced-research.component';
import { SystemMaintenancePanelComponent } from './core/components/system-maintenance-panel.component';
import { SourceVerificationComponent } from './features/citation-manager/source-verification.component';
import { GoogleDriveIntegrationComponent } from './features/google-drive/google-drive-integration';
import { GmailIntegrationComponent } from './features/gmail/gmail-integration';
import { GoogleKeepIntegrationComponent } from './features/google-keep/google-keep-integration';
import { GoogleSheetsIntegrationComponent } from './features/google-sheets/google-sheets-integration';
import { GoogleTasksIntegrationComponent } from './features/google-tasks/google-tasks-integration';
import { AiToolsSuiteComponent } from './features/ai-tools-suite/ai-tools-suite';
import { SplitViewEditorComponent } from './features/editor/components/split-view-editor.component';
import { SpeechDictationComponent } from './features/editor/components/speech-dictation.component';
import { D3ChordDiagramComponent } from './features/d3-charts/chord-diagram.component';
import { FormalityToneControlComponent } from './features/editor/components/formality-tone-control.component';
import { TextLineageConnectorComponent } from './features/editor/components/text-lineage-connector.component';
import { AcademicRigorBannerComponent } from './features/editor/components/academic-rigor-banner.component';
import { KurdishAcademicEvaluatorComponent } from './features/editor/components/kurdish-academic-evaluator.component';
import { AcademicGlossaryTableComponent } from './features/glossary/academic-glossary-table.component';
import { LogicalConsistencyCheckerComponent } from './features/editor/components/logical-consistency-checker.component';
import { AutomatedBibliographyGeneratorComponent } from './features/citation-manager/components/automated-bibliography-generator.component';
import { ThesisHealthReportComponent } from './features/editor/components/thesis-health-report.component';
import { EditorPomodoroTimerComponent } from './features/editor/components/editor-pomodoro-timer.component';
import { DailyResearchPulseComponent } from './features/editor/components/daily-research-pulse.component';
import { CitationHealthCheckComponent } from './features/editor/components/citation-health-check.component';
import { ChapterTimelineViewComponent } from './features/editor/components/chapter-timeline-view.component';
import { GrammarSyntaxFloatingPanelComponent } from './features/editor/components/grammar-syntax-floating-panel.component';
import { AcademicAdditionsSidebarComponent } from './features/editor/components/academic-additions-sidebar.component';
import { ConceptGraphComponent } from './features/d3-charts/concept-graph.component';
import { GlobalToastContainerComponent } from './components/global-toast-container';
import { AcademicPlatformComponent } from './features/academic-platform/academic-platform.component';
import { LibraryWorkspaceComponent } from './features/digital-library/library-workspace.component';
import { VipWritingQualityComponent } from './features/editor/components/vip-writing-quality.component';
import { FloatingAcademicToolbarComponent } from './features/editor/components/floating-academic-toolbar.component';
import { AcademicQualityCenterComponent } from './features/academic-quality-center/academic-quality-center';
import { EditorAutoSaveStatusComponent } from './features/editor/components/editor-auto-save-status.component';
import { StrictWordCountWidgetComponent } from './features/editor/components/strict-word-count-widget.component';
import { UserReputationModalComponent } from './features/user-reputation/user-reputation-modal.component';

export const BASIC_VIEW_IMPORTS = [
  CommonModule,
  MatIconModule,
] as const;

export const FORM_VIEW_IMPORTS = [
  ReactiveFormsModule,
] as const;

export const WORKSPACE_FEATURE_IMPORTS = [
  AcademicPlatformComponent,
  LibraryWorkspaceComponent,
  SearchEngineComponent,
  PlagiarismComponent,
  AcademicPlagiarismCheckerComponent,
  PythonSandboxComponent,
  HarvardReviewComponent,
  EliteReviewComponent,
  ResearchFeatureComponent,
  GlossaryComponent,
  ExportWordComponent,
  LatexComponent,
  CitationFeatureComponent,
  VivaSimulationComponent,
  ThesisDefenseSimulatorComponent,
  LiteratureGapComponent,
  AdvancedResearchHubComponent,
  SystemMaintenancePanelComponent,
  GoogleDriveIntegrationComponent,
  GmailIntegrationComponent,
  GoogleKeepIntegrationComponent,
  GoogleSheetsIntegrationComponent,
  GoogleTasksIntegrationComponent,
  AiToolsSuiteComponent,
  SplitViewEditorComponent,
  SpeechDictationComponent,
  D3ChordDiagramComponent,
  FormalityToneControlComponent,
  TextLineageConnectorComponent,
  AcademicRigorBannerComponent,
  KurdishAcademicEvaluatorComponent,
  AcademicGlossaryTableComponent,
  LogicalConsistencyCheckerComponent,
  ThesisHealthReportComponent,
  EditorPomodoroTimerComponent,
  DailyResearchPulseComponent,
  CitationHealthCheckComponent,
  ChapterTimelineViewComponent,
  GrammarSyntaxFloatingPanelComponent,
  AcademicAdditionsSidebarComponent,
  ConceptGraphComponent,
  VipWritingQualityComponent,
  FloatingAcademicToolbarComponent,
  AcademicQualityCenterComponent,
  StrictWordCountWidgetComponent,
  UserReputationModalComponent,
] as const;

/** Legacy aggregate kept for compatibility with feature code outside template sections. */
export const APP_VIEW_IMPORTS = [
  CommonModule,
  DashboardHeaderComponent,
  SplashScreenComponent,
  ReactiveFormsModule,
  MatIconModule,
  SearchEngineComponent,
  PlagiarismComponent,
  AcademicPlagiarismCheckerComponent,
  PythonSandboxComponent,
  HarvardReviewComponent,
  EliteReviewComponent,
  ResearchFeatureComponent,
  GlossaryComponent,
  ExportWordComponent,
  LatexComponent,
  CitationFeatureComponent,
  VivaSimulationComponent,
  ThesisDefenseSimulatorComponent,
  LiteratureGapComponent,
  AdvancedResearchHubComponent,
  SystemMaintenancePanelComponent,
  SourceVerificationComponent,
  GoogleDriveIntegrationComponent,
  GmailIntegrationComponent,
  GoogleKeepIntegrationComponent,
  GoogleSheetsIntegrationComponent,
  GoogleTasksIntegrationComponent,
  AiToolsSuiteComponent,
  SplitViewEditorComponent,
  SpeechDictationComponent,
  D3ChordDiagramComponent,
  FormalityToneControlComponent,
  TextLineageConnectorComponent,
  AcademicRigorBannerComponent,
  KurdishAcademicEvaluatorComponent,
  AcademicGlossaryTableComponent,
  LogicalConsistencyCheckerComponent,
  AutomatedBibliographyGeneratorComponent,
  ThesisHealthReportComponent,
  EditorPomodoroTimerComponent,
  DailyResearchPulseComponent,
  CitationHealthCheckComponent,
  ChapterTimelineViewComponent,
  GrammarSyntaxFloatingPanelComponent,
  AcademicAdditionsSidebarComponent,
  ConceptGraphComponent,
  GlobalToastContainerComponent,
  AcademicPlatformComponent,
  LibraryWorkspaceComponent,
  VipWritingQualityComponent,
  FloatingAcademicToolbarComponent,
  AcademicQualityCenterComponent,
  EditorAutoSaveStatusComponent,
  StrictWordCountWidgetComponent,
  UserReputationModalComponent,
];
