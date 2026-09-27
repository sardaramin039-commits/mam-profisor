import assert from 'node:assert/strict';
import { MultiAgentOrchestratorService } from '../src/server/services/multi-agent-orchestrator.service.ts';

console.log('🧪 Starting P6 Multi-Agent Orchestration Contract Test...\n');

const orchestrator = new MultiAgentOrchestratorService();

const mockGeminiClient = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({
        nodes: [],
        edges: [],
        integrityMetrics: { totalClaims: 1, supportedClaims: 1, unsupportedClaims: 0, evidenceCoverageRatio: 100 },
        overallGrade: 'A',
        overallScore: 92,
        academicRigorAssessment: 'بەرواورد و هەڵسەنگاندنی بەرز',
        citationsValidityScore: 95,
        criticalFlaws: [],
        requiredImprovements: [],
        passed: true,
        score: 95,
        decision: 'PASS',
        confidenceScore: 95,
        grammaticalAccuracyScore: 98,
        academicToneScore: 96,
        spellingCorrectionCount: 0,
        suggestedDraftText: 'دەقی تێزی زانستیی وەرگیراو بە کوردی',
        kurdishThesisText: 'تێزی زانستی بە زمانی کوردیی فەرمی'
      })
    })
  }
});

const result = await orchestrator.executePipeline(
  {
    topic: 'زمانەوانیی سۆرانی',
    discipline: 'زمانەوانی',
    draftText: 'پێشەکی توێژینەوەکە'
  },
  mockGeminiClient
);

assert.ok(result.executionPipelineLog.length >= 8, 'Pipeline must log execution steps');
assert.ok(result.qaGateResult, 'QA Gate result must be present');
assert.ok(result.finalThesisDraftKurdish, 'Final thesis draft must be generated');

console.log('✅ P6 Multi-Agent Orchestration Contract Test PASSED SUCCESSFULLY!');
