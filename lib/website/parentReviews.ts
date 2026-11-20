import type { PublicGalleryMedia } from "@/lib/sanity/gallery";

export const PARENT_REVIEW_ALBUM_SLUG = "parent-reviews-testimonials";

export type CampaignParentReview = {
  id: string;
  poster: string;
  thumbnail: string;
  source: string;
  publicUrl: string;
  provider: "VIDEO" | "INSTAGRAM" | "YOUTUBE";
};

function mediaUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, "https://kidzeedwarka.com");
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (!["kidzeedwarka.com", "cdn.sanity.io", "firebasestorage.googleapis.com", "storage.googleapis.com"].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

// Only pass published media returned by getPublishedGalleryAlbumBySlug.
// Keep gallery ordering; never fabricate reviews or fall back to an unrelated video.
export function getCampaignParentReviews(media: PublicGalleryMedia[] = []): CampaignParentReview[] {
  const seen = new Set<string>();
  return media.flatMap((item) => {
    if (item.mediaType !== "VIDEO") return [];
    const poster = mediaUrl(item.imageUrl) || mediaUrl(item.thumbnailUrl);
    if (!poster) return [];
    let provider: CampaignParentReview["provider"] = "VIDEO";
    let source = mediaUrl(item.videoUrl);
    let publicUrl = source;
    if (!source && item.embedUrl) {
      try {
        const url = new URL(item.embedUrl);
        if (url.protocol !== "https:" || url.username || url.password || url.port) return [];
        const instagram = url.pathname.match(/^\/(?:reel|reels|p)\/([A-Za-z0-9_-]{5,64})\/?$/);
        if (item.embedProvider === "INSTAGRAM" && ["www.instagram.com", "instagram.com"].includes(url.hostname) && instagram) {
          provider = "INSTAGRAM";
          const kind = url.pathname.startsWith("/p/") ? "p" : "reel";
          publicUrl = `https://www.instagram.com/${kind}/${instagram[1]}/`;
          source = publicUrl + "embed/";
        } else if (item.embedProvider === "YOUTUBE" && ["www.youtube.com", "youtube.com", "youtu.be"].includes(url.hostname)) {
          const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)\/?$/)?.[1];
          if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return [];
          provider = "YOUTUBE";
          publicUrl = `https://www.youtube.com/watch?v=${id}`;
          source = `https://www.youtube-nocookie.com/embed/${id}`;
        }
      } catch { return []; }
    }
    if (!source || !publicUrl) return [];
    const identity = new URL(source);
    identity.search = "";
    if (seen.has(identity.href)) return [];
    seen.add(identity.href);
    return [{ id: item._id, poster, thumbnail: mediaUrl(item.thumbnailUrl) || poster, source, publicUrl, provider }];
  });
}
