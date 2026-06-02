import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { workspaces } from "@/db/schema";
import { authProcedure, createTRPCRouter } from "../init";

export const workspaceRouter = createTRPCRouter({
  list: authProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, ctx.userId))
      .orderBy(desc(workspaces.updatedAt));
  }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(
          and(eq(workspaces.id, input.id), eq(workspaces.userId, ctx.userId)),
        )
        .limit(1);
      return workspace ?? null;
    }),

  create: authProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        emoji: z.string().max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [workspace] = await db
        .insert(workspaces)
        .values({
          userId: ctx.userId,
          title: input.title,
          description: input.description ?? null,
          emoji: input.emoji ?? null,
        })
        .returning();
      return workspace;
    }),

  update: authProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        emoji: z.string().max(10).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [workspace] = await db
        .update(workspaces)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(workspaces.id, id), eq(workspaces.userId, ctx.userId)))
        .returning();
      return workspace;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [workspace] = await db
        .delete(workspaces)
        .where(
          and(eq(workspaces.id, input.id), eq(workspaces.userId, ctx.userId)),
        )
        .returning({ id: workspaces.id });
      return { success: !!workspace };
    }),
});
