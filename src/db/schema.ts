import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb, vector, uuid } from 'drizzle-orm/pg-core';

// Define the 'library_index' table with PostgreSQL pgvector support.
export const libraryIndex = pgTable('library_index', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  language: text('language').default('ckb').notNull(), // ckb = Sorani Kurdish
  ownerUid: text('owner_uid'), // Firebase Auth UID; null legacy rows are not returned by private RAG
  embedding: vector('embedding', { dimensions: 768 }), // 768 dimension بۆ Gemini Text Embedding
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'chapters' table.
export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  academicLevel: text('academic_level'),
  discipline: text('discipline'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'academic_assessments' table.
export const academicAssessments = pgTable('academic_assessments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  score: integer('score').notNull(),
  dimensions: jsonb('dimensions').notNull(), // Scores for dimensions
  latexTemplate: text('latex_template'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }: any) => ({
  chapters: many(chapters),
  assessments: many(academicAssessments),
}));

// Define relationships for 'chapters'.
export const chaptersRelations = relations(chapters, ({ one }: any) => ({
  author: one(users, {
    fields: [chapters.userId],
    references: [users.id],
  }),
}));

// Define relationships for 'academicAssessments'.
export const academicAssessmentsRelations = relations(academicAssessments, ({ one }: any) => ({
  user: one(users, {
    fields: [academicAssessments.userId],
    references: [users.id],
  }),
}));
