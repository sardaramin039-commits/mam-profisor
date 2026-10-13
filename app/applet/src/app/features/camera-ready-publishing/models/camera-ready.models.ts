export interface PublishingMetadata {
  titleKurdish: string;
  titleEnglish: string;
  authorName: string;
  authorOrcid: string;
  supervisorName: string;
  academicDegree: 'bachelor' | 'master' | 'phd' | 'postdoc' | 'book';
  institution: string;
  faculty: string;
  department: string;
  publicationYear: string;
  legalDepositNumber: string;
  isbn: string;
  doi: string;
  ethicalClearanceCode: string;
  ethicalStatement: string;
  copyrightNotice: string;
}

export interface DefenseRehearsalQuestion {
  id: string;
  category: string;
  prompt: string;
  expectedElements: string[];
}

export interface DefenseAssessment {
  questionId: string;
  score: number;
  status: 'STRONG' | 'ADEQUATE' | 'NEEDS_WORK' | 'MISSING';
  coveredElements: string[];
  feedback: string;
}

export interface PreFlightCheckItem {
  id: string;
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface CameraReadyReport {
  overallStatus: 'CAMERA_READY' | 'ACTION_REQUIRED';
  readinessPercentage: number;
  checks: PreFlightCheckItem[];
  preflightFingerprint: string;
  generatedAt: string;
}
