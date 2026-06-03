-- Add HNSW index on source_chunks embedding column for efficient vector similarity search
CREATE INDEX IF NOT EXISTS embedding_idx ON source_chunks USING hnsw (embedding vector_cosine_ops);
