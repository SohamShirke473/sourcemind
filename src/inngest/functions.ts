import { eq } from "drizzle-orm";
import { Firecrawl } from "firecrawl";
import { YoutubeTranscript } from "youtube-transcript";
import db from "@/db";
import { sources } from "@/db/schema";
import { downloadFileBuffer } from "@/lib/r2";
import { inngest } from "./client";

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanTranscriptText(transcript: { text: string }[]): string {
  return transcript
    .map((item) => decodeHtml(item.text))
    .join(" ")
    .replace(/\n/g, " ")
    .replace(/♪/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const EXT_TO_LANG: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescriptreact",
  jsx: "javascriptreact",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  sh: "bash",
  sql: "sql",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  md: "markdown",
  txt: "text",
  html: "html",
  svelte: "svelte",
  vue: "vue",
  dart: "dart",
  r: "r",
};

function wrapCodeFile(text: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "md" || ext === "txt") return text;
  const lang = EXT_TO_LANG[ext] || "";
  return `\`\`\`${lang}\n${text}\n\`\`\``;
}

export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("pause", "1s");

    return { message: `Task ${event.data.id} complete`, result };
  },
);

type FirecrawlResult = {
  markdown?: string;
  data?: { content?: string };
  content?: string;
};

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
        if (!source.sourceUrl || !process.env.FIRECRAWL_API_KEY) {
          throw new Error("Missing sourceUrl or FIRECRAWL_API_KEY");
        }
        const apiKey = process.env.FIRECRAWL_API_KEY;
        const sourceUrl = source.sourceUrl;
        rawContent = await step.run("scrape-url", async () => {
          const firecrawl = new Firecrawl({ apiKey });
          const result = (await firecrawl.scrapeUrl(sourceUrl, {
            formats: ["markdown"],
          })) as FirecrawlResult;
          return (
            result.markdown || result.data?.content || result.content || ""
          );
        });
      } else if (source.type === "youtube") {
        if (!source.sourceUrl) throw new Error("Missing sourceUrl");
        const ytUrl = source.sourceUrl;
        rawContent = await step.run("fetch-transcript", async () => {
          const transcript = await YoutubeTranscript.fetchTranscript(ytUrl);
          return cleanTranscriptText(transcript);
        });
      } else if (source.type === "pdf" || source.type === "document") {
        if (!source.fileUrl) throw new Error("Missing fileUrl");
        const pdfUrl = source.fileUrl;
        rawContent = await step.run("parse-file", async () => {
          const buffer = await downloadFileBuffer(pdfUrl);
          const { OfficeConverter } = await import("officeparser");
          const { value } = await OfficeConverter.convert(buffer, "md");
          return value as string;
        });
      } else if (source.type === "code") {
        if (!source.fileUrl) throw new Error("Missing fileUrl");
        const codeUrl = source.fileUrl;
        rawContent = await step.run("read-code-file", async () => {
          const buffer = await downloadFileBuffer(codeUrl);
          const text = buffer.toString("utf-8");
          const metadata = source.metadata as Record<string, unknown> | null;
          const fileName =
            (metadata?.fileName as string) || source.title || "file";
          return wrapCodeFile(text, fileName);
        });
      } else if (source.type === "image") {
        rawContent = `![${source.title}](${source.fileUrl})`;
      } else {
        return { error: `Unknown source type: ${source.type}` };
      }

      await step.run("mark-ready", async () => {
        await db
          .update(sources)
          .set({ rawContent, status: "ready", updatedAt: new Date() })
          .where(eq(sources.id, sourceId as string));
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
