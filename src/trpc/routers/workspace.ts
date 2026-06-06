import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { workspaces, sources } from "@/db/schema";
import { authProcedure, createTRPCRouter } from "../init";

export const workspaceRouter = createTRPCRouter({
  list: authProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(workspaces.userId, ctx.userId)];
      if (input.search) {
        conditions.push(
          sql`(${ilike(workspaces.title, `%${input.search}%`)} OR ${ilike(workspaces.description, `%${input.search}%`)})`,
        );
      }
      return db
        .select({
          id: workspaces.id,
          userId: workspaces.userId,
          title: workspaces.title,
          description: workspaces.description,
          emoji: workspaces.emoji,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
          sourceCount: sql<number>`count(${sources.id})::int`,
        })
        .from(workspaces)
        .leftJoin(sources, eq(workspaces.id, sources.workspaceId))
        .where(and(...conditions))
        .groupBy(workspaces.id)
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
