import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import db from "@/db";
import { sourceChunks, sources } from "@/db/schema";
import { chunkText } from "@/lib/chunk";
import { inngest } from "../client";
import { processCode } from "../processors/code";
import { processDocument } from "../processors/document";
import { processImage } from "../processors/image";
import { processUrl } from "../processors/url";
import { processYoutube } from "../processors/youtube";

export const processSource = inngest.createFunction(
  { id: "process-source", triggers: { event: "source/created" } },
  async ({ event, step }) => {
    const { sourceId } = event.data;

    const source = await step.run("get-source", async () => {
      const [result] = await db
        .select()
        .from(sources)
        .where(eq(sources.id, sourceId as string))
        .limit(1);
      return result;
    });

    if (!source || source.status !== "processing") {
      return { skipped: true };
    }

    try {
      let rawContent: string;

      if (source.type === "url") {
        if (!source.sourceUrl) {
          throw new Error("Missing sourceUrl");
        }
        rawContent = await step.run("scrape-url", () =>
          processUrl(source.sourceUrl!),
        );
      } else if (source.type === "youtube") {
        if (!source.sourceUrl) throw new Error("Missing sourceUrl");
        rawContent = await step.run("fetch-transcript", () =>
          processYoutube(source.sourceUrl!),
        );
      } else if (source.type === "pdf" || source.type === "document") {
        if (!source.fileUrl) throw new Error("Missing fileUrl");
        rawContent = await step.run("parse-file", () =>
          processDocument(
            source.fileUrl!,
            source.metadata as Record<string, unknown> | null,
          ),
        );
      } else if (source.type === "code") {
        if (!source.fileUrl) throw new Error("Missing fileUrl");
        rawContent = await step.run("read-code-file", () =>
          processCode(
            source.fileUrl!,
            source.metadata as Record<string, unknown> | null,
            source.title,
          ),
        );
      } else if (source.type === "text") {
        if (!source.rawContent) throw new Error("Missing rawContent");
        rawContent = source.rawContent;
      } else if (source.type === "image") {
        rawContent = processImage(source.title, source.fileUrl);
      } else {
        return { error: `Unknown source type: ${source.type}` };
      }

      await step.run("mark-ready", async () => {
        await db
          .update(sources)
          .set({ rawContent, status: "ready", updatedAt: new Date() })
          .where(eq(sources.id, sourceId as string));
      });

      await step.run("chunk-and-embed", async () => {
        const chunks = chunkText(rawContent);
        const { embeddings } = await embedMany({
          model: "voyage/voyage-4-lite",
          values: chunks,
        });
        await db.insert(sourceChunks).values(
          chunks.map((text, i) => ({
            sourceId: sourceId,
            workspaceId: source.workspaceId,
            chunkText: text,
            chunkIndex: i,
            embedding: embeddings[i],
            metadata: {},
          })),
        );
      });

      return { processed: true, type: source.type };
    } catch (error) {
      await step.run("mark-failed", async () => {
        await db
          .update(sources)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(sources.id, sourceId as string));
      });

      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);
