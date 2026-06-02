export function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function cleanTranscriptText(transcript: { text: string }[]): string {
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

export const EXT_TO_LANG: Record<string, string> = {
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

export function wrapCodeFile(text: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "md" || ext === "txt") return text;
  const lang = EXT_TO_LANG[ext] || "";
  return `\`\`\`${lang}\n${text}\n\`\`\``;
}

export type FirecrawlResult = {
  markdown?: string;
  data?: { content?: string };
  content?: string;
};
