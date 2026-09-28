-- 0002: preserve provenance and chunk boundaries for long-document RAG.
-- Existing rows receive empty metadata and remain eligible only by owner_uid.

ALTER TABLE library_index
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS library_index_document_id_idx
  ON library_index ((metadata->>'documentId'));
