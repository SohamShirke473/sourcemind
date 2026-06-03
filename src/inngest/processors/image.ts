export function processImage(title: string, fileUrl: string | null): string {
  return `![${title}](${fileUrl})`;
}
