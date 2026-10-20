export type StudyDesign = 'randomized_trial' | 'quasi_experimental' | 'observational' |
  'cross_sectional' | 'qualitative' | 'descriptive' | 'unknown';

export interface StatisticalInput {
  sampleSize?: number;
  eventCount?: number;
  reportedPercent?: number;
  pValue?: number;
  alpha?: number;
  confidenceLevel?: number;
  confidenceInterval?: { lower: number; upper: number };
  mean?: number;
  standardDeviation?: number;
  studyDesign?: StudyDesign;
  conclusion?: string;
}

export interface StatisticalIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface StatisticalIntegrityResult {
  valid: boolean;
  issues: StatisticalIssue[];
  derivedEventPercent: number | null;
  significanceAssessment: 'significant_at_alpha' | 'not_significant_at_alpha' | 'not_assessed';
  causalLanguageWarning: boolean;
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const inRange = (value: unknown, min: number, max: number): value is number =>
  finite(value) && value >= min && value <= max;

export class ResearchStatisticsIntegrityService {
  public validate(input: StatisticalInput): StatisticalIntegrityResult {
    const issues: StatisticalIssue[] = [];
    const add = (code: string, severity: StatisticalIssue['severity'], message: string) =>
      issues.push({ code, severity, message });

    if (input.sampleSize !== undefined &&
      (!Number.isSafeInteger(input.sampleSize) || input.sampleSize <= 0)) {
      add('invalid_sample_size', 'error', 'Sample size must be a positive safe integer.');
    }
    if (input.eventCount !== undefined) {
      if (!Number.isSafeInteger(input.eventCount) || input.eventCount < 0) {
        add('invalid_event_count', 'error', 'Event count must be a non-negative safe integer.');
      }
      if (finite(input.sampleSize) && Number.isSafeInteger(input.sampleSize) &&
        input.eventCount > input.sampleSize) {
        add('events_exceed_sample', 'error', 'Event count cannot exceed the sample size.');
      }
    }

    let derivedEventPercent: number | null = null;
    if (input.eventCount !== undefined && finite(input.sampleSize) &&
      Number.isSafeInteger(input.sampleSize) && input.sampleSize > 0 &&
      Number.isSafeInteger(input.eventCount) && input.eventCount >= 0 &&
      input.eventCount <= input.sampleSize) {
      derivedEventPercent = input.eventCount / input.sampleSize * 100;
      if (input.reportedPercent !== undefined && finite(input.reportedPercent) &&
        Math.abs(input.reportedPercent - derivedEventPercent) > 0.1) {
        add('percentage_mismatch', 'error',
          'Reported percentage does not match eventCount / sampleSize within 0.1 percentage points.');
      }
    }
    if (input.reportedPercent !== undefined && !inRange(input.reportedPercent, 0, 100)) {
      add('invalid_percentage', 'error', 'A percentage must be finite and between 0 and 100.');
    }

    if (input.pValue !== undefined && !inRange(input.pValue, 0, 1)) {
      add('invalid_p_value', 'error', 'p-value must be finite and between 0 and 1.');
    }
    const alpha = input.alpha === undefined ? 0.05 : input.alpha;
    if (!inRange(alpha, 0.000001, 0.5)) {
      add('invalid_alpha', 'error', 'Alpha must be finite and between 0.000001 and 0.5.');
    }
    const significanceAssessment = input.pValue !== undefined && inRange(input.pValue, 0, 1) &&
      inRange(alpha, 0.000001, 0.5)
      ? input.pValue < alpha ? 'significant_at_alpha' : 'not_significant_at_alpha'
      : 'not_assessed';

    if (input.confidenceLevel !== undefined && !inRange(input.confidenceLevel, 0.5, 0.999999)) {
      add('invalid_confidence_level', 'error', 'Confidence level must be between 0.5 and 0.999999.');
    }
    const ci = input.confidenceInterval;
    if (ci !== undefined) {
      if (!finite(ci.lower) || !finite(ci.upper) || ci.lower > ci.upper) {
        add('invalid_confidence_interval', 'error', 'Confidence interval bounds must be finite and ordered.');
      } else if (finite(input.reportedPercent) &&
        (ci.lower < 0 || ci.upper > 100)) {
        add('percentage_ci_out_of_range', 'error',
          'A confidence interval attached to a percentage must lie within 0 and 100.');
      }
    }

    if (input.mean !== undefined && !finite(input.mean)) {
      add('invalid_mean', 'error', 'Mean must be finite.');
    }
    if (input.standardDeviation !== undefined &&
      (!finite(input.standardDeviation) || input.standardDeviation < 0)) {
      add('invalid_standard_deviation', 'error', 'Standard deviation must be finite and non-negative.');
    }
    if (input.studyDesign === 'qualitative' && (
      input.pValue !== undefined || input.mean !== undefined || input.standardDeviation !== undefined
    )) {
      add('design_statistic_mismatch', 'warning',
        'Inferential numeric statistics may not be appropriate for a qualitative design; verify the method.');
    }

    const causalLanguageWarning =
      (input.studyDesign === 'observational' ||
       input.studyDesign === 'cross_sectional' ||
       input.studyDesign === 'descriptive' ||
       input.studyDesign === 'unknown' ||
       input.studyDesign === undefined) &&
      /caused?|proves? that|leads? to|results? in|effect of/iu.test(input.conclusion || '');
    if (causalLanguageWarning) {
      add('causal_claim_overreach', 'warning',
        'The design does not by itself justify causal wording; consider association language or explain causal identification.');
    }

    return {
      valid: !issues.some(issue => issue.severity === 'error'),
      issues,
      derivedEventPercent,
      significanceAssessment,
      causalLanguageWarning
    };
  }
}

export const researchStatisticsIntegrityService = new ResearchStatisticsIntegrityService();
