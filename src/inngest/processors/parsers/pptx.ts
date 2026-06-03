import { mkdtempSync, rmSync, writeFileSync } from "fs";
import PptxParser from "node-pptx-parser";
import { tmpdir } from "os";
import { join } from "path";

export async function parsePptx(buffer: Buffer): Promise<string> {
  const tmpDir = mkdtempSync(join(tmpdir(), "pptx-"));
  const tmpFile = join(tmpDir, "slide.pptx");
  writeFileSync(tmpFile, buffer);

  try {
    const parser = new PptxParser(tmpFile);
    const slides = await parser.extractText();

    return slides
      .map((slide) => `## Slide ${slide.id}\n\n${slide.text.join("\n")}`)
      .join("\n\n");
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
}
