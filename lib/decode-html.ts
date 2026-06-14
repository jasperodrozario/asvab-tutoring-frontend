import he from "he";

/** Decode HTML entities for safe use in dangerouslySetInnerHTML (server or client). */
export function decodeHtml(html: string): string {
  if (!html) return "";
  return he.decode(html);
}

/** Decode repeatedly until stable (handles double-encoded API content). */
export function decodeHtmlEntitiesDeep(input: string, maxPasses = 6): string {
  if (!input) return "";
  let prev = "";
  let cur = input;
  for (let i = 0; i < maxPasses && cur !== prev; i++) {
    prev = cur;
    cur = he.decode(cur);
  }
  return cur;
}

/** Strip HTML tags and collapse whitespace for excerpts. */
export function stripHtmlToText(html: string): string {
  const decoded = decodeHtmlEntitiesDeep(html || "");
  const text = decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

/** Prepare API HTML for dangerouslySetInnerHTML. */
export function processHtmlContent(htmlString: string): string {
  if (!htmlString) return "";
  return decodeHtmlEntitiesDeep(htmlString);
}
