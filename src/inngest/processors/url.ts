import { Firecrawl } from "firecrawl";
import { env } from "@/env";
import type { FirecrawlResult } from "../utils";

export async function processUrl(sourceUrl: string): Promise<string> {
  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });
  const result = (await firecrawl.scrapeUrl(sourceUrl, {
    formats: ["markdown"],
  })) as FirecrawlResult;
  return result.markdown || result.data?.content || result.content || "";
}
