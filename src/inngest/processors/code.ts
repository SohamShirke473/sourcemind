import { downloadFileBuffer } from "@/lib/r2";
import { wrapCodeFile } from "../utils";

export async function processCode(
  fileUrl: string,
  metadata: Record<string, unknown> | null,
  title: string,
): Promise<string> {
  const buffer = await downloadFileBuffer(fileUrl);
  const text = buffer.toString("utf-8");
  const fileName = (metadata?.fileName as string) || title || "file";
  return wrapCodeFile(text, fileName);
}
