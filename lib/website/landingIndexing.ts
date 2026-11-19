/** Managed campaign pages are private to paid traffic unless explicitly opted in. */
export function isIndexableLandingContent(content: unknown): boolean {
  return Boolean(content && typeof content === "object" && !Array.isArray(content) &&
    (content as Record<string, unknown>).indexable === true);
}
