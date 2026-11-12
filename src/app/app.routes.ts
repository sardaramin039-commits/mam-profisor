import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'editor',
    pathMatch: 'full',
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./features/editor/editor-panel.component').then(m => m.EditorFeatureComponent),
    title: 'سەرنووسەری ئەکادیمی | مام',
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/search-engine/search-engine').then(m => m.SearchEngineComponent),
    title: 'کتێبخانەی دیجیتاڵی | مام',
  },
  {
    path: 'suite',
    loadComponent: () =>
      import('./features/ai-tools-suite/ai-tools-suite').then(m => m.AiToolsSuiteComponent),
    title: 'تارمایی ژیریی دەستکرد | مام',
  },
  {
    path: 'advanced-research',
    loadComponent: () =>
      import('./features/advanced-research/advanced-research.component').then(
        m => m.AdvancedResearchHubComponent
      ),
    title: 'تۆڕی توێژینەوەی باڵا | مام',
  },
  {
    path: 'google-drive',
    loadComponent: () =>
      import('./features/google-drive/google-drive-integration').then(
        m => m.GoogleDriveIntegrationComponent
      ),
    title: 'گووگڵ درایڤ | مام',
  },
  {
    path: 'viva',
    loadComponent: () =>
      import('./features/academic-suite/thesis-defense-simulator.component').then(
        m => m.ThesisDefenseSimulatorComponent
      ),
    title: 'تاقیکردنەوەی بەرگری و ڤیڤا | مام',
  },
  {
    path: 'plagiarism',
    loadComponent: () =>
      import('./features/academic-suite/academic-plagiarism-checker.component').then(
        m => m.AcademicPlagiarismCheckerComponent
      ),
    title: 'پشکنینی دزینی ئەدەبی و لێکچوون | مام',
  },
  {
    path: 'glossary',
    loadComponent: () =>
      import('./features/glossary/glossary').then(m => m.GlossaryComponent),
    title: 'فەرهەنگی زاراوەکان | مام',
  },
  {
    path: 'platform',
    loadComponent: () =>
      import('./features/academic-platform/academic-platform.component').then(
        m => m.AcademicPlatformComponent
      ),
    title: 'پلاتفۆرمی ئەکادیمی | مام',
  },
  {
    path: 'latex',
    loadComponent: () =>
      import('./features/latex/latex').then(m => m.LatexComponent),
    title: 'نووسینی لاتێخ | مام',
  },
  {
    path: '**',
    redirectTo: 'editor',
  },
];
