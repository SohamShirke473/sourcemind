import { downloadFileBuffer } from "@/lib/r2";

export async function processDocument(
  fileUrl: string,
): Promise<string> {
  const buffer = await downloadFileBuffer(fileUrl);
  const { OfficeConverter } = await import("officeparser");
  const { value } = await OfficeConverter.convert(buffer, "md");
  return value as string;
}
