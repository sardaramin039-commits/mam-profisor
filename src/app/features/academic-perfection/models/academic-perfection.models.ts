export interface StructuredImradAbstract {
  backgroundKurdish: string;
  backgroundEnglish: string;
  methodsKurdish: string;
  methodsEnglish: string;
  resultsKurdish: string;
  resultsEnglish: string;
  conclusionKurdish: string;
  conclusionEnglish: string;
  keywordsKurdish: string[];
  keywordsEnglish: string[];
}

export interface CreditAuthorRole {
  roleId: string;
  roleNameKurdish: string;
  roleNameEnglish: string;
  assignedAuthor: string;
  selected: boolean;
}

export interface AuthenticityDeclaration {
  authorName: string;
  affiliation: string;
  submissionDate: string;
  statementAccepted: boolean;
  hasConflictOfInterest: boolean;
  conflictDetails: string;
  fundingStatement: string;
  verificationHash: string;
}

export interface StatisticalRigorPlan {
  researchDesign: 'correlational' | 'experimental' | 'quasi_experimental' | 'comparative' | 'descriptive';
  independentVariables: string[];
  dependentVariables: string[];
  reliabilityMethod: 'cronbach_alpha' | 'test_retest' | 'inter_rater';
  targetAlphaScore: number;
  recommendedTests: string[];
}
