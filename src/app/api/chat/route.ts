import { convertToModelMessages, streamText } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import db from "@/db";
import { chats, messages, workspaces } from "@/db/schema";
import { auth } from "@/lib/auth";
import { gateway } from "@/lib/gateway";
import { buildSystemPrompt } from "@/lib/rag/prompt";
import { searchRelevantChunks } from "@/lib/rag/search";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
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

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .innerJoin(workspaces, eq(workspaces.id, chats.workspaceId))
    .where(and(eq(chats.id, chatId), eq(workspaces.userId, session.user.id)))
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

  const stream = streamText({
    model: gateway("openai/gpt-5-nano"),
    messages: modelMessages,
    system: systemPrompt,
    onFinish: async ({ text }) => {
      try {
        await Promise.all([
          db.insert(messages).values([
            {
              chatId,
              role: "user",
              content: userQuery,
            },
            {
              chatId,
              role: "assistant",
              content: text,
              sourceCitations: relevantChunks.map((c) => ({
                sourceTitle: c.sourceTitle,
                sourceType: c.sourceType,
                snippet: c.chunkText.slice(0, 200),
                similarity: c.similarity,
              })),
            },
          ]),
          db
            .update(chats)
            .set({ updatedAt: new Date() })
            .where(
              and(eq(chats.id, chatId), eq(chats.workspaceId, workspaceId)),
            ),
        ]);
      } catch (err) {
        console.error("Failed to persist chat messages:", err);
      }
    },
  });

  return stream.toUIMessageStreamResponse();
}
