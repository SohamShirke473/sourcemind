import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, streamText } from "ai";
import { and, eq } from "drizzle-orm";
import db from "@/db";
import { chats, messages, workspaces } from "@/db/schema";
import { buildSystemPrompt } from "@/lib/rag/prompt";
import { searchRelevantChunks } from "@/lib/rag/search";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    id: string;
    messages: Array<{
      id: string;
      role: string;
      parts: Array<{ type: string; text?: string }>;
    }>;
    workspaceId: string;
    chatId: string;
  };

  const { messages: uiMessages, workspaceId, chatId } = body;

  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);
  if (!workspace) {
    return new Response("Not found", { status: 403 });
  }

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.workspaceId, workspaceId)))
    .limit(1);
  if (!chat) {
    return new Response("Not found", { status: 403 });
  }

  // biome-ignore lint/suspicious/noExplicitAny: the incoming UIMessage shape is correct
  const modelMessages = await convertToModelMessages(uiMessages as any);

  if (!workspaceId || !chatId || !uiMessages?.length) {
    return new Response("Missing required fields", { status: 400 });
  }

  const textParts = uiMessages[uiMessages.length - 1].parts.filter(
    (p): p is { type: "text"; text: string } => p.type === "text",
  );
  const userQuery = textParts.map((p) => p.text).join("");

  if (!userQuery.trim()) {
    return new Response("No text content in last message", { status: 400 });
  }

  const relevantChunks = await searchRelevantChunks(workspaceId, userQuery);
  const systemPrompt = buildSystemPrompt(relevantChunks);

  const result = streamText({
    model: "openai/gpt-oss-20b",
    messages: modelMessages,
    system: systemPrompt,
    onFinish: async ({ text }) => {
      try {
        await db.insert(messages).values({
          chatId,
          role: "user",
          content: userQuery,
        });

        await db.insert(messages).values({
          chatId,
          role: "assistant",
          content: text,
          sourceCitations: relevantChunks.map((c) => ({
            sourceTitle: c.sourceTitle,
            sourceType: c.sourceType,
            snippet: c.chunkText.slice(0, 200),
            similarity: c.similarity,
          })),
        });

        await db
          .update(chats)
          .set({ updatedAt: new Date() })
          .where(and(eq(chats.id, chatId), eq(chats.workspaceId, workspaceId)));
      } catch (err) {
        console.error("Failed to persist chat messages:", err);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
