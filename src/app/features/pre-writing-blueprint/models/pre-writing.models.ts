export interface ResearchProposalBlueprint {
  problemStatement: string;
  coreQuestion: string;
  subQuestions: string[];
  mainObjective: string;
  specificObjectives: string[];
  coreHypothesis: string;
  temporalScope: string;
  spatialScope: string;
  thematicScope: string;
  significance: string;
  methodologyType: 'quantitative' | 'qualitative' | 'mixed';
  targetPopulation: string;
  sampleSize: string;
  dataCollectionTools: string[];
}

export interface ProposalAlignmentFeedback {
  score: number;
  status: 'OPTIMAL' | 'COHERENT' | 'NEEDS_ALIGNMENT';
  problemQuestionAlignment: boolean;
  questionObjectiveAlignment: boolean;
  objectiveMethodAlignment: boolean;
  recommendations: string[];
}
