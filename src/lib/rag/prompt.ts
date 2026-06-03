import type { ChunkResult } from "./search";

export function buildSystemPrompt(chunks: ChunkResult[]): string {
  if (chunks.length === 0) {
    return (
      "You are a helpful assistant for SourceMind. " +
      "The user's workspace has sources available, but none were relevant to the query. " +
      'Respond with: "I couldn\'t find relevant information in your sources for that question."'
    );
  }

  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.sourceTitle}]\n${c.chunkText}`)
    .join("\n\n");

  return (
    "You are a helpful assistant for SourceMind. " +
    "Answer the user's question based **only** on the provided context below. " +
    "If the context does not contain enough information to answer, say so clearly.\n\n" +
    "When you use information from a source, cite it by the source's title (e.g., [Source Title]) at the end of the relevant sentence.\n\n" +
    "--- CONTEXT ---\n" +
    context +
    "\n--- END CONTEXT ---"
  );
}
