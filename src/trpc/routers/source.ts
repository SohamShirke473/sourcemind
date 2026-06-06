import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { sources, workspaces } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { deleteFile, getUploadUrl as r2GetUploadUrl } from "@/lib/r2";
import { authProcedure, createTRPCRouter } from "../init";
import { assertWorkspaceOwnership } from "../utils";

function getSourceTypeFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["docx", "pptx", "xlsx", "odt", "odp", "ods", "rtf", "csv"].includes(ext))
    return "document";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return "image";
  return "code";
}

export const sourceRouter = createTRPCRouter({
  list: authProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);
      return db
        .select({
          id: sources.id,
          type: sources.type,
          title: sources.title,
          fileUrl: sources.fileUrl,
          sourceUrl: sources.sourceUrl,
          status: sources.status,
          metadata: sources.metadata,
          createdAt: sources.createdAt,
          updatedAt: sources.updatedAt,
        })
        .from(sources)
        .where(eq(sources.workspaceId, input.workspaceId))
        .orderBy(desc(sources.createdAt));
    }),

  create: authProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        type: z.enum(["text", "url", "youtube"]),
        title: z.string().max(500),
        sourceUrl: z.string().optional(),
        rawContent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);

      if (input.type === "url" && !input.sourceUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "sourceUrl is required for url type",
        });
      }
      if (input.type === "youtube" && !input.sourceUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "sourceUrl is required for youtube type",
        });
      }
      if (input.type === "text" && !input.rawContent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "rawContent is required for text type",
        });
      }

      const [source] = await db
        .insert(sources)
        .values({
          workspaceId: input.workspaceId,
          type: input.type,
          title: input.title,
          sourceUrl: input.sourceUrl ?? null,
          rawContent: input.rawContent ?? null,
          status: "processing",
        })
        .returning();

      await inngest.send({
        name: "source/created",
        data: { sourceId: source.id, workspaceId: source.workspaceId },
      });

      return source;
    }),

  getUploadUrl: authProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);
      const key = `workspaces/${input.workspaceId}/sources/${crypto.randomUUID()}-${input.fileName}`;
      const uploadUrl = await r2GetUploadUrl(key, input.contentType);

      return { uploadUrl, key };
    }),

  confirmUpload: authProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        key: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceOwnership(input.workspaceId, ctx.userId);

      const type = getSourceTypeFromFileName(input.fileName);

      const [source] = await db
        .insert(sources)
        .values({
          workspaceId: input.workspaceId,
          type: type as "pdf" | "document" | "code" | "image",
          title: input.fileName,
          fileUrl: input.key,
          metadata: { fileName: input.fileName, fileSize: input.fileSize },
          status: "processing",
        })
        .returning();

      await inngest.send({
        name: "source/created",
        data: { sourceId: source.id, workspaceId: source.workspaceId },
      });

      return source;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [source] = await db
        .select({
          id: sources.id,
          fileUrl: sources.fileUrl,
          workspaceId: sources.workspaceId,
          userId: workspaces.userId,
        })
        .from(sources)
        .innerJoin(workspaces, eq(workspaces.id, sources.workspaceId))
        .where(eq(sources.id, input.id))
        .limit(1);

      if (!source || source.userId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (source.fileUrl) {
        await deleteFile(source.fileUrl).catch(() => {});
      }

      await db.delete(sources).where(eq(sources.id, input.id));

      return { success: true };
    }),
});
