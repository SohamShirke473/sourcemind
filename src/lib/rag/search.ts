import { embed } from "ai";
import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import db from "@/db";
import { sourceChunks, sources } from "@/db/schema";

export interface ChunkResult {
  chunkText: string;
  chunkIndex: number;
  sourceTitle: string;
  sourceType: string;
  similarity: number;
}

export async function searchRelevantChunks(
  workspaceId: string,
  query: string,
  limit = 6,
): Promise<ChunkResult[]> {
  const { embedding } = await embed({
    model: "openai/text-embedding-3-small",
    value: query,
  });

  const similarity = sql<number>`1 - (${cosineDistance(
    sourceChunks.embedding,
    embedding,
  )})`;

  return db
    .select({
      chunkText: sourceChunks.chunkText,
      chunkIndex: sourceChunks.chunkIndex,
      sourceTitle: sources.title,
      sourceType: sources.type,
      similarity,
    })
    .from(sourceChunks)
    .innerJoin(sources, eq(sources.id, sourceChunks.sourceId))
    .where(eq(sourceChunks.workspaceId, workspaceId))
    .orderBy(desc(similarity))
    .limit(limit);
}
