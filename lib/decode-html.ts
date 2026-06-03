import he from "he";

/** Decode HTML entities for safe use in dangerouslySetInnerHTML (server or client). */
export function decodeHtml(html: string): string {
  if (!html) return "";
  return he.decode(html);
}
