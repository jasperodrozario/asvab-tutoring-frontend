/**
 * PHP sometimes prepends debug SQL / notices before the JSON object.
 * Slice from the first `{` through the last `}` so callers can still read it.
 */
export function parsePhpJsonText<T = unknown>(raw: string): T | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const candidate =
    start >= 0 && end > start ? text.slice(start, end + 1) : text;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
