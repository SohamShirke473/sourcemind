ALTER TABLE "source_chunks" DROP COLUMN "embedding";--> statement-breakpoint
ALTER TABLE "source_chunks" ADD COLUMN "embedding" vector(1024);--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "source_chunks" USING hnsw ("embedding" vector_cosine_ops);