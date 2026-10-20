import { describe, expect, it } from 'vitest';
import { ResearchStatisticsIntegrityService } from './research-statistics-integrity.service';

const service = new ResearchStatisticsIntegrityService();

describe('research statistics integrity', () => {
  it('derives event percentage and checks the reported value', () => {
    const result = service.validate({
      sampleSize: 80, eventCount: 20, reportedPercent: 25,
      pValue: 0.04, alpha: 0.05, studyDesign: 'randomized_trial'
    });
    expect(result.valid).toBe(true);
    expect(result.derivedEventPercent).toBe(25);
    expect(result.significanceAssessment).toBe('significant_at_alpha');
  });

  it('blocks event counts beyond sample size and also reports percentage mismatch', () => {
    const result = service.validate({
      sampleSize: 50, eventCount: 60, reportedPercent: 90
    });
    expect(result.valid).toBe(false);
    const codes = result.issues.map(issue => issue.code);
    expect(codes).toContain('events_exceed_sample');
    expect(codes).toContain('percentage_mismatch');
    expect(result.derivedEventPercent).toBe(120);
  });

  it('rejects invalid p-values, alpha and reversed confidence intervals', () => {
    const result = service.validate({
      pValue: 1.2, alpha: 0, confidenceLevel: 0.9,
      confidenceInterval: { lower: 12, upper: -1 }
    });
    expect(result.valid).toBe(false);
    expect(result.significanceAssessment).toBe('not_assessed');
    const codes = result.issues.map(issue => issue.code);
    expect(codes).toContain('invalid_p_value');
    expect(codes).toContain('invalid_alpha');
    expect(codes).toContain('invalid_confidence_interval');
  });

  it('treats p equal to alpha as significant at the stated threshold', () => {
    expect(service.validate({ pValue: 0.05, alpha: 0.05 }).significanceAssessment)
      .toBe('significant_at_alpha');
  });

  it('does not call a p-value significant merely because it exists', () => {
    expect(service.validate({ pValue: 0.08, alpha: 0.05 }).significanceAssessment)
      .toBe('not_significant_at_alpha');
  });

  it('flags causal overreach for non-experimental designs', () => {
    const result = service.validate({
      studyDesign: 'cross_sectional',
      conclusion: 'The program caused an increase in scores.'
    });
    expect(result.valid).toBe(true);
    expect(result.causalLanguageWarning).toBe(true);
    expect(result.issues.map(issue => issue.code)).toContain('causal_claim_overreach');
  });

  it('warns when inferential statistics are inconsistent with a qualitative design', () => {
    const result = service.validate({
      studyDesign: 'qualitative', pValue: 0.03, mean: 4, standardDeviation: 1
    });
    expect(result.issues.map(issue => issue.code)).toContain('design_statistic_mismatch');
    expect(result.valid).toBe(true);
  });

  it('rejects non-finite summary statistics and impossible percentages', () => {
    const result = service.validate({
      sampleSize: 0, eventCount: -2, reportedPercent: 140,
      mean: Number.NaN, standardDeviation: -1
    });
    expect(result.valid).toBe(false);
    const codes = result.issues.map(issue => issue.code);
    expect(codes).toContain('invalid_sample_size');
    expect(codes).toContain('invalid_event_count');
    expect(codes).toContain('invalid_percentage');
    expect(codes).toContain('invalid_mean');
    expect(codes).toContain('invalid_standard_deviation');
  });

  it('rejects impossible power-analysis parameters instead of clamping them', () => {
    const result = service.validate({
      alpha: 0, targetPower: 1, effectSize: 0, analysisType: 'two_group_t',
      sampleSize1: 1, sampleSize2: 30, standardDeviation1: 0, standardDeviation2: 1
    });
    expect(result.valid).toBe(false);
    const codes = result.issues.map(issue => issue.code);
    expect(codes).toContain('invalid_alpha');
    expect(codes).toContain('invalid_target_power');
    expect(codes).toContain('invalid_effect_size');
    expect(codes).toContain('invalid_sampleSize1');
    expect(codes).toContain('invalid_standardDeviation1');
  });

  it('rejects correlation effect sizes outside the bounded correlation range', () => {
    const result = service.validate({ effectSize: 1.2, analysisType: 'correlation' });
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toContain('invalid_correlation_effect');
  });
});
