import { Provider } from '@angular/core';
import { Data } from '../services/data';
import { AcademicStoreService } from '../services/academic-store.service';
import { DigitalLibraryService } from '../services/digital-library.service';
import { AnalyticsService } from '../services/analytics';
import { WordExportService } from '../services/word-export';
import { PlagiarismService } from '../services/plagiarism';
import { PythonSandboxService } from '../services/python-sandbox';
import { ReviewsService } from '../services/reviews';
import { GlossaryService } from '../services/glossary';
import { LatexService } from '../services/latex';
import { SearchService } from '../services/search';

export const CORE_PROVIDERS: Provider[] = [
  Data,
  AcademicStoreService,
  DigitalLibraryService,
  AnalyticsService,
  WordExportService,
  PlagiarismService,
  PythonSandboxService,
  ReviewsService,
  GlossaryService,
  LatexService,
  SearchService
];
