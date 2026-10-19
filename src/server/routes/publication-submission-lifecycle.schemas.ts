import { z } from 'zod';

export const lifecycleId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/u);
export const sectionType = z.enum(['abstract','research-question','methodology','chapter','conclusion']);

const chapter = z.object({
  id: lifecycleId,
  title: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000),
  content: z.string().max(500_000),
  citationIds: z.array(lifecycleId).max(500).default([])
}).strict();

const citation = z.object({
  citationId: lifecycleId,
  sourceId: lifecycleId,
  inText: z.string().trim().max(500),
  bibliography: z.string().trim().max(5000),
  verified: z.boolean(),
  evidenceId: lifecycleId.optional()
}).strict();

const author = z.object({
  name: z.string().trim().min(1).max(500),
  affiliation: z.string().trim().max(500).optional(),
  email: z.string().email().max(320).optional(),
  orcid: z.string().trim().max(100).optional()
}).strict();

export const policy = z.object({
  journalName: z.string().trim().min(1).max(1000),
  manuscriptType: z.enum(['article','review','thesis','book-chapter']).default('article'),
  maxWords: z.number().int().positive().max(2_000_000).optional(),
  maxAbstractWords: z.number().int().positive().max(50_000).optional(),
  minKeywords: z.number().int().min(0).max(100).optional(),
  maxKeywords: z.number().int().min(0).max(100).optional(),
  maxReferences: z.number().int().min(0).max(100_000).optional(),
  blindedReview: z.boolean().default(false),
  requiredSections: z.array(sectionType).max(10).optional(),
  requireCoverLetter: z.boolean().default(false),
  requireAuthorMetadata: z.boolean().default(false)
}).strict();

export const packageSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  abstract: z.string().max(100_000).optional(),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  chapters: z.array(chapter).min(1).max(100),
  conclusion: z.string().max(100_000).optional(),
  citations: z.array(citation).max(500).default([]),
  keywords: z.array(z.string().trim().max(200)).max(100).default([]),
  authors: z.array(author).max(100).default([]),
  policy
}).strict();

export const transitionSchema = z.object({
  submissionId: lifecycleId,
  to: z.enum([
    'DRAFT','READY','SUBMITTED','UNDER_REVIEW','REVISION_REQUESTED',
    'RESUBMITTED','ACCEPTED','REJECTED','WITHDRAWN'
  ]),
  note: z.string().trim().max(5000).optional(),
  externalReference: z.string().trim().max(500).optional(),
  submissionFingerprint: z.string().regex(/^[a-f0-9]{64}$/u).optional()
}).strict();

export const resubmitSchema = packageSchema.extend({
  note: z.string().trim().max(5000).optional(),
  externalReference: z.string().trim().max(500).optional()
}).strict();
