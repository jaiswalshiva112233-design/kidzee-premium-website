/** Keep gallery summaries readable rather than cutting the last word in half. */
export function conciseMetaDescription(value: string, limit = 155) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const boundary = text.lastIndexOf(" ", limit - 1);
  return text.slice(0, boundary > 0 ? boundary : limit - 1).replace(/[\s,;:]+$/, "") + "…";
}
