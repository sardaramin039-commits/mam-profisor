import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const academicRigorSchema = z.object({
  body: z.object({
    title: z.string().trim().max(500).optional(),
    content: text(250_000),
    discipline: z.string().trim().max(200).optional(),
    theoreticalFramework: z.string().trim().max(300).optional(),
    academicStyle: z.string().trim().max(100).optional()
  }).passthrough()
});

export const academicConsultationSchema = z.object({
  body: z.object({
    userQuestion: text(10_000),
    discipline: z.string().trim().max(200).optional(),
    academicLevel: z.string().trim().max(100).optional(),
    currentThesisContext: z.string().max(20_000).optional()
  }).passthrough()
});

export const methodologySchema = z.object({
  body: z.object({
    title: text(500),
    discipline: text(200),
    researchType: z.string().trim().max(200).optional(),
    sampleSize: z.union([z.string().trim().max(100), z.number().int().min(1).max(1_000_000)]).optional()
  }).passthrough()
});

export const multiAgentPipelineSchema = z.object({
  body: z.object({
    topic: text(500),
    discipline: z.string().trim().max(200).default('گشتی'),
    draftText: z.string().max(250_000).default(''),
    rawSources: z.array(z.record(z.string(), z.unknown())).max(100).default([]),
    citationStyle: z.enum(['APA7', 'MLA9', 'ChicagoAD', 'ChicagoNB', 'Harvard', 'IEEE']).default('APA7')
  }).passthrough()
});

export const researchIntegrityAuditSchema = z.object({
  body: z.object({
    title: text(500),
    discipline: z.string().trim().max(200).optional(),
    academicLevel: z.string().trim().max(100).optional(),
    researchQuestion: text(10_000).optional(),
    objectives: z.string().max(20_000).optional(),
    hypotheses: z.string().max(20_000).optional(),
    methodology: z.string().max(40_000).optional(),
    populationSample: z.string().max(20_000).optional(),
    variables: z.string().max(20_000).optional(),
    dataCollection: z.string().max(20_000).optional(),
    analysisPlan: z.string().max(20_000).optional(),
    ethics: z.string().max(20_000).optional(),
    draftText: z.string().max(150_000).optional(),
    bibliography: z.string().max(100_000).optional()
  }).passthrough()
});

export const peerReviewSchema = z.object({
  body: z.object({
    title: z.string().trim().max(500).optional(),
    text: text(250_000),
    discipline: z.string().trim().max(200).optional()
  }).passthrough()
});

export const literatureGapSchema = z.object({
  body: z.object({
    topic: text(500),
    discipline: z.string().trim().max(200).optional(),
    existingLiterature: z.string().max(100_000).optional()
  }).passthrough()
});

export const harvardReviewSchema = z.object({
  body: z.object({
    title: z.string().trim().max(500).optional(),
    text: text(250_000),
    discipline: z.string().trim().max(200).optional()
  }).passthrough()
});

export const researchMethodsLabSchema = z.object({
  body: z.object({
    mode: z.enum(['prisma', 'power', 'claim_map', 'provenance', 'framework', 'risk_bias', 'evidence_grade', 'methodology_gate', 'reporting_guideline']),
    payload: z.record(z.string(), z.unknown()).default({})
  })
});

export const scholarship55Schema = z.object({ body: z.object({ payload: z.record(z.string(), z.unknown()).default({}) }).passthrough() });
