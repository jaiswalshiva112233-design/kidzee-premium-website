const INSTAGRAM_CANONICAL_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

const INSTAGRAM_RESOLVABLE_HOSTS = new Set([
  ...INSTAGRAM_CANONICAL_HOSTS,
  "instagr.am",
  "www.instagr.am",
]);

const INSTAGRAM_SHORTCODE = /^[A-Za-z0-9_-]{5,64}$/;

export type NormalizedInstagramEmbed = {
  provider: "INSTAGRAM";
  shortcode: string;
  kind: "reel" | "p";
  publicUrl: string;
  embedUrl: string;
  duplicateKey: string;
};

function withWebScheme(value: string) {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function safeInstagramUrl(value: unknown, hosts: Set<string>) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > 1_000) return null;
  let url: URL;
  try {
    url = new URL(withWebScheme(raw));
  } catch {
    return null;
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !hosts.has(url.hostname.toLowerCase()) ||
    (url.port && !["80", "443"].includes(url.port))
  ) {
    return null;
  }
  url.protocol = "https:";
  url.port = "";
  return url;
}

/** Client-safe normalizer for direct Reel/Post URLs. */
export function normalizeInstagramEmbedUrl(
  value: unknown,
): NormalizedInstagramEmbed | null {
  const url = safeInstagramUrl(value, INSTAGRAM_CANONICAL_HOSTS);
  if (!url) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (!["reel", "reels", "p"].includes(segments[0] ?? "")) return null;
  const kind: "reel" | "p" = segments[0] === "p" ? "p" : "reel";
  const remaining = segments.slice(2);

  let shortcode: string;
  try {
    shortcode = decodeURIComponent(segments[1] ?? "");
  } catch {
    return null;
  }
  if (
    !INSTAGRAM_SHORTCODE.test(shortcode) ||
    (remaining.length > 0 &&
      !(remaining.length === 1 && remaining[0].toLowerCase() === "embed"))
  ) {
    return null;
  }

  const publicUrl = `https://www.instagram.com/${kind}/${shortcode}/`;
  return {
    provider: "INSTAGRAM",
    shortcode,
    kind,
    publicUrl,
    embedUrl: `${publicUrl}embed/`,
    duplicateKey: `instagram:${shortcode}`,
  };
}

/** Recognises redirect/share forms without treating their token as a shortcode. */
export function normalizeInstagramShareUrl(value: unknown) {
  const url = safeInstagramUrl(value, INSTAGRAM_RESOLVABLE_HOSTS);
  if (!url) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const isInstagramShare =
    INSTAGRAM_CANONICAL_HOSTS.has(url.hostname.toLowerCase()) &&
    segments[0] === "share" &&
    ["reel", "reels", "p"].includes(segments[1] ?? "") &&
    Boolean(segments[2]) &&
    segments.length === 3;
  const isShortHost = ["instagr.am", "www.instagr.am"].includes(
    url.hostname.toLowerCase(),
  );
  return isInstagramShare || isShortHost ? url.toString() : null;
}

export class InstagramShareResolutionError extends Error {
  readonly code:
    | "UNSAFE_REDIRECT"
    | "NOT_RESOLVED"
    | "TIMEOUT"
    | "NETWORK";

  constructor(code: InstagramShareResolutionError["code"]) {
    super(code);
    this.code = code;
    this.name = "InstagramShareResolutionError";
  }
}

function extractCanonicalInstagramUrl(html: string) {
  const candidates = [
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
  ];
  for (const pattern of candidates) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].replaceAll("&amp;", "&");
  }
  return null;
}

export async function resolveInstagramEmbedUrl(
  value: unknown,
  options: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxRedirects?: number;
  } = {},
) {
  const direct = normalizeInstagramEmbedUrl(value);
  if (direct) return direct;
  const shareUrl = normalizeInstagramShareUrl(value);
  if (!shareUrl) return null;

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = Math.max(500, Math.min(options.timeoutMs ?? 4_000, 10_000));
  const maxRedirects = Math.max(1, Math.min(options.maxRedirects ?? 3, 5));
  let current = shareUrl;

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    const currentUrl = safeInstagramUrl(current, INSTAGRAM_RESOLVABLE_HOSTS);
    if (!currentUrl) throw new InstagramShareResolutionError("UNSAFE_REDIRECT");
    const alreadyCanonical = normalizeInstagramEmbedUrl(currentUrl.toString());
    if (alreadyCanonical) return alreadyCanonical;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "CentreOS-Instagram-Link-Resolver/1.0",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new InstagramShareResolutionError("TIMEOUT");
      }
      throw new InstagramShareResolutionError("NETWORK");
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new InstagramShareResolutionError("NOT_RESOLVED");
      const next = new URL(location, currentUrl);
      if (!safeInstagramUrl(next.toString(), INSTAGRAM_RESOLVABLE_HOSTS)) {
        throw new InstagramShareResolutionError("UNSAFE_REDIRECT");
      }
      current = next.toString();
      continue;
    }

    if (!response.ok) throw new InstagramShareResolutionError("NOT_RESOLVED");
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > 2_000_000) throw new InstagramShareResolutionError("NOT_RESOLVED");
    const html = (await response.text()).slice(0, 2_000_000);
    const canonical = extractCanonicalInstagramUrl(html);
    const normalized = canonical ? normalizeInstagramEmbedUrl(canonical) : null;
    if (normalized) return normalized;
    throw new InstagramShareResolutionError("NOT_RESOLVED");
  }

  throw new InstagramShareResolutionError("NOT_RESOLVED");
}

export function looksLikeInstagramLink(value: unknown) {
  return (
    typeof value === "string" &&
    /(?:instagram(?:\.com)?|instagr\.am)/i.test(value.trim())
  );
}
