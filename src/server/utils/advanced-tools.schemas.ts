import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const researchTimelineSchema = z.object({
  body: z.object({
    topic: text(500),
    durationMonths: z.coerce.number().int().min(1).max(120).default(12)
  }).passthrough()
});

export const mindMapSchema = z.object({
  body: z.object({
    topic: text(500),
    depth: z.coerce.number().int().min(1).max(8).default(3)
  }).passthrough()
});

export const autoOutlineSchema = z.object({
  body: z.object({
    topic: text(500),
    methodology: z.string().trim().max(200).optional(),
    discipline: z.string().trim().max(200).optional()
  }).passthrough()
});

export const tableFigureSchema = z.object({
  body: z.object({
    concept: text(2000),
    type: z.enum(['table', 'bar', 'line', 'pie', 'comparison']).default('table')
  }).passthrough()
});

export const vivaSchema = z.object({
  body: z.object({
    thesisTitle: text(500),
    abstract: z.string().trim().max(20_000).optional()
  }).passthrough()
});

export const textOnlySchema = z.object({
  body: z.object({
    text: text(250_000)
  }).passthrough()
});

export const harvardAuditSchema = z.object({
  body: z.object({
    text: text(250_000),
    discipline: z.string().trim().max(200).optional()
  }).passthrough()
});

export const vivaDefenseSchema = z.object({
  body: z.object({
    thesisTitle: text(500),
    chapterContext: z.string().trim().max(20_000).optional(),
    question: text(5000),
    answer: text(20_000),
    academicLevel: z.string().trim().max(100).default('ماستەر')
  }).passthrough()
});

export const titleSummarySchema = z.object({
  body: z.object({
    topic: text(500)
  }).passthrough()
});

export const thesisContextSchema = z.object({
  body: z.object({
    text: text(250_000)
  }).passthrough()
});

export const academicAdditionsSchema = z.object({
  body: z.object({
    chapterTitle: z.string().trim().max(500).optional(),
    chapterText: text(100_000),
    discipline: z.string().trim().max(200).default('گشتی'),
    academicLevel: z.string().trim().max(100).default('ماستەر')
  }).passthrough()
});

export const soraniPhoneticsSchema = z.object({
  body: z.object({
    text: text(50_000),
    subDialect: z.string().trim().max(100).default('hawler'),
    scope: z.string().trim().max(100).default('full')
  }).passthrough()
});

export const rigorRecalibrationSchema = z.object({
  body: z.object({
    text: text(100_000),
    intuition: z.string().trim().max(5000).optional(),
    discipline: z.string().trim().max(200).default('گشتی'),
    academicLevel: z.string().trim().max(100).default('ماستەر')
  }).passthrough()
});
