import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { artifacts, workspaces } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { authProcedure, createTRPCRouter } from "../init";
import { assertWorkspaceOwnership } from "../utils";
import { deleteFile } from "@/lib/r2";

const artifactTypeEnum = z.enum([
  "ppt",
  "audio",
  "mindmap",
  "flashcard",
  "quiz",
  "report",
]);

export const artifactRouter = createTRPCRouter({
  list: authProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);
      return db
        .select({
          id: artifacts.id,
          type: artifacts.type,
          title: artifacts.title,
          content: artifacts.content,
          status: artifacts.status,
          createdAt: artifacts.createdAt,
          updatedAt: artifacts.updatedAt,
        })
        .from(artifacts)
        .where(eq(artifacts.workspaceId, input.workspaceId))
        .orderBy(desc(artifacts.createdAt));
    }),

  generate: authProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        type: artifactTypeEnum,
        title: z.string().max(255),
        sourceIds: z.array(z.string()),
        prompt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);

      const [artifact] = await db
        .insert(artifacts)
        .values({
          workspaceId: input.workspaceId,
          type: input.type,
          title: input.title,
          status: "generating",
        })
        .returning();

      await inngest.send({
        name: "artifact/generate",
        data: {
          artifactId: artifact.id,
          workspaceId: input.workspaceId,
          sourceIds: input.sourceIds,
          prompt: input.prompt ?? "",
        },
      });

      return artifact;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [artifact] = await db
        .select({
          id: artifacts.id,
          workspaceId: artifacts.workspaceId,
          fileUrl: artifacts.fileUrl,
          userId: workspaces.userId,
        })
        .from(artifacts)
        .innerJoin(workspaces, eq(workspaces.id, artifacts.workspaceId))
        .where(eq(artifacts.id, input.id))
        .limit(1);

      if (!artifact || artifact.userId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (artifact.fileUrl) {
        await deleteFile(artifact.fileUrl).catch(() => {});
      }

      await db.delete(artifacts).where(eq(artifacts.id, input.id));
      return { success: true };
    }),
});
