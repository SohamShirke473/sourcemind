import { Firecrawl } from "firecrawl";
import type { FirecrawlResult } from "../utils";

export async function processUrl(
  sourceUrl: string,
): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY");
  }
  const firecrawl = new Firecrawl({ apiKey });
  const result = (await firecrawl.scrapeUrl(sourceUrl, {
    formats: ["markdown"],
  })) as FirecrawlResult;
  return (
    result.markdown || result.data?.content || result.content || ""
  );
}
