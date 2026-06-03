import { downloadFileBuffer } from "@/lib/r2";
import { parseDocx } from "./parsers/docx";
import { parsePdf } from "./parsers/pdf";
import { parsePptx } from "./parsers/pptx";

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export async function processDocument(
  fileUrl: string,
  metadata?: Record<string, unknown> | null,
): Promise<string> {
  const fileName = (metadata?.fileName as string) || fileUrl;
  const ext = getExtension(fileName);
  const buffer = await downloadFileBuffer(fileUrl);

  switch (ext) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "pptx":
      return parsePptx(buffer);
    default:
      throw new Error(`Unsupported document type: .${ext}`);
  }
}
