import { Router } from 'express';
import { z } from 'zod';
import {
  researchStatisticsIntegrityService,
  type StatisticalInput
} from '../services/research-statistics-integrity.service';
import {
  researchMethodsLabService,
  type MethodsLabMode
} from '../services/research-methods-lab.service';

const methodsLabMode = z.enum([
  'prisma', 'power', 'claim_map', 'provenance', 'framework', 'risk_bias',
  'evidence_grade', 'methodology_gate', 'reporting_guideline'
]);
const requestSchema = z.object({
  mode: z.union([methodsLabMode, z.literal('statistics_integrity')]),
  payload: z.record(z.string(), z.unknown())
}).strict();

const powerPayloadSchema = z.object({
  design: z.enum(['two_group_t', 'correlation']),
  effect: z.number().finite(),
  alpha: z.number().finite(),
  power: z.number().finite(),
  mean1: z.number().finite(),
  mean2: z.number().finite(),
  sd1: z.number().finite(),
  sd2: z.number().finite(),
  n1: z.number().finite(),
  n2: z.number().finite()
}).strict();

const statisticalInputKeys = new Set([
  'sampleSize', 'eventCount', 'reportedPercent', 'pValue', 'alpha',
  'confidenceLevel', 'confidenceInterval', 'mean', 'standardDeviation',
  'sampleSize1', 'sampleSize2', 'mean1', 'mean2', 'standardDeviation1',
  'standardDeviation2', 'effectSize', 'targetPower', 'analysisType',
  'studyDesign', 'conclusion'
]);

function mapPowerInput(payload: z.infer<typeof powerPayloadSchema>): StatisticalInput {
  return {
    alpha: payload.alpha,
    targetPower: payload.power,
    effectSize: payload.effect,
    analysisType: payload.design,
    sampleSize1: payload.n1,
    sampleSize2: payload.n2,
    mean1: payload.mean1,
    mean2: payload.mean2,
    standardDeviation1: payload.sd1,
    standardDeviation2: payload.sd2
  };
}

function boundedPayload(payload: Record<string, unknown>): boolean {
  if (Object.keys(payload).length > 100) return false;
  try {
    return JSON.stringify(payload).length <= 250_000;
  } catch {
    return false;
  }
}

export function createResearchMethodsLabRouter(): Router {
  const router = Router();

  router.post('/run', (req, res): void => {
    res.setHeader('Cache-Control', 'no-store');
    const parsed = requestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای Research Methods Lab نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }
    const { mode, payload } = parsed.data;
    if (!boundedPayload(payload)) {
      res.status(413).json({ error: 'قەبارەی داتای شیکاری لە سنووری پارێزراو زیاترە.' });
      return;
    }

    if (mode === 'statistics_integrity') {
      const unknownKeys = Object.keys(payload).filter(key => !statisticalInputKeys.has(key));
      if (unknownKeys.length) {
        res.status(400).json({
          error: 'خانەی نەناسراو لە داتای Statistical Integrity هەیە.',
          unknownKeys
        });
        return;
      }
      const integrity = researchStatisticsIntegrityService.validate(payload as StatisticalInput);
      res.json({
        mode,
        result: {
          ...integrity,
          canProceed: integrity.valid,
          calculationBlocked: !integrity.valid
        },
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (mode === 'power') {
      const powerInput = powerPayloadSchema.safeParse(payload);
      if (!powerInput.success) {
        res.status(400).json({
          error: 'داتای Power & Effect Size نادروستە.',
          issues: powerInput.error.issues
        });
        return;
      }
      const integrity = researchStatisticsIntegrityService.validate(mapPowerInput(powerInput.data));
      if (!integrity.valid) {
        res.json({
          mode,
          result: {
            ...integrity,
            calculationBlocked: true,
            message: 'ژمێریاری پاوەر بلۆک کرا؛ سەرەتا هەڵە ئامارییەکان چاک بکە.'
          },
          generatedAt: new Date().toISOString()
        });
        return;
      }
    }

    const result = researchMethodsLabService.run(mode as MethodsLabMode, payload);
    res.json({ mode, result, generatedAt: new Date().toISOString() });
  });

  return router;
}
