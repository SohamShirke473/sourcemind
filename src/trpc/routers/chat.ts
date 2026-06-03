import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { chats, messages, workspaces } from "@/db/schema";
import { authProcedure, createTRPCRouter } from "../init";

async function assertWorkspaceOwnership(workspaceId: string, userId: string) {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
}

export const chatRouter = createTRPCRouter({
  list: authProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);
      return db
        .select()
        .from(chats)
        .where(eq(chats.workspaceId, input.workspaceId))
        .orderBy(desc(chats.updatedAt));
    }),

  create: authProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string().max(255).default("New Chat"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);
      const [chat] = await db
        .insert(chats)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
        })
        .returning();
      return chat;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [chat] = await db
        .select({ workspaceId: chats.workspaceId })
        .from(chats)
        .where(eq(chats.id, input.id))
        .limit(1);
      if (!chat) throw new Error("Chat not found");
      await assertWorkspaceOwnership(chat.workspaceId, ctx.userId);
      await db.delete(chats).where(eq(chats.id, input.id));
      return { success: true };
    }),

  getMessages: authProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [chat] = await db
        .select({ workspaceId: chats.workspaceId })
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);
      if (!chat) throw new Error("Chat not found");
      await assertWorkspaceOwnership(chat.workspaceId, ctx.userId);

      return db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(messages.createdAt);
    }),
});
