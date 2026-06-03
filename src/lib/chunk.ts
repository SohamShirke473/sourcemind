import { encoding_for_model } from "tiktoken";

const SEPARATORS = ["\n\n\n", "\n\n", "\n", ". ", " "];

function tokenCount(
  enc: ReturnType<typeof encoding_for_model>,
  text: string,
): number {
  return enc.encode(text).length;
}

function split(
  enc: ReturnType<typeof encoding_for_model>,
  text: string,
  sepIdx: number,
  maxTokens: number,
): string[] {
  if (sepIdx >= SEPARATORS.length) {
    const result: string[] = [];
    let current = "";
    for (const char of text) {
      current += char;
      if (tokenCount(enc, current) >= maxTokens) {
        result.push(current);
        current = "";
      }
    }
    if (current) result.push(current);
    return result;
  }

  const parts = text.split(SEPARATORS[sepIdx]);
  const result: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? `${current}${SEPARATORS[sepIdx]}${part}` : part;
    const count = tokenCount(enc, candidate);

    if (count > maxTokens && current) {
      result.push(current);
      current = part;
    } else if (count > maxTokens) {
      result.push(...split(enc, part, sepIdx + 1, maxTokens));
      current = "";
    } else {
      current = candidate;
    }
  }

  if (current) result.push(current);
  return result;
}

export function chunkText(
  text: string,
  maxTokens = 1000,
  overlapTokens = 100,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const enc = encoding_for_model("text-embedding-3-small");

  try {
    const chunks = split(enc, trimmed, 0, maxTokens);

    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        const prevTokens = enc.encode(chunks[i - 1]);
        if (prevTokens.length > overlapTokens) {
          chunks[i] =
            new TextDecoder().decode(
              enc.decode(prevTokens.slice(-overlapTokens)),
            ) + chunks[i];
        }
      }
    }

    return chunks;
  } finally {
    enc.free();
  }
}
