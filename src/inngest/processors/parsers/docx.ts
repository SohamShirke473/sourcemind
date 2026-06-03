export async function parseDocx(buffer: Buffer): Promise<string> {
  const { extractRawText } = await import("mammoth");
  const { value } = await extractRawText({ buffer });
  return value;
}
