import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { chats, messages } from "@/db/schema";
import { authProcedure, createTRPCRouter } from "../init";
import { assertWorkspaceOwnership } from "../utils";

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
      if (!chat) throw new TRPCError({ code: "NOT_FOUND" });
      await assertWorkspaceOwnership(chat.workspaceId, ctx.userId);
      await db.delete(chats).where(eq(chats.id, input.id));
      return { success: true };
    }),

  getMessages: authProcedure
    .input(
      z.object({
        chatId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [chat] = await db
        .select({ workspaceId: chats.workspaceId })
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);
      if (!chat) throw new TRPCError({ code: "NOT_FOUND" });
      await assertWorkspaceOwnership(chat.workspaceId, ctx.userId);

      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit + 1)
        .offset(input.offset);

      const hasMore = rows.length > input.limit;
      const result = hasMore ? rows.slice(0, input.limit) : rows;
      result.reverse();

      return { messages: result, hasMore };
    }),
});
