-- 0001: scope PostgreSQL pgvector library documents to Firebase users.
-- Existing rows intentionally keep owner_uid NULL and are excluded from private RAG retrieval
-- until an explicit owner mapping is established.

ALTER TABLE library_index
  ADD COLUMN IF NOT EXISTS owner_uid TEXT;

CREATE INDEX IF NOT EXISTS library_index_owner_uid_idx
  ON library_index (owner_uid);
