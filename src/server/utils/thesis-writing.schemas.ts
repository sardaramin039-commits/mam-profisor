import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const thesisRefineSchema = z.object({
  body: z.object({
    text: text(15_000),
    discipline: z.string().trim().max(200).optional(),
    tone: z.string().trim().max(100).optional(),
    goal: z.string().trim().max(500).optional()
  }).passthrough()
});

export const structureReviewSchema = z.object({
  body: z.object({
    title: text(500),
    discipline: text(200),
    writingType: text(100),
    academicLevel: text(100),
    size: z.coerce.number().int().min(1).max(5000),
    chaptersList: z.array(z.unknown()).max(200).default([])
  }).passthrough()
});

export const chapterGenerationSchema = z.object({
  body: z.object({
    title: text(500),
    discipline: text(200),
    writingType: text(100),
    academicLevel: text(100),
    pages: z.coerce.number().int().min(1).max(5000).optional(),
    targetPages: z.coerce.number().int().min(1).max(5000).optional(),
    currentChapterIndex: z.coerce.number().int().min(0).max(1000),
    chapterTitle: text(500),
    targetWordsPerChapter: z.coerce.number().int().min(100).max(100_000).optional(),
    previousChapterContent: z.string().max(100_000).optional(),
    activeRules: z.unknown().optional(),
    academicStyle: z.enum(['harvard', 'apa7', 'chicago', 'mla', 'ieee', 'vancouver']).optional(),
    customSourcesOn: z.boolean().optional(),
    customSourcesText: z.string().max(100_000).optional(),
    customTOCOn: z.boolean().optional(),
    customTOCText: z.string().max(100_000).optional(),
    fieldWorkOn: z.boolean().optional(),
    fieldWorkText: z.string().max(100_000).optional(),
    selectedBook: z.string().trim().max(1000).optional(),
    compareAspect: z.string().trim().max(500).optional(),
    compareFile1: z.string().max(100_000).optional(),
    compareFile2: z.string().max(100_000).optional(),
    copyStyleText: z.string().max(50_000).optional(),
    thesisDefense: z.boolean().optional(),
    humanizeMode: z.boolean().optional(),
    role: z.string().trim().max(100).optional(),
    dialect: z.string().trim().max(100).optional(),
    temperature: z.coerce.number().min(0).max(1).optional()
  }).passthrough()
});

export const glossaryExpansionSchema = z.object({
  body: z.object({
    term: text(500),
    definition: z.string().trim().max(5000).optional(),
    category: z.string().trim().max(200).optional()
  }).passthrough()
});

export const groundedGenerationSchema = z.object({
  body: z.object({
    topic: text(500),
    prompt: text(10_000),
    evidenceChunks: z.array(z.unknown()).max(500).default([])
  }).passthrough()
});
