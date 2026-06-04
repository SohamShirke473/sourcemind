import { embed } from "ai";
import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import db from "@/db";
import { sourceChunks, sources } from "@/db/schema";

export interface ChunkResult {
  sourceId: string;
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
    model: "voyage/voyage-4-lite",
    value: query,
  });

  const similarity = sql<number>`1 - (${cosineDistance(
    sourceChunks.embedding,
    embedding,
  )})`;

  const results = await db
    .select({
      sourceId: sources.id,
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

  const seen = new Set<string>();
  const deduped: ChunkResult[] = [];
  for (const r of results) {
    if (!seen.has(r.sourceId)) {
      seen.add(r.sourceId);
      deduped.push(r);
    }
  }
  return deduped;
}
